import { prisma } from '../models/db.js'

// Helper: get or create default layout for user
async function getOrCreateLayout(userId) {
  let layout = await prisma.hallLayout.findFirst({ where: { userId } })
  if (!layout) {
    layout = await prisma.hallLayout.create({
      data: {
        userId,
        name: 'האולם שלי',
        width: 1200,
        height: 800,
        bgColor: '#f9f5f0'
      }
    })
  }
  return layout
}

// Hebrew letters for table naming
const HEBREW_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת']

export default async function seatingRoutes(app) {

  // ── GET /api/seating/tables ────────────────────────────────────────────────
  app.get('/tables', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const layout = await getOrCreateLayout(userId)

    const tables = await prisma.table.findMany({
      where: { userId, layoutId: layout.id },
      include: {
        guests: {
          select: { id: true, name: true, rsvpStatus: true, numPeople: true, phone: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Guests not assigned to any table
    const unassigned = await prisma.guest.findMany({
      where: { userId, tableId: null },
      select: { id: true, name: true, rsvpStatus: true, numPeople: true, phone: true, side: true },
      orderBy: { name: 'asc' }
    })

    return {
      layoutId: layout.id,
      tables: tables.map(t => ({
        id: t.id,
        name: t.name || `שולחן ${t.id}`,
        seats: t.seats,
        x: t.x,
        y: t.y,
        type: t.type,
        guests: t.guests,
        assignedCount: t.guests.length
      })),
      unassigned
    }
  })

  // ── POST /api/seating/tables ───────────────────────────────────────────────
  app.post('/tables', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { name, seats = 8, x = 100, y = 100, type = 'round' } = req.body || {}

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'שם שולחן נדרש' })
    }

    const layout = await getOrCreateLayout(userId)
    const table = await prisma.table.create({
      data: {
        userId,
        layoutId: layout.id,
        name: name.trim(),
        seats: Number(seats),
        x: Number(x),
        y: Number(y),
        type
      },
      include: { guests: { select: { id: true, name: true, rsvpStatus: true, numPeople: true } } }
    })

    return {
      id: table.id,
      name: table.name,
      seats: table.seats,
      x: table.x,
      y: table.y,
      type: table.type,
      guests: table.guests,
      assignedCount: 0
    }
  })

  // ── PUT /api/seating/tables/:id ────────────────────────────────────────────
  app.put('/tables/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const { name, seats, x, y, type } = req.body || {}

    const existing = await prisma.table.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'שולחן לא נמצא' })

    const table = await prisma.table.update({
      where: { id },
      data: {
        name:  name  !== undefined ? name.trim()    : existing.name,
        seats: seats !== undefined ? Number(seats)  : existing.seats,
        x:     x     !== undefined ? Number(x)      : existing.x,
        y:     y     !== undefined ? Number(y)       : existing.y,
        type:  type  !== undefined ? type            : existing.type
      },
      include: { guests: { select: { id: true, name: true, rsvpStatus: true, numPeople: true } } }
    })

    return {
      id: table.id,
      name: table.name,
      seats: table.seats,
      x: table.x,
      y: table.y,
      type: table.type,
      guests: table.guests,
      assignedCount: table.guests.length
    }
  })

  // ── DELETE /api/seating/tables/:id ────────────────────────────────────────
  app.delete('/tables/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)

    const existing = await prisma.table.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'שולחן לא נמצא' })

    // Unassign all guests from this table
    await prisma.guest.updateMany({ where: { tableId: id, userId }, data: { tableId: null } })
    await prisma.table.delete({ where: { id } })

    return { success: true }
  })

  // ── PUT /api/seating/assign ────────────────────────────────────────────────
  app.put('/assign', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { guestId, tableId } = req.body || {}

    if (!guestId) return reply.code(400).send({ error: 'guestId נדרש' })

    const guest = await prisma.guest.findFirst({ where: { id: Number(guestId), userId } })
    if (!guest) return reply.code(404).send({ error: 'אורח לא נמצא' })

    // tableId = null to unassign
    if (tableId !== null && tableId !== undefined) {
      const table = await prisma.table.findFirst({ where: { id: Number(tableId), userId } })
      if (!table) return reply.code(404).send({ error: 'שולחן לא נמצא' })
    }

    const updated = await prisma.guest.update({
      where: { id: Number(guestId) },
      data: { tableId: tableId !== null && tableId !== undefined ? Number(tableId) : null }
    })

    return { success: true, guestId: updated.id, tableId: updated.tableId }
  })

  // ── GET /api/seating/settings ──────────────────────────────────────────────
  app.get('/settings', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const layout = await getOrCreateLayout(userId)
    const tableCount = await prisma.table.count({ where: { userId, layoutId: layout.id } })

    return {
      layoutId: layout.id,
      hallName: layout.name,
      totalCapacity: layout.width,
      numTables: tableCount,
      bgColor: layout.bgColor,
      tableNamingStyle: 'numbers'
    }
  })

  // ── PUT /api/seating/settings ──────────────────────────────────────────────
  app.put('/settings', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { hallName, totalCapacity, bgColor } = req.body || {}

    const layout = await getOrCreateLayout(userId)

    const updated = await prisma.hallLayout.update({
      where: { id: layout.id },
      data: {
        name:     hallName       !== undefined ? hallName      : layout.name,
        width:    totalCapacity  !== undefined ? Number(totalCapacity) : layout.width,
        bgColor:  bgColor        !== undefined ? bgColor       : layout.bgColor
      }
    })

    return {
      layoutId: updated.id,
      hallName: updated.name,
      totalCapacity: updated.width,
      bgColor: updated.bgColor
    }
  })

  // ── POST /api/seating/generate-tables ─────────────────────────────────────
  app.post('/generate-tables', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { count = 10, seatsPerTable = 8, namingStyle = 'numbers', prefix = 'שולחן' } = req.body || {}

    const n = Math.min(Math.max(Number(count), 1), 100)
    const layout = await getOrCreateLayout(userId)

    // Delete existing tables (unassign guests first)
    const existingTables = await prisma.table.findMany({ where: { userId, layoutId: layout.id }, select: { id: true } })
    if (existingTables.length > 0) {
      const ids = existingTables.map(t => t.id)
      await prisma.guest.updateMany({ where: { tableId: { in: ids }, userId }, data: { tableId: null } })
      await prisma.table.deleteMany({ where: { id: { in: ids } } })
    }

    // Generate new tables in a grid layout
    const cols = Math.ceil(Math.sqrt(n))
    const tables = []

    for (let i = 0; i < n; i++) {
      let name
      if (namingStyle === 'hebrew') {
        name = `${prefix} ${HEBREW_LETTERS[i % HEBREW_LETTERS.length]}`
      } else if (namingStyle === 'custom') {
        name = `${prefix} ${i + 1}`
      } else {
        name = `שולחן ${i + 1}`
      }

      const col = i % cols
      const row = Math.floor(i / cols)

      tables.push({
        userId,
        layoutId: layout.id,
        name,
        seats: Number(seatsPerTable),
        x: 80 + col * 180,
        y: 80 + row * 180,
        type: 'round',
        rotation: 0
      })
    }

    await prisma.table.createMany({ data: tables })

    const created = await prisma.table.findMany({
      where: { userId, layoutId: layout.id },
      include: { guests: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' }
    })

    return {
      count: created.length,
      tables: created.map(t => ({
        id: t.id,
        name: t.name,
        seats: t.seats,
        x: t.x,
        y: t.y,
        guests: t.guests,
        assignedCount: 0
      }))
    }
  })

  // ── GET /api/seating/stats ─────────────────────────────────────────────────
  app.get('/stats', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const layout = await getOrCreateLayout(userId)

    const tables = await prisma.table.findMany({
      where: { userId, layoutId: layout.id },
      include: { guests: { select: { numPeople: true } } }
    })

    const totalSeats = tables.reduce((s, t) => s + t.seats, 0)
    const assignedGuests = await prisma.guest.count({ where: { userId, tableId: { not: null } } })
    const unassignedGuests = await prisma.guest.count({ where: { userId, tableId: null } })

    return {
      totalTables: tables.length,
      totalSeats,
      assignedGuests,
      unassignedGuests,
      occupancyRate: totalSeats > 0 ? Math.round((assignedGuests / totalSeats) * 100) : 0
    }
  })
}
