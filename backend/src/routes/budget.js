import { prisma } from '../models/db.js'

export default async function budgetRoutes(app) {

  // ── GET /api/budget — overview: total + all categories with computed spent ──
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    const [user, categories] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { budgetTotal: true } }),
      prisma.budgetCategory.findMany({
        where: { userId },
        include: {
          expenses: { select: { amount: true, isPaid: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const totalBudget = user?.budgetTotal ?? 0

    const cats = categories.map(c => {
      const spent = c.expenses.reduce((s, e) => s + e.amount, 0)
      const paid  = c.expenses.filter(e => e.isPaid).reduce((s, e) => s + e.amount, 0)
      const pct   = c.allocatedAmount > 0 ? Math.min(100, Math.round((spent / c.allocatedAmount) * 100)) : 0
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        allocatedAmount: c.allocatedAmount,
        allocatedPercent: c.allocatedPercent,
        spent,
        paid,
        pct,
        expenseCount: c.expenses.length
      }
    })

    const totalAllocated = cats.reduce((s, c) => s + c.allocatedAmount, 0)
    const totalSpent     = cats.reduce((s, c) => s + c.spent, 0)
    const totalPaid      = cats.reduce((s, c) => s + c.paid, 0)
    const remaining      = totalBudget - totalSpent

    return {
      budget: {
        total: totalBudget,
        allocated: totalAllocated,
        spent: totalSpent,
        paid: totalPaid,
        remaining,
        pct: totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0
      },
      categories: cats
    }
  })

  // ── PUT /api/budget/total — set total wedding budget ───────────────────────
  app.put('/total', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { total } = req.body

    if (typeof total !== 'number' || total < 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סכום תקציב לא תקין' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { budgetTotal: total },
      select: { budgetTotal: true }
    })

    return { total: updated.budgetTotal }
  })

  // ── POST /api/budget/categories — create category ─────────────────────────
  app.post('/categories', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { name, allocatedAmount, allocatedPercent, icon, color } = req.body

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם קטגוריה נדרש' })
    }

    const cat = await prisma.budgetCategory.create({
      data: {
        userId,
        name: name.trim(),
        allocatedAmount: Number(allocatedAmount) || 0,
        allocatedPercent: Number(allocatedPercent) || 0,
        icon: icon || '💰',
        color: color || '#E91E8C'
      }
    })

    return { ...cat, spent: 0, paid: 0, pct: 0, expenseCount: 0 }
  })

  // ── GET /api/budget/categories/:id — category detail with expenses ─────────
  app.get('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)

    const cat = await prisma.budgetCategory.findFirst({
      where: { id, userId },
      include: {
        expenses: { orderBy: { date: 'desc' } }
      }
    })

    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    const spent = cat.expenses.reduce((s, e) => s + e.amount, 0)
    const paid  = cat.expenses.filter(e => e.isPaid).reduce((s, e) => s + e.amount, 0)
    const pct   = cat.allocatedAmount > 0 ? Math.min(100, Math.round((spent / cat.allocatedAmount) * 100)) : 0

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      allocatedAmount: cat.allocatedAmount,
      allocatedPercent: cat.allocatedPercent,
      spent,
      paid,
      pct,
      expenses: cat.expenses.map(e => ({
        id: e.id,
        vendorName: e.vendorName,
        amount: e.amount,
        isPaid: e.isPaid,
        note: e.note,
        date: e.date
      }))
    }
  })

  // ── PUT /api/budget/categories/:id — update category ─────────────────────
  app.put('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)
    const { name, allocatedAmount, allocatedPercent, icon, color } = req.body

    const existing = await prisma.budgetCategory.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    const updated = await prisma.budgetCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(allocatedAmount !== undefined && { allocatedAmount: Number(allocatedAmount) }),
        ...(allocatedPercent !== undefined && { allocatedPercent: Number(allocatedPercent) }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color })
      },
      include: { expenses: { select: { amount: true, isPaid: true } } }
    })

    const spent = updated.expenses.reduce((s, e) => s + e.amount, 0)
    const pct   = updated.allocatedAmount > 0 ? Math.min(100, Math.round((spent / updated.allocatedAmount) * 100)) : 0

    return { ...updated, spent, pct, expenses: undefined }
  })

  // ── DELETE /api/budget/categories/:id ─────────────────────────────────────
  app.delete('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)

    const existing = await prisma.budgetCategory.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    await prisma.budgetCategory.delete({ where: { id } })
    return { success: true }
  })

  // ── POST /api/budget/categories/:id/expenses — add expense ────────────────
  app.post('/categories/:id/expenses', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.id)
    const { vendorName, amount, isPaid, note, date } = req.body

    if (!vendorName || !vendorName.trim()) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם ספק נדרש' })
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סכום לא תקין' })
    }

    const cat = await prisma.budgetCategory.findFirst({ where: { id: categoryId, userId } })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    const expense = await prisma.budgetExpense.create({
      data: {
        userId,
        categoryId,
        vendorName: vendorName.trim(),
        amount: Number(amount),
        isPaid: Boolean(isPaid),
        note: note || null,
        date: date ? new Date(date) : new Date()
      }
    })

    return expense
  })

  // ── PUT /api/budget/categories/:id/expenses/:eid — edit expense ───────────
  app.put('/categories/:id/expenses/:eid', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.id)
    const eid = Number(req.params.eid)
    const { vendorName, amount, isPaid, note, date } = req.body

    const existing = await prisma.budgetExpense.findFirst({
      where: { id: eid, categoryId, userId }
    })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הוצאה לא נמצאה' })

    const updated = await prisma.budgetExpense.update({
      where: { id: eid },
      data: {
        ...(vendorName !== undefined && { vendorName: vendorName.trim() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
        ...(note !== undefined && { note: note || null }),
        ...(date !== undefined && { date: new Date(date) })
      }
    })

    return updated
  })

  // ── DELETE /api/budget/categories/:id/expenses/:eid ──────────────────────
  app.delete('/categories/:id/expenses/:eid', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.id)
    const eid = Number(req.params.eid)

    const existing = await prisma.budgetExpense.findFirst({
      where: { id: eid, categoryId, userId }
    })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הוצאה לא נמצאה' })

    await prisma.budgetExpense.delete({ where: { id: eid } })
    return { success: true }
  })

  // ── GET /api/budget/expenses/recent — recent expenses across all categories
  app.get('/expenses/recent', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const limit = Number(req.query.limit) || 10

    const expenses = await prisma.budgetExpense.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      orderBy: { date: 'desc' },
      take: limit
    })

    return expenses.map(e => ({
      id: e.id,
      vendorName: e.vendorName,
      amount: e.amount,
      isPaid: e.isPaid,
      note: e.note,
      date: e.date,
      category: e.category
    }))
  })
}
