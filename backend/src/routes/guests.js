import { prisma } from '../models/db.js'

const RSVP_STATUSES = ['confirmed', 'maybe', 'declined', 'pending']
const GROUPS = ['משפחת החתן', 'משפחת הכלה', 'חברים', 'עבודה', 'אחר']

export default async function guestsRoutes(app) {

  // GET /api/guests - paginated list
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const {
      page   = 1,
      limit  = 50,
      search = '',
      filter = '',
    } = req.query

    const pageNum  = Math.max(1, parseInt(page))
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)))
    const skip     = (pageNum - 1) * pageSize

    const where = {
      userId,
      ...(filter && filter !== 'all' && { rsvpStatus: filter }),
      ...(search && {
        OR: [
          { name:  { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } }
        ]
      })
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:  pageSize,
        skip,
        select: {
          id: true, name: true, phone: true, email: true, groupName: true,
          rsvpStatus: true, numPeople: true, giftAmount: true, notes: true,
          createdAt: true, updatedAt: true
        }
      }),
      prisma.guest.count({ where })
    ])

    return {
      guests,
      pagination: {
        total,
        page:       pageNum,
        limit:      pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })

  // GET /api/guests/stats
  app.get('/stats', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const grouped = await prisma.guest.groupBy({
      by: ['rsvpStatus'],
      where: { userId },
      _count: { id: true },
      _sum:   { numPeople: true }
    })

    let total = 0, confirmed = 0, pending = 0, declined = 0, maybe = 0, totalPeople = 0
    for (const g of grouped) {
      const cnt = g._count.id
      const ppl = g._sum.numPeople || cnt
      total      += cnt
      totalPeople += ppl
      if (g.rsvpStatus === 'confirmed') confirmed = cnt
      else if (g.rsvpStatus === 'declined') declined = cnt
      else if (g.rsvpStatus === 'maybe')    maybe    = cnt
      else                                  pending  += cnt
    }

    return { total, confirmed, pending, declined, maybe, totalPeople }
  })

  // POST /api/guests - create
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { name, phone, email, groupName, numPeople, rsvpStatus, giftAmount, notes } = req.body

    if (!name?.trim()) {
      const err = new Error('שם אורח חסר'); err.statusCode = 400; throw err
    }
    if (rsvpStatus && !RSVP_STATUSES.includes(rsvpStatus)) {
      const err = new Error('סטטוס RSVP לא תקין'); err.statusCode = 400; throw err
    }

    const guest = await prisma.guest.create({
      data: {
        userId,
        name: name.trim(),
        phone:      phone?.trim()     || null,
        email:      email?.trim()     || null,
        groupName:  groupName         || null,
        numPeople:  numPeople  >= 1   ? numPeople  : 1,
        rsvpStatus: rsvpStatus        || 'pending',
        giftAmount: giftAmount        ?? null,
        notes:      notes?.trim()     || null
      }
    })

    return reply.code(201).send(guest)
  })

  // PUT /api/guests/:id - update
  app.put('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const existing = await prisma.guest.findFirst({ where: { id, userId } })
    if (!existing) { const err = new Error('אורח לא נמצא'); err.statusCode = 404; throw err }

    const { name, phone, email, groupName, numPeople, rsvpStatus, giftAmount, notes } = req.body
    if (rsvpStatus && !RSVP_STATUSES.includes(rsvpStatus)) {
      const err = new Error('סטטוס RSVP לא תקין'); err.statusCode = 400; throw err
    }

    const updated = await prisma.guest.update({
      where: { id },
      data: {
        ...(name      !== undefined && { name: name.trim() }),
        ...(phone     !== undefined && { phone: phone?.trim() || null }),
        ...(email     !== undefined && { email: email?.trim() || null }),
        ...(groupName !== undefined && { groupName }),
        ...(numPeople !== undefined && { numPeople: Math.max(1, numPeople) }),
        ...(rsvpStatus !== undefined && { rsvpStatus }),
        ...(giftAmount !== undefined && { giftAmount }),
        ...(notes     !== undefined && { notes: notes?.trim() || null })
      }
    })
    return updated
  })

  // DELETE /api/guests/:id
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const existing = await prisma.guest.findFirst({ where: { id, userId } })
    if (!existing) { const err = new Error('אורח לא נמצא'); err.statusCode = 404; throw err }
    await prisma.guest.delete({ where: { id } })
    return reply.code(204).send()
  })

  // PATCH /api/guests/:id/rsvp
  app.patch('/:id/rsvp', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const { rsvpStatus, numPeople } = req.body

    const existing = await prisma.guest.findFirst({ where: { id, userId } })
    if (!existing) { const err = new Error('אורח לא נמצא'); err.statusCode = 404; throw err }

    if (rsvpStatus && !RSVP_STATUSES.includes(rsvpStatus)) {
      const err = new Error('סטטוס לא תקין'); err.statusCode = 400; throw err
    }

    const updated = await prisma.guest.update({
      where: { id },
      data: {
        ...(rsvpStatus !== undefined && { rsvpStatus }),
        ...(numPeople  !== undefined && { numPeople: Math.max(1, numPeople) })
      }
    })
    return updated
  })

  // POST /api/guests/bulk - bulk actions
  app.post('/bulk', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { ids, action, rsvpStatus } = req.body
    if (!ids?.length) return { updated: 0 }

    if (action === 'delete') {
      const result = await prisma.guest.deleteMany({ where: { id: { in: ids }, userId } })
      return { deleted: result.count }
    }

    if (action === 'rsvp' && rsvpStatus) {
      const result = await prisma.guest.updateMany({
        where: { id: { in: ids }, userId },
        data:  { rsvpStatus }
      })
      return { updated: result.count }
    }

    const err = new Error('פעולה לא תקינה'); err.statusCode = 400; throw err
  })

  // GET /api/guests/:id - single guest
  app.get('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const guest = await prisma.guest.findFirst({ where: { id, userId } })
    if (!guest) { const err = new Error('אורח לא נמצא'); err.statusCode = 404; throw err }
    return guest
  })
}
