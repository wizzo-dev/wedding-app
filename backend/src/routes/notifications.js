import { prisma } from '../models/db.js'

export default async function notificationRoutes(app) {
  // GET /api/notifications — list all notifications for the user
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.userId, isRead: false }
    })
    return { notifications, unreadCount }
  })

  // PATCH /api/notifications/:id/read — mark single notification as read
  app.patch('/:id/read', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const notif = await prisma.notification.findFirst({
      where: { id, userId: req.user.userId }
    })
    if (!notif) return reply.code(404).send({ error: 'NOT_FOUND', message: 'ההתראה לא נמצאה' })

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })
    return updated
  })

  // PATCH /api/notifications/read-all — mark all as read
  app.patch('/read-all', { preHandler: [app.authenticate] }, async (req) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    })
    return { success: true, message: 'כל ההתראות סומנו כנקראות' }
  })

  // POST /api/notifications — create a notification (internal use / testing)
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { type = 'system', title, body } = req.body
    if (!title || !body) {
      return reply.code(400).send({ error: 'MISSING_FIELDS', message: 'כותרת ותוכן נדרשים' })
    }
    const validTypes = ['rsvp_received', 'gift_received', 'task_due', 'system']
    const notifType = validTypes.includes(type) ? type : 'system'

    const notif = await prisma.notification.create({
      data: { userId: req.user.userId, type: notifType, title, body }
    })
    return notif
  })
}
