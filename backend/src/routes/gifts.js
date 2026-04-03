import { prisma } from '../models/db.js'

export default async function giftsRoutes(app) {
  // ── GET /api/gifts — list all gifts for user ─────────────────────────────
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { search, status } = req.query

    const where = { userId }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { giverName: { contains: search } },
        { giverPhone: { contains: search } }
      ]
    }

    const gifts = await prisma.gift.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return gifts
  })

  // ── GET /api/gifts/stats — aggregated stats ──────────────────────────────
  app.get('/stats', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId

    // Total count + sum + avg
    const agg = await prisma.gift.aggregate({
      where: { userId },
      _count: { id: true },
      _sum:   { amount: true },
      _avg:   { amount: true }
    })

    const total      = agg._sum.amount  || 0
    const count      = agg._count.id    || 0
    const avg        = agg._avg.amount  || 0

    // % thanked (status = 'thanked')
    const thankedCount = await prisma.gift.count({
      where: { userId, status: 'thanked' }
    })
    const pctThanked = count > 0 ? Math.round((thankedCount / count) * 100) : 0

    // Top givers — group by giverName, sum amount, take top 10
    // Prisma SQLite groupBy works fine here
    const topGiversRaw = await prisma.gift.groupBy({
      by: ['giverName'],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    })

    const topGivers = topGiversRaw.map(g => ({
      name:       g.giverName,
      amount:     g._sum.amount || 0,
      giftCount:  g._count.id
    }))

    // Breakdown by amount range
    const allGifts = await prisma.gift.findMany({
      where: { userId },
      select: { amount: true }
    })

    const ranges = [
      { label: '0–500',     min: 0,    max: 500  },
      { label: '500–1,000', min: 500,  max: 1000 },
      { label: '1,000–2,000', min: 1000, max: 2000 },
      { label: '2,000+',   min: 2000, max: Infinity }
    ]

    const breakdown = ranges.map(r => {
      const inRange = allGifts.filter(g => g.amount >= r.min && (r.max === Infinity ? true : g.amount < r.max))
      return {
        label:  r.label,
        count:  inRange.length,
        amount: inRange.reduce((s, g) => s + g.amount, 0)
      }
    })

    // Timeline: gifts per day for last 30 days
    const since = new Date()
    since.setDate(since.getDate() - 29)
    since.setHours(0, 0, 0, 0)

    const recentGifts = await prisma.gift.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true, amount: true }
    })

    // Build 30-day buckets
    const timeline = []
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const dayGifts = recentGifts.filter(g => g.createdAt.toISOString().slice(0, 10) === dateStr)
      timeline.push({
        date:   dateStr,
        count:  dayGifts.length,
        amount: dayGifts.reduce((s, g) => s + g.amount, 0)
      })
    }

    return {
      total,
      count,
      avg,
      pctThanked,
      topGivers,
      breakdown,
      timeline
    }
  })

  // ── POST /api/gifts — create gift ────────────────────────────────────────
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { giverName, giverPhone, amount, message } = req.body || {}

    if (!giverName || typeof giverName !== 'string' || !giverName.trim()) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם הנותן נדרש' })
    }
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סכום לא תקין' })
    }

    const gift = await prisma.gift.create({
      data: {
        userId,
        giverName: giverName.trim(),
        giverPhone: giverPhone?.trim() || null,
        amount:    parseFloat(amount),
        message:   message?.trim() || null,
        status:    'new'
      }
    })

    return reply.code(201).send(gift)
  })

  // ── PUT /api/gifts/:id — update gift ─────────────────────────────────────
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const existing = await prisma.gift.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'מתנה לא נמצאה' })

    const { giverName, giverPhone, amount, message, status } = req.body || {}

    const updated = await prisma.gift.update({
      where: { id },
      data: {
        ...(giverName  !== undefined && { giverName:  giverName.trim() }),
        ...(giverPhone !== undefined && { giverPhone: giverPhone?.trim() || null }),
        ...(amount     !== undefined && { amount: parseFloat(amount) }),
        ...(message    !== undefined && { message: message?.trim() || null }),
        ...(status     !== undefined && { status })
      }
    })

    return updated
  })

  // ── DELETE /api/gifts/:id — delete gift ──────────────────────────────────
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const existing = await prisma.gift.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'מתנה לא נמצאה' })

    await prisma.gift.delete({ where: { id } })
    return reply.code(204).send()
  })

  // ── GET /api/gifts/public/:userId — public wish list (no auth) ───────────
  app.get('/public/:userId', async (req, reply) => {
    const userId = parseInt(req.params.userId, 10)
    if (isNaN(userId)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name1: true, name2: true,
        weddingDate: true, venue: true,
        bankInfo: true, bitPhone: true
      }
    })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND', message: 'זוג לא נמצא' })

    const wishes = await prisma.giftWish.findMany({
      where: { userId },
      orderBy: [{ isContributed: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true, name: true, desiredAmount: true,
        message: true, imageUrl: true, isContributed: true, sortOrder: true
      }
    })

    return {
      couple: {
        id: user.id, name1: user.name1, name2: user.name2,
        weddingDate: user.weddingDate, venue: user.venue
      },
      payment: {
        bankInfo: user.bankInfo || null,
        bitPhone: user.bitPhone || null
      },
      wishes
    }
  })

  // ── GET /api/gifts/wishes — auth: list my wishes ─────────────────────────
  app.get('/wishes', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    return prisma.giftWish.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })
  })

  // ── POST /api/gifts/wishes — auth: create wish ───────────────────────────
  app.post('/wishes', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { name, desiredAmount, message, imageUrl, sortOrder } = req.body || {}
    if (!name?.trim()) return reply.code(400).send({ error: 'VALIDATION', message: 'שם מתנה נדרש' })
    if (desiredAmount === undefined || isNaN(Number(desiredAmount)))
      return reply.code(400).send({ error: 'VALIDATION', message: 'סכום לא תקין' })
    const wish = await prisma.giftWish.create({
      data: {
        userId, name: name.trim(),
        desiredAmount: parseFloat(desiredAmount),
        message: message?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        sortOrder: parseInt(sortOrder) || 0
      }
    })
    return reply.code(201).send(wish)
  })

  // ── PUT /api/gifts/wishes/:id — auth: update wish ────────────────────────
  app.put('/wishes/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })
    const existing = await prisma.giftWish.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'פריט לא נמצא' })
    const { name, desiredAmount, message, imageUrl, isContributed, contributedBy, sortOrder } = req.body || {}
    return prisma.giftWish.update({
      where: { id },
      data: {
        ...(name          !== undefined && { name: name.trim() }),
        ...(desiredAmount !== undefined && { desiredAmount: parseFloat(desiredAmount) }),
        ...(message       !== undefined && { message: message?.trim() || null }),
        ...(imageUrl      !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(isContributed !== undefined && { isContributed: Boolean(isContributed) }),
        ...(contributedBy !== undefined && { contributedBy: contributedBy?.trim() || null }),
        ...(sortOrder     !== undefined && { sortOrder: parseInt(sortOrder) })
      }
    })
  })

  // ── DELETE /api/gifts/wishes/:id — auth: delete wish ────────────────────
  app.delete('/wishes/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })
    const existing = await prisma.giftWish.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'פריט לא נמצא' })
    await prisma.giftWish.delete({ where: { id } })
    return reply.code(204).send()
  })
}
