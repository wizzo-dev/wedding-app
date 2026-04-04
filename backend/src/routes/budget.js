import { prisma } from '../models/db.js'

export default async function budgetRoutes(app) {

  // GET /api/budget — all categories + expenses summary
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const categories = await prisma.budgetCategory.findMany({
      where: { userId },
      include: { expenses: true },
      orderBy: { name: 'asc' }
    })
    const total = categories.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0)
    const spent = categories.reduce((sum, c) =>
      sum + c.expenses.reduce((s, e) => s + (e.amount || 0), 0), 0)
    return { categories, total, spent, remaining: total - spent }
  })

  // GET /api/budget/summary
  app.get('/summary', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const categories = await prisma.budgetCategory.findMany({
      where: { userId }, include: { expenses: true }
    })
    const totalBudget = categories.reduce((s, c) => s + (c.allocatedAmount || 0), 0)
    const totalSpent  = categories.reduce((s, c) =>
      s + c.expenses.reduce((es, e) => es + (e.amount || 0), 0), 0)
    return { totalBudget, totalSpent, remaining: totalBudget - totalSpent,
      categoryCount: categories.length }
  })

  // GET /api/budget/categories
  app.get('/categories', { preHandler: [app.authenticate] }, async (req) => {
    return prisma.budgetCategory.findMany({
      where: { userId: req.user.userId },
      include: { expenses: true },
      orderBy: { name: 'asc' }
    })
  })

  // POST /api/budget/categories
  app.post('/categories', { preHandler: [app.authenticate] }, async (req) => {
    const { name, allocatedAmount, allocatedPercent, icon, color } = req.body
    return prisma.budgetCategory.create({
      data: { userId: req.user.userId, name, allocatedAmount: parseFloat(allocatedAmount) || 0,
        allocatedPercent: parseFloat(allocatedPercent) || 0,
        icon: icon || '💰', color: color || '#E91E8C' }
    })
  })

  // PUT /api/budget/categories/:id
  app.put('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cat = await prisma.budgetCategory.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.userId }
    })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND' })
    const { name, allocatedAmount, allocatedPercent, icon, color } = req.body
    return prisma.budgetCategory.update({
      where: { id: cat.id },
      data: {
        name,
        allocatedAmount: parseFloat(allocatedAmount) || 0,
        ...(allocatedPercent !== undefined && { allocatedPercent: parseFloat(allocatedPercent) || 0 }),
        icon, color
      }
    })
  })

  // DELETE /api/budget/categories/:id
  app.delete('/categories/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cat = await prisma.budgetCategory.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.userId }
    })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND' })
    await prisma.budgetExpense.deleteMany({ where: { categoryId: cat.id } })
    await prisma.budgetCategory.delete({ where: { id: cat.id } })
    return { ok: true }
  })

  // GET /api/budget/categories/:id/expenses
  app.get('/categories/:id/expenses', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cat = await prisma.budgetCategory.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.userId }
    })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND' })
    return prisma.budgetExpense.findMany({
      where: { categoryId: cat.id }, orderBy: { createdAt: 'desc' }
    })
  })

  // POST /api/budget/categories/:id/expenses
  app.post('/categories/:id/expenses', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cat = await prisma.budgetCategory.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.userId }
    })
    if (!cat) return reply.code(404).send({ error: 'NOT_FOUND' })
    const { description, amount, vendor, vendorName, paidAt, isPaid } = req.body
    return prisma.budgetExpense.create({
      data: {
        userId: req.user.userId,
        categoryId: cat.id,
        vendorName: vendorName || vendor || '',
        amount: parseFloat(amount) || 0,
        note: description || null
      }
    })
  })

  // PUT /api/budget/expenses/:id
  app.put('/expenses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const exp = await prisma.budgetExpense.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { category: true }
    })
    if (!exp || exp.category.userId !== req.user.userId)
      return reply.code(404).send({ error: 'NOT_FOUND' })
    const { description, amount, vendor, vendorName } = req.body
    return prisma.budgetExpense.update({
      where: { id: exp.id },
      data: {
        vendorName: vendorName || vendor || '',
        amount: parseFloat(amount) || 0,
        note: description || null
      }
    })
  })

  // DELETE /api/budget/expenses/:id
  app.delete('/expenses/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const exp = await prisma.budgetExpense.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { category: true }
    })
    if (!exp || exp.category.userId !== req.user.userId)
      return reply.code(404).send({ error: 'NOT_FOUND' })
    await prisma.budgetExpense.delete({ where: { id: exp.id } })
    return { ok: true }
  })
}
