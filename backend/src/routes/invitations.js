import { prisma } from '../models/db.js'

export default async function invitationRoutes(app) {

  // ── GET /templates — list all system templates (public) ───────────────────
  app.get('/templates', async (req, reply) => {
    const templates = await prisma.invitationTemplate.findMany({
      where: { isSystem: true },
      orderBy: { id: 'asc' }
    })
    return templates.map(t => ({
      ...t,
      textZones: JSON.parse(t.textZones)
    }))
  })

  // ── GET /templates/:id — single template (public) ─────────────────────────
  app.get('/templates/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const tpl = await prisma.invitationTemplate.findUnique({ where: { id } })
    if (!tpl) return reply.code(404).send({ error: 'NOT_FOUND', message: 'תבנית לא נמצאה' })

    return { ...tpl, textZones: JSON.parse(tpl.textZones) }
  })

  // ── GET / — user's saved invitations (auth) ───────────────────────────────
  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const invitations = await prisma.userInvitation.findMany({
      where: { userId },
      include: { template: true },
      orderBy: { updatedAt: 'desc' }
    })
    return invitations.map(inv => ({
      ...inv,
      fields: JSON.parse(inv.fields),
      customZones: inv.customZones ? JSON.parse(inv.customZones) : null,
      template: {
        ...inv.template,
        textZones: JSON.parse(inv.template.textZones)
      }
    }))
  })

  // ── POST / — create invitation (auth) ─────────────────────────────────────
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { templateId, fields, customZones, font } = req.body || {}

    if (!templateId || isNaN(parseInt(templateId))) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'נדרש מזהה תבנית' })
    }

    const template = await prisma.invitationTemplate.findUnique({
      where: { id: parseInt(templateId) }
    })
    if (!template) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'תבנית לא נמצאה' })
    }

    const invitation = await prisma.userInvitation.create({
      data: {
        userId,
        templateId: parseInt(templateId),
        fields: typeof fields === 'string' ? fields : JSON.stringify(fields || {}),
        customZones: customZones ? (typeof customZones === 'string' ? customZones : JSON.stringify(customZones)) : null,
        font: font || 'Heebo'
      },
      include: { template: true }
    })

    return reply.code(201).send({
      ...invitation,
      fields: JSON.parse(invitation.fields),
      customZones: invitation.customZones ? JSON.parse(invitation.customZones) : null,
      template: {
        ...invitation.template,
        textZones: JSON.parse(invitation.template.textZones)
      }
    })
  })

  // ── GET /:id — get single invitation (auth, userId check) ─────────────────
  app.get('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const invitation = await prisma.userInvitation.findFirst({
      where: { id, userId },
      include: { template: true }
    })
    if (!invitation) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הזמנה לא נמצאה' })

    return {
      ...invitation,
      fields: JSON.parse(invitation.fields),
      customZones: invitation.customZones ? JSON.parse(invitation.customZones) : null,
      template: {
        ...invitation.template,
        textZones: JSON.parse(invitation.template.textZones)
      }
    }
  })

  // ── PUT /:id — update invitation (auth, userId check) ─────────────────────
  app.put('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const existing = await prisma.userInvitation.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הזמנה לא נמצאה' })

    const { fields, customZones, font } = req.body || {}

    const updated = await prisma.userInvitation.update({
      where: { id },
      data: {
        ...(fields !== undefined && {
          fields: typeof fields === 'string' ? fields : JSON.stringify(fields)
        }),
        ...(customZones !== undefined && {
          customZones: customZones ? (typeof customZones === 'string' ? customZones : JSON.stringify(customZones)) : null
        }),
        ...(font !== undefined && { font })
      },
      include: { template: true }
    })

    return {
      ...updated,
      fields: JSON.parse(updated.fields),
      customZones: updated.customZones ? JSON.parse(updated.customZones) : null,
      template: {
        ...updated.template,
        textZones: JSON.parse(updated.template.textZones)
      }
    }
  })

  // ── DELETE /:id — delete invitation (auth, userId check) ──────────────────
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const existing = await prisma.userInvitation.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הזמנה לא נמצאה' })

    await prisma.userInvitation.delete({ where: { id } })
    return reply.code(204).send()
  })

  // ── GET /:id/public — public preview (no auth) ────────────────────────────
  app.get('/:id/public', async (req, reply) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const invitation = await prisma.userInvitation.findUnique({
      where: { id },
      include: { template: true }
    })
    if (!invitation) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הזמנה לא נמצאה' })

    return {
      id: invitation.id,
      font: invitation.font,
      fields: JSON.parse(invitation.fields),
      customZones: invitation.customZones ? JSON.parse(invitation.customZones) : null,
      template: {
        id: invitation.template.id,
        name: invitation.template.name,
        imageUrl: invitation.template.imageUrl,
        textZones: JSON.parse(invitation.template.textZones)
      }
    }
  })

  // ── GET /:id/pdf — export PDF via Puppeteer (auth) ────────────────────────
  app.get('/:id/pdf', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const existing = await prisma.userInvitation.findFirst({ where: { id, userId } })
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'הזמנה לא נמצאה' })

    try {
      const puppeteer = await import('puppeteer')
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      })
      const page = await browser.newPage()

      // Build the public preview URL — the server serves the SPA
      const host = `http://localhost:${process.env.PORT || 3001}`
      const url = `${host}/invitation/${id}?export=1`

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      await page.waitForSelector('.invitation-canvas-container', { timeout: 15000 }).catch(() => {})

      // Take screenshot of the invitation area
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 600, height: 850 }
      })

      await browser.close()

      // Wrap screenshot in a simple PDF-like response (actually PNG for simplicity)
      reply.header('Content-Type', 'image/png')
      reply.header('Content-Disposition', `attachment; filename="invitation-${id}.png"`)
      return reply.send(screenshot)
    } catch (err) {
      app.log.error(err)
      return reply.code(500).send({ error: 'PDF_ERROR', message: 'שגיאה ביצירת הקובץ' })
    }
  })
}
