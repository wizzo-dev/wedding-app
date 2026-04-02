import { prisma } from '../models/db.js'

export default async function timelineRoutes(app) {
  // GET /api/timeline — get all timeline events for this user
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const events = await prisma.timelineEvent.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ sortOrder: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }]
    })
    return { events }
  })

  // POST /api/timeline — create a new event
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { time, title, description, sortOrder } = req.body
    if (!time || !title) {
      return reply.code(400).send({ error: 'MISSING_FIELDS', message: 'שדות זמן וכותרת הם חובה' })
    }
    const event = await prisma.timelineEvent.create({
      data: {
        userId: req.user.userId,
        time: time.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        sortOrder: sortOrder ?? 0
      }
    })
    return reply.code(201).send(event)
  })

  // PUT /api/timeline/:id — update event
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const { time, title, description, sortOrder } = req.body

    const existing = await prisma.timelineEvent.findFirst({
      where: { id, userId: req.user.userId }
    })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'אירוע לא נמצא' })

    if (!time || !title) {
      return reply.code(400).send({ error: 'MISSING_FIELDS', message: 'שדות זמן וכותרת הם חובה' })
    }

    const updated = await prisma.timelineEvent.update({
      where: { id },
      data: {
        time: time.trim(),
        title: title.trim(),
        description: description?.trim() ?? null,
        sortOrder: sortOrder ?? existing.sortOrder
      }
    })
    return updated
  })

  // DELETE /api/timeline/:id — delete event
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const existing = await prisma.timelineEvent.findFirst({
      where: { id, userId: req.user.userId }
    })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'אירוע לא נמצא' })

    await prisma.timelineEvent.delete({ where: { id } })
    return { success: true }
  })

  // PATCH /api/timeline/reorder — bulk reorder
  app.patch('/reorder', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { order } = req.body // array of { id, sortOrder }
    if (!Array.isArray(order)) {
      return reply.code(400).send({ error: 'INVALID', message: 'order חייב להיות מערך' })
    }
    await Promise.all(
      order.map(({ id, sortOrder }) =>
        prisma.timelineEvent.updateMany({
          where: { id: parseInt(id), userId: req.user.userId },
          data: { sortOrder }
        })
      )
    )
    return { success: true }
  })
}
