import { prisma } from '../models/db.js'

export default async function tasksRoutes(app) {
  // GET /api/tasks — list all tasks for current user
  app.get('/tasks', { preHandler: [app.authenticate] }, async (req, reply) => {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })
    return reply.send({ tasks })
  })

  // POST /api/tasks — create task
  app.post('/tasks', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { title, description, dueDate, priority, status, category } = req.body
    if (!title?.trim()) return reply.status(400).send({ error: 'כותרת המשימה היא שדה חובה' })

    const task = await prisma.task.create({
      data: {
        userId:      req.user.userId,
        title:       title.trim(),
        description: description?.trim() || null,
        dueDate:     dueDate ? new Date(dueDate) : null,
        priority:    priority || 'medium',
        status:      status || 'todo',
        category:    category?.trim() || null
      }
    })
    return reply.status(201).send(task)
  })

  // PUT /api/tasks/:id — update task
  app.put('/tasks/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const task = await prisma.task.findFirst({ where: { id, userId: req.user.userId } })
    if (!task) return reply.status(404).send({ error: 'משימה לא נמצאה' })

    const { title, description, dueDate, priority, status, category } = req.body
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined      && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(dueDate !== undefined     && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(priority !== undefined    && { priority }),
        ...(status !== undefined      && { status }),
        ...(category !== undefined    && { category: category?.trim() || null })
      }
    })
    return reply.send(updated)
  })

  // DELETE /api/tasks/:id — delete task
  app.delete('/tasks/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const task = await prisma.task.findFirst({ where: { id, userId: req.user.userId } })
    if (!task) return reply.status(404).send({ error: 'משימה לא נמצאה' })

    await prisma.task.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // PATCH /api/tasks/:id/toggle — toggle status between todo/done
  app.patch('/tasks/:id/toggle', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const task = await prisma.task.findFirst({ where: { id, userId: req.user.userId } })
    if (!task) return reply.status(404).send({ error: 'משימה לא נמצאה' })

    const updated = await prisma.task.update({
      where: { id },
      data: { status: task.status === 'done' ? 'todo' : 'done' }
    })
    return reply.send(updated)
  })
}
