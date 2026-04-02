import { prisma } from '../models/db.js'

// In-memory rate limit tracker for imports (userId → [timestamps])
const importRateMap = new Map()

function checkImportRateLimit(userId) {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const maxImports = 3
  const history = (importRateMap.get(userId) || []).filter(t => now - t < windowMs)
  if (history.length >= maxImports) return false
  history.push(now)
  importRateMap.set(userId, history)
  return true
}

export default async function budgetRoutes(app) {

  // ── GET /api/budget ───────────────────────────────────────────────────────────
  // Returns totalBudget, totalSpent, remaining, categories with spent amounts
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    const [user, categories, expenseAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalBudget: true }
      }),
      prisma.budgetCategory.findMany({
        where: { userId },
        include: {
          expenses: {
            select: { amount: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.budgetExpense.aggregate({
        where: { userId },
        _sum: { amount: true }
      })
    ])

    const totalBudget = user?.totalBudget ?? 0
    const totalSpent = expenseAgg._sum.amount ?? 0
    const remaining = totalBudget - totalSpent

    const mappedCategories = categories.map(cat => {
      const spent = cat.expenses.reduce((sum, e) => sum + e.amount, 0)
      return {
        id: cat.id,
        name: cat.name,
        allocatedAmount: cat.allocatedAmount,
        allocatedPercent: cat.allocatedPercent,
        spent,
        icon: cat.icon,
        color: cat.color
      }
    })

    return { totalBudget, totalSpent, remaining, categories: mappedCategories }
  })

  // ── PUT /api/budget/total ─────────────────────────────────────────────────────
  // Update total budget
  app.put('/total', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { totalBudget } = req.body

    if (totalBudget === undefined || totalBudget === null) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'totalBudget נדרש' })
    }

    const amount = Number(totalBudget)
    if (isNaN(amount) || amount < 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'totalBudget חייב להיות מספר חיובי' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { totalBudget: amount },
      select: {
        id: true,
        name1: true,
        name2: true,
        email: true,
        totalBudget: true,
        weddingDate: true,
        plan: true
      }
    })

    return updated
  })

  // ── POST /api/budget/categories ───────────────────────────────────────────────
  app.post('/categories', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { name, allocatedPercent, allocatedAmount, icon, color } = req.body

    if (!name || String(name).trim().length === 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם קטגוריה נדרש' })
    }

    const pct = Number(allocatedPercent) || 0
    const amt = Number(allocatedAmount) || 0

    const category = await prisma.budgetCategory.create({
      data: {
        userId,
        name: String(name).trim(),
        allocatedPercent: pct,
        allocatedAmount: amt,
        icon: icon || null,
        color: color || null
      }
    })

    return { ...category, spent: 0 }
  })

  // ── PUT /api/budget/categories/:id ────────────────────────────────────────────
  app.put('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)
    const { name, allocatedPercent, allocatedAmount, icon, color } = req.body

    const existing = await prisma.budgetCategory.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    const updated = await prisma.budgetCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(allocatedPercent !== undefined && { allocatedPercent: Number(allocatedPercent) }),
        ...(allocatedAmount !== undefined && { allocatedAmount: Number(allocatedAmount) }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(color !== undefined && { color: color || null })
      },
      include: { expenses: { select: { amount: true } } }
    })

    const spent = updated.expenses.reduce((s, e) => s + e.amount, 0)
    return {
      id: updated.id,
      name: updated.name,
      allocatedAmount: updated.allocatedAmount,
      allocatedPercent: updated.allocatedPercent,
      spent,
      icon: updated.icon,
      color: updated.color
    }
  })

  // ── DELETE /api/budget/categories/:id ────────────────────────────────────────
  app.delete('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)

    const existing = await prisma.budgetCategory.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })

    await prisma.budgetCategory.delete({ where: { id } })
    return { success: true }
  })

  // ── POST /api/budget/expenses ─────────────────────────────────────────────────
  app.post('/expenses', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { categoryId, vendorName, amount, note, date } = req.body

    if (!categoryId) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'categoryId נדרש' })
    }
    if (!vendorName || String(vendorName).trim().length === 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם ספק נדרש' })
    }
    const amt = Number(amount)
    if (isNaN(amt) || amt < 0) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סכום לא תקין' })
    }

    // Verify category belongs to user
    const category = await prisma.budgetCategory.findFirst({
      where: { id: Number(categoryId), userId }
    })
    if (!category) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'קטגוריה לא נמצאה' })
    }

    const expense = await prisma.budgetExpense.create({
      data: {
        userId,
        categoryId: Number(categoryId),
        vendorName: String(vendorName).trim(),
        amount: amt,
        note: note || null,
        date: date ? new Date(date) : new Date()
      }
    })

    return expense
  })

  // ── GET /api/budget/expenses ──────────────────────────────────────────────────
  // Optional query: ?categoryId=X
  app.get('/expenses', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { categoryId } = req.query

    const where = { userId }
    if (categoryId) {
      where.categoryId = Number(categoryId)
    }

    const expenses = await prisma.budgetExpense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } }
      },
      orderBy: { date: 'desc' }
    })

    return { expenses }
  })

  // ── DELETE /api/budget/expenses/:id ──────────────────────────────────────────
  app.delete('/expenses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = Number(req.params.id)

    const existing = await prisma.budgetExpense.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הוצאה לא נמצאה' })

    await prisma.budgetExpense.delete({ where: { id } })
    return { success: true }
  })
}
