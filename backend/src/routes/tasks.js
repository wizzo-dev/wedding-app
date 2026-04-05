import { prisma } from '../models/db.js'

// Parse a date string safely — returns Date | null | 'INVALID'
function parseDate(value) {
  if (value === undefined || value === null || value === '') return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? 'INVALID' : d
}

export default async function tasksRoutes(app) {
  // GET /api/tasks — list all tasks for current user
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { userId: req.user.userId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      })
      return reply.send({ tasks })
    } catch (err) {
      app.log.error({ err }, 'tasks.list failed')
      return reply.status(500).send({ error: 'שגיאה בטעינת המשימות' })
    }
  })

  // POST /api/tasks — create task
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { title, description, dueDate, priority, status, category } = req.body || {}
    if (!title?.trim()) return reply.status(400).send({ error: 'כותרת המשימה היא שדה חובה' })

    const parsedDate = parseDate(dueDate)
    if (parsedDate === 'INVALID') return reply.status(400).send({ error: 'תאריך יעד לא תקין' })

    try {
      const task = await prisma.task.create({
        data: {
          userId:      req.user.userId,
          title:       title.trim(),
          description: description?.trim() || null,
          dueDate:     parsedDate,
          priority:    priority || 'medium',
          status:      status || 'todo',
          category:    category?.trim() || null
        }
      })
      return reply.status(201).send(task)
    } catch (err) {
      app.log.error({ err }, 'tasks.create failed')
      return reply.status(500).send({ error: 'שגיאה בשמירת המשימה' })
    }
  })

  // PUT /api/tasks/:id — update task
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return reply.status(400).send({ error: 'מזהה משימה לא תקין' })

    const task = await prisma.task.findFirst({ where: { id, userId: req.user.userId } })
    if (!task) return reply.status(404).send({ error: 'משימה לא נמצאה' })

    const { title, description, dueDate, priority, status, category } = req.body || {}

    let parsedDate
    if (dueDate !== undefined) {
      parsedDate = parseDate(dueDate)
      if (parsedDate === 'INVALID') return reply.status(400).send({ error: 'תאריך יעד לא תקין' })
    }

    try {
      const updated = await prisma.task.update({
        where: { id },
        data: {
          ...(title !== undefined       && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(dueDate !== undefined     && { dueDate: parsedDate }),
          ...(priority !== undefined    && { priority }),
          ...(status !== undefined      && { status }),
          ...(category !== undefined    && { category: category?.trim() || null })
        }
      })
      return reply.send(updated)
    } catch (err) {
      app.log.error({ err }, 'tasks.update failed')
      return reply.status(500).send({ error: 'שגיאה בעדכון המשימה' })
    }
  })

  // DELETE /api/tasks/:id — delete task
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return reply.status(400).send({ error: 'מזהה משימה לא תקין' })

    const task = await prisma.task.findFirst({ where: { id, userId: req.user.userId } })
    if (!task) return reply.status(404).send({ error: 'משימה לא נמצאה' })

    try {
      await prisma.task.delete({ where: { id } })
      return reply.send({ ok: true })
    } catch (err) {
      app.log.error({ err }, 'tasks.delete failed')
      return reply.status(500).send({ error: 'שגיאה במחיקת המשימה' })
    }
  })

  // PATCH /api/tasks/:id/toggle — toggle status between todo/done
  app.patch('/:id/toggle', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return reply.status(400).send({ error: 'מזהה משימה לא תקין' })

    const task = await prisma.task.findFirst({ where: { id, userId: req.user.userId } })
    if (!task) return reply.status(404).send({ error: 'משימה לא נמצאה' })

    try {
      const updated = await prisma.task.update({
        where: { id },
        data: { status: task.status === 'done' ? 'todo' : 'done' }
      })
      return reply.send(updated)
    } catch (err) {
      app.log.error({ err }, 'tasks.toggle failed')
      return reply.status(500).send({ error: 'שגיאה בעדכון המשימה' })
    }
  })
}
