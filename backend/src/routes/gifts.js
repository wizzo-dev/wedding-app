import { prisma } from '../models/db.js'

export default async function giftsRoutes(app) {

  // GET /api/gifts/stats
  app.get('/stats', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const gifts = await prisma.gift.findMany({ where: { userId } })
    const total = gifts.length
    const totalAmount = gifts.reduce((s, g) => s + (g.amount || 0), 0)
    const avgAmount = total > 0 ? Math.round(totalAmount / total) : 0
    const thanked = gifts.filter(g => g.status === 'thanked').length
    const newCount = gifts.filter(g => g.status === 'new').length
    return { total, totalAmount, avgAmount, thanked, new: newCount }
  })

  // GET /api/gifts
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { status, search, page = 1, limit = 50 } = req.query
    const where = { userId }
    if (status && status !== 'all') where.status = status
    if (search) {
      where.OR = [
        { giverName: { contains: search } },
        { giverPhone: { contains: search } },
        { message: { contains: search } }
      ]
    }
    const [gifts, total] = await Promise.all([
      prisma.gift.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.gift.count({ where })
    ])
    return { gifts, total, page: parseInt(page), limit: parseInt(limit) }
  })

  // POST /api/gifts
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { giverName, giverPhone, amount, message } = req.body
    if (!giverName || giverName.trim().length < 1) {
      return reply.code(400).send({ error: 'שם הנותן נדרש' })
    }
    if (amount !== undefined && isNaN(parseFloat(amount))) {
      return reply.code(400).send({ error: 'סכום לא תקין' })
    }
    const gift = await prisma.gift.create({
      data: {
        userId: req.user.userId,
        giverName: giverName.trim(),
        giverPhone: giverPhone?.trim() || null,
        amount: parseFloat(amount) || 0,
        message: message?.trim() || null,
        status: 'new'
      }
    })
    return reply.code(201).send(gift)
  })

  // PUT /api/gifts/:id
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const userId = req.user.userId
    const existing = await prisma.gift.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return reply.code(404).send({ error: 'מתנה לא נמצאה' })
    }
    const { giverName, giverPhone, amount, message, status } = req.body
    const data = {}
    if (giverName !== undefined) data.giverName = giverName.trim()
    if (giverPhone !== undefined) data.giverPhone = giverPhone?.trim() || null
    if (amount !== undefined) data.amount = parseFloat(amount) || 0
    if (message !== undefined) data.message = message?.trim() || null
    if (status !== undefined) {
      if (!['new', 'thanked'].includes(status)) {
        return reply.code(400).send({ error: 'סטטוס לא תקין — new / thanked' })
      }
      data.status = status
    }
    const updated = await prisma.gift.update({ where: { id }, data })
    return updated
  })

  // DELETE /api/gifts/:id
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const userId = req.user.userId
    const existing = await prisma.gift.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return reply.code(404).send({ error: 'מתנה לא נמצאה' })
    }
    await prisma.gift.delete({ where: { id } })
    return reply.code(204).send()
  })
}
