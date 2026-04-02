import { prisma } from '../models/db.js'

export default async function giftsRoutes(app) {

  // GET /api/gifts — list guests with gift amounts
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const guests = await prisma.guest.findMany({
      where: { userId },
      select: {
        id: true, name: true, phone: true, groupName: true, side: true,
        giftAmount: true, rsvpStatus: true, numPeople: true
      },
      orderBy: [{ giftAmount: 'desc' }, { name: 'asc' }]
    })
    return guests
  })

  // PATCH /api/gifts/:id/gift — update gift amount for a guest
  app.patch('/:id/gift', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const { amount } = req.body || {}

    const guest = await prisma.guest.findFirst({ where: { id, userId } })
    if (!guest) return { statusCode: 404, error: 'אורח לא נמצא' }

    const updated = await prisma.guest.update({
      where: { id },
      data: { giftAmount: amount !== undefined ? parseFloat(amount) || null : null },
      select: { id: true, name: true, giftAmount: true }
    })
    return updated
  })

  // GET /api/gifts/stats — gift statistics
  app.get('/stats', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const guests = await prisma.guest.findMany({
      where: { userId },
      select: { id: true, name: true, giftAmount: true, groupName: true, side: true }
    })

    const withGift = guests.filter(g => g.giftAmount && g.giftAmount > 0)
    const total = withGift.reduce((s, g) => s + (g.giftAmount || 0), 0)
    const avg = withGift.length > 0 ? total / withGift.length : 0
    const topGivers = [...withGift].sort((a, b) => (b.giftAmount || 0) - (a.giftAmount || 0)).slice(0, 5)

    // Group breakdown
    const groups = {}
    for (const g of withGift) {
      const key = g.groupName || 'ללא קבוצה'
      if (!groups[key]) groups[key] = 0
      groups[key] += g.giftAmount || 0
    }
    const byGroup = Object.entries(groups).map(([name, amount]) => ({ name, amount }))

    return { total, avg, count: withGift.length, topGivers, byGroup }
  })
}
