import { prisma } from '../models/db.js'

export default async function dashboardRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    // Fetch all data in parallel
    const [user, guestStats, budgetData, recentGuests] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: { name1: true, name2: true, weddingDate: true, plan: true }
      }),

      // Guest stats grouped by rsvpStatus
      prisma.guest.groupBy({
        by: ['rsvpStatus'],
        where: { userId },
        _count: { id: true },
        _sum: { numPeople: true }
      }),

      // Budget: categories + expenses totals
      Promise.all([
        prisma.budgetCategory.aggregate({
          where: { userId },
          _sum: { allocatedAmount: true }
        }),
        prisma.budgetExpense.aggregate({
          where: { userId },
          _sum: { amount: true }
        })
      ]),

      // Recent activity: last 5 guests added
      prisma.guest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          rsvpStatus: true,
          numPeople: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ])

    // Compute wedding countdown
    let daysUntilWedding = null
    if (user.weddingDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const wedding = new Date(user.weddingDate)
      wedding.setHours(0, 0, 0, 0)
      daysUntilWedding = Math.ceil((wedding - today) / (1000 * 60 * 60 * 24))
    }

    // Build guest counts
    const guestCounts = {
      confirmed: 0,
      maybe:     0,
      declined:  0,
      pending:   0,
      total:     0
    }
    for (const g of guestStats) {
      const cnt = g._count.id
      const ppl = g._sum.numPeople || cnt
      guestCounts.total += ppl
      if (g.rsvpStatus === 'confirmed') guestCounts.confirmed = ppl
      else if (g.rsvpStatus === 'maybe')     guestCounts.maybe = ppl
      else if (g.rsvpStatus === 'declined')  guestCounts.declined = ppl
      else                                   guestCounts.pending += ppl
    }

    // Budget totals
    const [catAgg, expAgg] = budgetData
    const totalBudget = catAgg._sum.allocatedAmount || 0
    const totalSpent  = expAgg._sum.amount          || 0

    // Recent activity items (newest guests)
    const activity = recentGuests.map(g => ({
      type: 'guest_added',
      guestId: g.id,
      guestName: g.name,
      rsvpStatus: g.rsvpStatus,
      numPeople: g.numPeople,
      at: g.createdAt
    }))

    return {
      user: {
        name1: user.name1,
        name2: user.name2,
        weddingDate: user.weddingDate,
        plan: user.plan
      },
      countdown: {
        days: daysUntilWedding,
        hasDate: !!user.weddingDate
      },
      guests: guestCounts,
      budget: {
        total: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        percent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      },
      activity
    }
  })
}
