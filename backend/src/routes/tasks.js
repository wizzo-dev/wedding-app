import { prisma } from '../models/db.js'

const VALID_PRIORITY = ['low', 'medium', 'high']
const VALID_STATUS   = ['todo', 'in_progress', 'done']

// Default task templates for new users
const SEED_TASKS = [
  { title: 'קבע תאריך חתונה', category: 'תכנון כללי', priority: 'high', status: 'todo' },
  { title: 'הכן רשימת אורחים ראשונית', category: 'אורחים', priority: 'high', status: 'todo' },
  { title: 'קבע תקציב כולל', category: 'תקציב', priority: 'high', status: 'todo' },
  { title: 'בחר אולם אירועים', category: 'ספקים', priority: 'high', status: 'todo' },
  { title: 'הזמן צלם', category: 'ספקים', priority: 'high', status: 'todo' },
  { title: 'בחר קייטרינג', category: 'ספקים', priority: 'medium', status: 'todo' },
  { title: 'הזמן להקה / DJ', category: 'ספקים', priority: 'medium', status: 'todo' },
  { title: 'הזמן פרחים ועיצוב', category: 'ספקים', priority: 'medium', status: 'todo' },
  { title: 'שלח הזמנות', category: 'אורחים', priority: 'medium', status: 'todo' },
  { title: 'קבע פגישות עם ספקים', category: 'ספקים', priority: 'medium', status: 'todo' },
  { title: 'תאם טעימת קייטרינג', category: 'ספקים', priority: 'low', status: 'todo' },
  { title: 'הכן תוכנית זמנים ליום החתונה', category: 'תכנון יום האירוע', priority: 'medium', status: 'todo' },
]

export default async function tasksRoutes(app) {
  // GET /api/tasks — list all tasks for user
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { status, category, priority } = req.query

    const where = { userId }
    if (status)   where.status   = status
    if (category) where.category = category
    if (priority) where.priority = priority

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }]
    })

    // Seed default tasks for new users — use unfiltered count to avoid re-seeding
    // when user has tasks but the current filter returns 0 results
    const totalCount = await prisma.task.count({ where: { userId } })
    if (totalCount === 0) {
      const seeded = await prisma.task.createMany({
        data: SEED_TASKS.map((t, i) => ({ ...t, userId, sortOrder: i }))
      })
      if (seeded.count > 0) {
        return prisma.task.findMany({ where: { userId }, orderBy: [{ sortOrder: 'asc' }] })
      }
    }

    return tasks
  })

  // GET /api/tasks/categories — list distinct categories
  app.get('/categories', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const tasks = await prisma.task.findMany({ where: { userId }, select: { category: true } })
    const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))]
    return cats
  })

  // GET /api/tasks/stats — summary stats
  app.get('/stats', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const [total, todo, inProgress, done] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'todo' } }),
      prisma.task.count({ where: { userId, status: 'in_progress' } }),
      prisma.task.count({ where: { userId, status: 'done' } }),
    ])
    return { total, todo, inProgress, done, completionRate: total > 0 ? Math.round((done / total) * 100) : 0 }
  })

  // GET /api/tasks/:id
  app.get('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const task = await prisma.task.findFirst({ where: { id, userId } })
    if (!task) return { statusCode: 404, error: 'משימה לא נמצאה' }
    return task
  })

  // POST /api/tasks — create task
  app.post('/', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { title, description, dueDate, priority, status, category, sortOrder } = req.body || {}

    if (!title?.trim()) return { statusCode: 400, error: 'כותרת חובה' }
    if (priority && !VALID_PRIORITY.includes(priority)) return { statusCode: 400, error: 'Invalid priority' }
    if (status   && !VALID_STATUS.includes(status))     return { statusCode: 400, error: 'Invalid status' }

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        status: status || 'todo',
        category: category || null,
        sortOrder: sortOrder ?? 0,
      }
    })
    return task
  })

  // PATCH /api/tasks/:id — update task
  app.patch('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const task = await prisma.task.findFirst({ where: { id, userId } })
    if (!task) return { statusCode: 404, error: 'משימה לא נמצאה' }

    const { title, description, dueDate, priority, status, category, sortOrder } = req.body || {}

    if (priority && !VALID_PRIORITY.includes(priority)) return { statusCode: 400, error: 'Invalid priority' }
    if (status   && !VALID_STATUS.includes(status))     return { statusCode: 400, error: 'Invalid status' }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title:       title       !== undefined ? title.trim()         : task.title,
        description: description !== undefined ? description          : task.description,
        dueDate:     dueDate     !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        priority:    priority    !== undefined ? priority             : task.priority,
        status:      status      !== undefined ? status               : task.status,
        category:    category    !== undefined ? category             : task.category,
        sortOrder:   sortOrder   !== undefined ? sortOrder            : task.sortOrder,
      }
    })
    return updated
  })

  // DELETE /api/tasks/:id
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const task = await prisma.task.findFirst({ where: { id, userId } })
    if (!task) return { statusCode: 404, error: 'משימה לא נמצאה' }
    await prisma.task.delete({ where: { id } })
    return { success: true }
  })

  // PATCH /api/tasks/bulk/reorder — update sort orders
  app.patch('/bulk/reorder', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { orders } = req.body || {}  // [{ id, sortOrder }]
    if (!Array.isArray(orders)) return { statusCode: 400, error: 'orders חסר' }

    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        prisma.task.updateMany({ where: { id: Number(id), userId }, data: { sortOrder } })
      )
    )
    return { success: true }
  })
}
