import { prisma } from '../models/db.js'

export default async function budgetRoutes(app) {

  // ── GET /api/budget — overview: categories + totals ──────────────────────────
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({ where: { id: userId } })

    const categories = await prisma.budgetCategory.findMany({
      where: { userId },
      include: {
        expenses: true
      },
      orderBy: { createdAt: 'asc' }
    })

    const budgetTotal = user.budgetTotal || 0

    const categoriesWithStats = categories.map(cat => {
      const spent = cat.expenses.reduce((sum, e) => sum + e.amount, 0)
      const allocated = cat.allocatedAmount
      const pct = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 999) : 0
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        allocatedPercent: cat.allocatedPercent,
        allocatedAmount: allocated,
        spent,
        remaining: allocated - spent,
        pct,
        overBudget: spent > allocated && allocated > 0,
        expenseCount: cat.expenses.length
      }
    })

    const totalAllocated = categoriesWithStats.reduce((s, c) => s + c.allocatedAmount, 0)
    const totalSpent = categoriesWithStats.reduce((s, c) => s + c.spent, 0)
    const totalPct = totalAllocated > 0 ? Math.min(Math.round((totalSpent / totalAllocated) * 100), 100) : 0

    return {
      budgetTotal,
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      totalPct,
      categories: categoriesWithStats
    }
  })

  // ── POST /api/budget — create category ────────────────────────────────────────
  app.post('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { name, icon, color, allocatedAmount, allocatedPercent } = req.body

    if (!name || name.trim().length === 0) {
      return { statusCode: 400, error: 'VALIDATION', message: 'שם קטגוריה נדרש' }
    }

    const cat = await prisma.budgetCategory.create({
      data: {
        userId,
        name: name.trim(),
        icon: icon || '📋',
        color: color || '#d4d4d4',
        allocatedAmount: Number(allocatedAmount) || 0,
        allocatedPercent: Number(allocatedPercent) || 0
      }
    })

    return { ...cat, spent: 0, remaining: cat.allocatedAmount, pct: 0, expenseCount: 0 }
  })

  // ── PUT /api/budget/total — update total budget ───────────────────────────────
  app.put('/total', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { budgetTotal } = req.body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { budgetTotal: Number(budgetTotal) || 0 }
    })

    return { budgetTotal: user.budgetTotal }
  })

  // ── GET /api/budget/:categoryId — detail + expenses ──────────────────────────
  app.get('/:categoryId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.categoryId)

    const cat = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId },
      include: {
        expenses: { orderBy: { date: 'desc' } }
      }
    })

    if (!cat) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })
    }

    const spent = cat.expenses.reduce((s, e) => s + e.amount, 0)
    const allocated = cat.allocatedAmount

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      allocatedPercent: cat.allocatedPercent,
      allocatedAmount: allocated,
      spent,
      remaining: allocated - spent,
      pct: allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 999) : 0,
      overBudget: spent > allocated && allocated > 0,
      expenses: cat.expenses.map(e => ({
        id: e.id,
        vendorName: e.vendorName,
        amount: e.amount,
        note: e.note,
        isPaid: e.isPaid,
        date: e.date
      }))
    }
  })

  // ── PUT /api/budget/:categoryId — update allocated amount ─────────────────────
  app.put('/:categoryId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.categoryId)
    const { allocatedAmount, name, icon, color } = req.body

    const cat = await prisma.budgetCategory.findFirst({ where: { id: categoryId, userId } })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    const updated = await prisma.budgetCategory.update({
      where: { id: categoryId },
      data: {
        ...(allocatedAmount !== undefined && { allocatedAmount: Number(allocatedAmount) }),
        ...(name !== undefined && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color })
      }
    })

    return updated
  })

  // ── DELETE /api/budget/:categoryId — delete category ────────────────────────
  app.delete('/:categoryId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.categoryId)

    const cat = await prisma.budgetCategory.findFirst({ where: { id: categoryId, userId } })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    await prisma.budgetCategory.delete({ where: { id: categoryId } })
    return { success: true }
  })

  // ── POST /api/budget/:categoryId/expenses ────────────────────────────────────
  app.post('/:categoryId/expenses', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const categoryId = Number(req.params.categoryId)
    const { vendorName, amount, note, isPaid, date } = req.body

    if (!vendorName || !amount) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם ספק וסכום נדרשים' })
    }

    const cat = await prisma.budgetCategory.findFirst({ where: { id: categoryId, userId } })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    const expense = await prisma.budgetExpense.create({
      data: {
        userId,
        categoryId,
        vendorName: vendorName.trim(),
        amount: Number(amount),
        note: note || null,
        isPaid: !!isPaid,
        date: date ? new Date(date) : new Date()
      }
    })

    return expense
  })

  // ── PUT /api/budget/:categoryId/expenses/:expenseId ──────────────────────────
  app.put('/:categoryId/expenses/:expenseId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const expenseId = Number(req.params.expenseId)
    const { vendorName, amount, note, isPaid, date } = req.body

    const expense = await prisma.budgetExpense.findFirst({ where: { id: expenseId, userId } })
    if (!expense) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הוצאה לא נמצאה' })

    const updated = await prisma.budgetExpense.update({
      where: { id: expenseId },
      data: {
        ...(vendorName !== undefined && { vendorName: vendorName.trim() }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(note !== undefined && { note }),
        ...(isPaid !== undefined && { isPaid: !!isPaid }),
        ...(date !== undefined && { date: new Date(date) })
      }
    })

    return updated
  })

  // ── DELETE /api/budget/:categoryId/expenses/:expenseId ──────────────────────
  app.delete('/:categoryId/expenses/:expenseId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const expenseId = Number(req.params.expenseId)

    const expense = await prisma.budgetExpense.findFirst({ where: { id: expenseId, userId } })
    if (!expense) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הוצאה לא נמצאה' })

    await prisma.budgetExpense.delete({ where: { id: expenseId } })
    return { success: true }
  })
}
