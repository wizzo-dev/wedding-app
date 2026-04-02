import { prisma } from '../models/db.js'

const RSVP_STATUSES = ['pending', 'confirmed', 'declined', 'maybe']
const SIDES = ['חתן', 'כלה', 'משותף']

export default async function guestRoutes(app) {

  // ── GET /api/guests — list with optional filters ─────────────────────────────
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { search, status, side } = req.query

    const where = { userId }

    if (status && RSVP_STATUSES.includes(status)) {
      where.rsvpStatus = status
    }

    if (side && SIDES.includes(side)) {
      where.side = side
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { groupName: { contains: search } }
      ]
    }

    const [guests, all] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: { table: { select: { id: true, name: true } } },
        orderBy: [{ side: 'asc' }, { name: 'asc' }]
      }),
      prisma.guest.findMany({ where: { userId } })
    ])

    const stats = {
      total: all.length,
      totalPeople: all.reduce((s, g) => s + g.numPeople, 0),
      confirmed: all.filter(g => g.rsvpStatus === 'confirmed').length,
      declined:  all.filter(g => g.rsvpStatus === 'declined').length,
      maybe:     all.filter(g => g.rsvpStatus === 'maybe').length,
      pending:   all.filter(g => g.rsvpStatus === 'pending').length
    }

    return {
      guests: guests.map(g => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        email: g.email,
        side: g.side,
        groupName: g.groupName,
        rsvpStatus: g.rsvpStatus,
        numPeople: g.numPeople,
        notes: g.notes,
        tableId: g.tableId,
        tableName: g.table?.name || null,
        giftAmount: g.giftAmount,
        createdAt: g.createdAt
      })),
      stats
    }
  })

  // ── GET /api/guests/stats ─────────────────────────────────────────────────────
  app.get('/stats', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const all = await prisma.guest.findMany({
      where: { userId },
      select: { rsvpStatus: true, numPeople: true, giftAmount: true, side: true, groupName: true }
    })
    const confirmed = all.filter(g => g.rsvpStatus === 'confirmed')
    const declined  = all.filter(g => g.rsvpStatus === 'declined')
    const pending   = all.filter(g => g.rsvpStatus === 'pending')
    const maybe     = all.filter(g => g.rsvpStatus === 'maybe')
    const sides = { חתן: 0, כלה: 0, משותף: 0 }
    all.forEach(g => { if (sides[g.side] !== undefined) sides[g.side]++ })
    const groupMap = {}
    all.forEach(g => {
      const key = g.groupName || 'ללא קבוצה'
      if (!groupMap[key]) groupMap[key] = { name: key, count: 0, people: 0 }
      groupMap[key].count++
      groupMap[key].people += g.numPeople
    })
    const totalGifts  = all.reduce((s, g) => s + (g.giftAmount || 0), 0)
    const giftedCount = all.filter(g => g.giftAmount && g.giftAmount > 0).length
    return {
      total: all.length,
      totalPeople: all.reduce((s, g) => s + g.numPeople, 0),
      confirmed: confirmed.length,
      confirmedPeople: confirmed.reduce((s, g) => s + g.numPeople, 0),
      declined: declined.length,
      declinedPeople: declined.reduce((s, g) => s + g.numPeople, 0),
      pending: pending.length,
      maybe: maybe.length,
      sides,
      groups: Object.values(groupMap).sort((a, b) => b.count - a.count),
      gifts: { total: totalGifts, count: giftedCount, average: giftedCount > 0 ? Math.round(totalGifts / giftedCount) : 0 }
    }
  })

  // ── POST /api/guests/preview (xlsx parse preview — לא שומר ל-DB) ─────────────
  app.post('/preview', { preHandler: [app.authenticate] }, async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'NO_FILE' })
    const buffer = await data.toBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
    const headers = rows[0] || []
    const preview = rows.slice(1, 6).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])))
    return { headers, preview, totalRows: rows.length - 1 }
  })

  // ── POST /api/guests/import (שומר ל-DB) ──────────────────────────────────────
  app.post('/import', {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
  }, async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'NO_FILE' })
    const buffer = await data.toBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws)
    if (rows.length > 500) return reply.code(400).send({ error: 'TOO_MANY_ROWS', max: 500 })
    const results = { imported: 0, skipped: 0, errors: [] }
    for (const row of rows) {
      const name  = row['שם'] || row['שם מלא'] || row['name'] || row['Name']
      const phone = row['טלפון'] || row['phone'] || row['Phone']
      if (!name) { results.skipped++; continue }
      try {
        await prisma.guest.create({
          data: {
            userId: req.user.userId,
            name: String(name).trim(),
            phone: phone ? String(phone).trim() : null,
            numPeople: 1,
            rsvpStatus: 'pending'
          }
        })
        results.imported++
      } catch (e) {
        results.errors.push({ name, error: e.message })
      }
    }
    return results
  })

  // ── POST /api/guests ──────────────────────────────────────────────────────────
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { name, phone, email, side, groupName, rsvpStatus, numPeople, notes } = req.body

    if (!name || name.trim().length === 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם אורח נדרש' })
    }

    const guest = await prisma.guest.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        side: side && SIDES.includes(side) ? side : 'חתן',
        groupName: groupName || null,
        rsvpStatus: rsvpStatus && RSVP_STATUSES.includes(rsvpStatus) ? rsvpStatus : 'pending',
        numPeople: Number(numPeople) || 1,
        notes: notes || null
      }
    })

    return { ...guest, tableName: null }
  })

  // ── POST /api/guests/bulk ─────────────────────────────────────────────────────
  app.post('/bulk', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { guests: list } = req.body

    if (!Array.isArray(list) || list.length === 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'רשימת אורחים נדרשת' })
    }

    const created = await prisma.guest.createMany({
      data: list
        .filter(g => g.name && g.name.trim())
        .map(g => ({
          userId,
          name: g.name.trim(),
          phone: g.phone || null,
          email: g.email || null,
          side: g.side && SIDES.includes(g.side) ? g.side : 'חתן',
          groupName: g.groupName || null,
          rsvpStatus: g.rsvpStatus && RSVP_STATUSES.includes(g.rsvpStatus) ? g.rsvpStatus : 'pending',
          numPeople: Number(g.numPeople) || 1,
          notes: g.notes || null
        }))
    })

    return { count: created.count, message: `${created.count} אורחים נוספו בהצלחה` }
  })

  // ── GET /api/guests/:id ───────────────────────────────────────────────────────
  app.get('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)

    const guest = await prisma.guest.findFirst({
      where: { id, userId },
      include: { table: { select: { id: true, name: true } } }
    })

    if (!guest) return reply.code(404).send({ error: 'NOT_FOUND', message: 'אורח לא נמצא' })
    return { ...guest, tableName: guest.table?.name || null }
  })

  // ── PUT /api/guests/:id ───────────────────────────────────────────────────────
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)
    const { name, phone, email, side, groupName, rsvpStatus, numPeople, notes, giftAmount } = req.body

    const existing = await prisma.guest.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'אורח לא נמצא' })

    const updated = await prisma.guest.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(side !== undefined && SIDES.includes(side) && { side }),
        ...(groupName !== undefined && { groupName: groupName || null }),
        ...(rsvpStatus !== undefined && RSVP_STATUSES.includes(rsvpStatus) && { rsvpStatus }),
        ...(numPeople !== undefined && { numPeople: Number(numPeople) || 1 }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(giftAmount !== undefined && { giftAmount: giftAmount ? Number(giftAmount) : null })
      },
      include: { table: { select: { id: true, name: true } } }
    })

    return { ...updated, tableName: updated.table?.name || null }
  })

  // ── DELETE /api/guests/:id ────────────────────────────────────────────────────
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)

    const existing = await prisma.guest.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'אורח לא נמצא' })

    await prisma.guest.delete({ where: { id } })
    return { success: true }
  })

  // ── PATCH /api/guests/:id/rsvp ────────────────────────────────────────────────
  app.patch('/:id/rsvp', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params
    const { rsvpStatus, numPeople } = req.body
    if (!rsvpStatus || !RSVP_STATUSES.includes(rsvpStatus)) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סטטוס RSVP לא תקין' })
    }
    const guest = await prisma.guest.findFirst({ where: { id: parseInt(id), userId: req.user.userId } })
    if (!guest) return reply.code(404).send({ error: 'NOT_FOUND' })
    return prisma.guest.update({
      where: { id: parseInt(id) },
      data: { rsvpStatus, ...(numPeople && { numPeople: Number(numPeople) }) }
    })
  })
}
