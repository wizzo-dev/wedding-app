import { prisma } from '../models/db.js'
import { randomBytes } from 'crypto'

const RSVP_STATUSES = ['pending', 'confirmed', 'declined', 'maybe']
const SIDES = ['חתן', 'כלה', 'משותף']

function generateGuestToken() {
  return randomBytes(4).toString('hex') // 8-char hex
}

// In-memory rate limit tracker for bulk import (userId → [timestamps])
const bulkImportRateMap = new Map()
const PHONE_REGEX = /^[+\d\s\-()\u200f]{7,20}$/

function checkBulkImportRateLimit(userId) {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const maxImports = 3
  const history = (bulkImportRateMap.get(userId) || []).filter(t => now - t < windowMs)
  if (history.length >= maxImports) return false
  history.push(now)
  bulkImportRateMap.set(userId, history)
  return true
}

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
        guestToken: g.guestToken,
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
        notes: notes || null,
        guestToken: generateGuestToken()
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

    // Rate limit: 3 imports per hour per user
    if (!checkBulkImportRateLimit(userId)) {
      return reply.code(429).send({ error: 'RATE_LIMIT', message: 'ניתן לבצע עד 3 ייבואים בשעה' })
    }

    // Hard cap: 500 guests per import
    if (list.length > 500) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'ניתן לייבא עד 500 אורחים בבת אחת' })
    }

    const valid = []
    const invalid = []

    for (let i = 0; i < list.length; i++) {
      const g = list[i]
      const rowErrors = []

      // Name is required
      if (!g.name || String(g.name).trim().length === 0) {
        rowErrors.push('שם חובה')
      }

      // Phone regex if provided
      if (g.phone && !PHONE_REGEX.test(String(g.phone))) {
        rowErrors.push('מספר טלפון לא תקין')
      }

      if (rowErrors.length > 0) {
        invalid.push({ row: i + 1, name: g.name || '', errors: rowErrors })
      } else {
        valid.push({
          userId,
          name: String(g.name).trim(),
          phone: g.phone || null,
          email: g.email || null,
          side: g.side && SIDES.includes(g.side) ? g.side : 'חתן',
          groupName: g.groupName || null,
          rsvpStatus: g.rsvpStatus && RSVP_STATUSES.includes(g.rsvpStatus) ? g.rsvpStatus : 'pending',
          numPeople: Number(g.numPeople) || 1,
          notes: g.notes || null
        })
      }
    }

    let created = { count: 0 }
    if (valid.length > 0) {
      created = await prisma.guest.createMany({ data: valid })
    }

    return {
      count: created.count,
      message: `${created.count} אורחים נוספו בהצלחה`,
      skipped: invalid.length,
      invalidRows: invalid
    }
  })

  // ── GET /api/guests/export ────────────────────────────────────────────────────
  app.get('/export', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { buildXlsx } = await import('../utils/export.js')
    const guests = await prisma.guest.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' }
    })
    const headers = ['שם', 'טלפון', 'צד', 'מספר מגיעים', 'סטטוס RSVP', 'מתנה (₪)', 'הערות']
    const rows = guests.map(g => [
      g.name, g.phone || '', g.side || '', g.numPeople || 1,
      g.rsvpStatus || 'pending', g.giftAmount || 0, g.notes || ''
    ])
    const buf = buildXlsx(headers, rows, 'אורחים')
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    reply.header('Content-Disposition', 'attachment; filename="guests.xlsx"')
    reply.send(buf)
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
