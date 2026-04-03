import { prisma } from '../models/db.js'

export default async function statsRoutes(app) {
  // ── GET /api/stats/summary — aggregated stats for the dashboard ──────────
  app.get('/summary', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    // Run all queries in parallel for performance
    const [
      user,
      guestCounts,
      budgetData,
      taskCounts,
      vendorCounts,
      recentGuests
    ] = await Promise.all([
      // User (total budget, wedding date)
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalBudget: true, weddingDate: true, name1: true, name2: true }
      }),

      // Guest counts by rsvpStatus
      prisma.guest.groupBy({
        by: ['rsvpStatus'],
        where: { userId },
        _count: { id: true },
        _sum: { numPeople: true }
      }),

      // Budget: total spent + per-category breakdown
      Promise.all([
        prisma.budgetExpense.aggregate({
          where: { userId },
          _sum: { amount: true }
        }),
        prisma.budgetCategory.findMany({
          where: { userId },
          select: { name: true, allocatedAmount: true, icon: true, color: true },
          orderBy: { allocatedAmount: 'desc' }
        })
      ]),

      // Task counts (done vs not done)
      prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true }
      }).catch(() => []), // task table might be empty initially

      // Vendor counts by status
      prisma.userVendor.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true }
      }),

      // 5 most recent guests
      prisma.guest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, rsvpStatus: true, numPeople: true, createdAt: true }
      })
    ])

    // ── Guest summary ───────────────────────────────────────────────────────
    const guestMap = Object.fromEntries(
      guestCounts.map(g => [g.rsvpStatus, { count: g._count.id, seats: g._sum.numPeople || 0 }])
    )
    const guestSummary = {
      total:     guestCounts.reduce((a, g) => a + g._count.id, 0),
      confirmed: guestMap.confirmed?.count  || 0,
      declined:  guestMap.declined?.count   || 0,
      maybe:     guestMap.maybe?.count      || 0,
      pending:   guestMap.pending?.count    || 0,
      totalSeats: guestCounts.reduce((a, g) => a + (g._sum.numPeople || 0), 0)
    }

    // ── Budget summary ──────────────────────────────────────────────────────
    const [expenseAgg, categories] = budgetData
    const totalSpent     = expenseAgg._sum.amount || 0
    const totalAllocated = user?.totalBudget || 0
    const budgetSummary  = {
      totalAllocated,
      totalSpent,
      remaining: Math.max(0, totalAllocated - totalSpent),
      spentPct:  totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
      categories: categories.map(c => ({
        name:      c.name,
        allocated: c.allocatedAmount,
        icon:      c.icon,
        color:     c.color
      }))
    }

    // ── Task summary ────────────────────────────────────────────────────────
    const taskMap   = Object.fromEntries(taskCounts.map(t => [t.status, t._count.id]))
    const doneTasks = taskMap.done || 0
    const allTasks  = taskCounts.reduce((a, t) => a + t._count.id, 0)
    const taskSummary = {
      total:      allTasks,
      done:       doneTasks,
      pending:    taskMap.todo || 0,
      inProgress: taskMap['in-progress'] || 0,
      completionPct: allTasks > 0 ? Math.round((doneTasks / allTasks) * 100) : 0
    }

    // ── Vendor summary ──────────────────────────────────────────────────────
    const vendorMap = Object.fromEntries(vendorCounts.map(v => [v.status, v._count.id]))
    const vendorSummary = {
      total:      vendorCounts.reduce((a, v) => a + v._count.id, 0),
      booked:     vendorMap.booked      || 0,
      considering: vendorMap.considering || 0,
      rejected:   vendorMap.rejected    || 0,
      contacted:  vendorMap.contacted   || 0
    }

    // ── Days to wedding ─────────────────────────────────────────────────────
    let daysToWedding = null
    if (user?.weddingDate) {
      const diff = new Date(user.weddingDate) - new Date()
      daysToWedding = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return {
      couple: { name1: user?.name1, name2: user?.name2, weddingDate: user?.weddingDate, daysToWedding },
      guests:  guestSummary,
      budget:  budgetSummary,
      tasks:   taskSummary,
      vendors: vendorSummary,
      recent:  { guests: recentGuests }
    }
  })
}
