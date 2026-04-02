import { prisma } from '../models/db.js'

// Mock QR code (base64 data URL for a placeholder pattern)
const MOCK_QR = 'data:image/svg+xml;base64,' + Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="white"/>
  <!-- QR pattern mock -->
  <rect x="10" y="10" width="60" height="60" fill="none" stroke="#1A1F36" stroke-width="4"/>
  <rect x="20" y="20" width="40" height="40" fill="#1A1F36"/>
  <rect x="130" y="10" width="60" height="60" fill="none" stroke="#1A1F36" stroke-width="4"/>
  <rect x="140" y="20" width="40" height="40" fill="#1A1F36"/>
  <rect x="10" y="130" width="60" height="60" fill="none" stroke="#1A1F36" stroke-width="4"/>
  <rect x="20" y="140" width="40" height="40" fill="#1A1F36"/>
  <!-- Center dots -->
  <rect x="90" y="10" width="20" height="8" fill="#1A1F36"/>
  <rect x="90" y="24" width="8" height="8" fill="#1A1F36"/>
  <rect x="102" y="24" width="8" height="8" fill="#1A1F36"/>
  <rect x="84" y="36" width="8" height="8" fill="#1A1F36"/>
  <rect x="108" y="36" width="8" height="8" fill="#1A1F36"/>
  <rect x="90" y="48" width="20" height="8" fill="#1A1F36"/>
  <rect x="10" y="90" width="8" height="20" fill="#1A1F36"/>
  <rect x="24" y="90" width="8" height="8" fill="#1A1F36"/>
  <rect x="24" y="102" width="8" height="8" fill="#1A1F36"/>
  <rect x="36" y="84" width="8" height="8" fill="#1A1F36"/>
  <rect x="36" y="108" width="8" height="8" fill="#1A1F36"/>
  <rect x="48" y="90" width="8" height="20" fill="#1A1F36"/>
  <!-- Random interior dots -->
  <rect x="66" y="66" width="8" height="8" fill="#1A1F36"/>
  <rect x="78" y="78" width="8" height="8" fill="#1A1F36"/>
  <rect x="90" y="66" width="8" height="8" fill="#1A1F36"/>
  <rect x="102" y="78" width="8" height="8" fill="#1A1F36"/>
  <rect x="114" y="66" width="8" height="8" fill="#1A1F36"/>
  <rect x="126" y="78" width="8" height="8" fill="#1A1F36"/>
  <rect x="78" y="90" width="8" height="8" fill="#1A1F36"/>
  <rect x="102" y="90" width="8" height="8" fill="#1A1F36"/>
  <rect x="66" y="102" width="8" height="8" fill="#1A1F36"/>
  <rect x="114" y="102" width="8" height="8" fill="#1A1F36"/>
  <rect x="126" y="114" width="8" height="8" fill="#1A1F36"/>
  <rect x="78" y="114" width="8" height="8" fill="#1A1F36"/>
  <rect x="102" y="114" width="8" height="8" fill="#1A1F36"/>
  <rect x="90" y="126" width="8" height="8" fill="#1A1F36"/>
  <rect x="66" y="126" width="8" height="8" fill="#1A1F36"/>
  <rect x="114" y="126" width="8" height="8" fill="#1A1F36"/>
  <rect x="130" y="90" width="60" height="8" fill="#1A1F36"/>
  <rect x="130" y="102" width="8" height="8" fill="#1A1F36"/>
  <rect x="142" y="110" width="8" height="8" fill="#1A1F36"/>
  <rect x="154" y="102" width="8" height="8" fill="#1A1F36"/>
  <rect x="166" y="110" width="8" height="8" fill="#1A1F36"/>
  <rect x="178" y="102" width="8" height="8" fill="#1A1F36"/>
  <rect x="130" y="118" width="8" height="8" fill="#1A1F36"/>
  <rect x="142" y="126" width="8" height="8" fill="#1A1F36"/>
  <rect x="154" y="118" width="8" height="8" fill="#1A1F36"/>
  <rect x="166" y="126" width="8" height="8" fill="#1A1F36"/>
  <rect x="178" y="118" width="8" height="8" fill="#1A1F36"/>
  <rect x="130" y="134" width="60" height="8" fill="#1A1F36"/>
  <text x="100" y="196" text-anchor="middle" font-family="Arial" font-size="8" fill="#6B7280">סרוק לחיבור WhatsApp</text>
</svg>`).toString('base64')

const TEMPLATE_TYPES = ['rsvp_invite', 'reminder', 'thank_you', 'custom']

export default async function whatsappRoutes(app) {

  // ── GET /api/whatsapp/status ─────────────────────────────────────────────────
  app.get('/status', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    let session = await prisma.waSession.findUnique({ where: { userId } })

    if (!session) {
      // Return mock disconnected state with QR
      return {
        connected: false,
        phone: null,
        qr: MOCK_QR,
        stats: { sent: 0, delivered: 0, failed: 0 }
      }
    }

    // Count stats from WaMessages
    const allMessages = await prisma.waMessage.findMany({ where: { userId } })
    let sent = 0, delivered = 0, failed = 0
    for (const msg of allMessages) {
      const results = msg.results ? JSON.parse(msg.results) : []
      for (const r of results) {
        sent++
        if (r.status === 'sent') delivered++
        else if (r.status === 'failed') failed++
      }
    }

    return {
      connected: session.status === 'connected',
      phone: session.phoneNumber,
      qr: session.status === 'connected' ? null : MOCK_QR,
      status: session.status,
      lastActive: session.lastActive,
      stats: { sent, delivered, failed }
    }
  })

  // ── POST /api/whatsapp/connect (mock) ────────────────────────────────────────
  app.post('/connect', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { phone } = req.body || {}

    const phoneNumber = phone || '050-123-4567'

    const session = await prisma.waSession.upsert({
      where: { userId },
      update: {
        status: 'connected',
        phoneNumber,
        lastActive: new Date()
      },
      create: {
        userId,
        status: 'connected',
        phoneNumber,
        lastActive: new Date()
      }
    })

    return { connected: true, phone: session.phoneNumber }
  })

  // ── POST /api/whatsapp/disconnect ────────────────────────────────────────────
  app.post('/disconnect', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    await prisma.waSession.upsert({
      where: { userId },
      update: { status: 'disconnected', phoneNumber: null },
      create: { userId, status: 'disconnected' }
    })

    return { connected: false }
  })

  // ── GET /api/whatsapp/templates ──────────────────────────────────────────────
  app.get('/templates', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const templates = await prisma.waTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    return templates
  })

  // ── POST /api/whatsapp/templates ─────────────────────────────────────────────
  app.post('/templates', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { name, type, content } = req.body || {}

    if (!name || !content) {
      return req.server.httpErrors?.badRequest('שם ותוכן הן שדות חובה') ||
        { statusCode: 400, error: 'שם ותוכן הם שדות חובה' }
    }

    const template = await prisma.waTemplate.create({
      data: {
        userId,
        name,
        type: type || 'custom',
        content,
        variables: JSON.stringify(
          (content.match(/\{[^}]+\}/g) || []).map(v => v.replace(/[{}]/g, ''))
        )
      }
    })
    return template
  })

  // ── PUT /api/whatsapp/templates/:id ──────────────────────────────────────────
  app.put('/templates/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const { name, type, content } = req.body || {}

    const existing = await prisma.waTemplate.findFirst({ where: { id, userId } })
    if (!existing) {
      req.server.httpErrors?.notFound('תבנית לא נמצאה')
      return { statusCode: 404, error: 'תבנית לא נמצאה' }
    }

    const template = await prisma.waTemplate.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        content: content ?? existing.content,
        variables: content
          ? JSON.stringify((content.match(/\{[^}]+\}/g) || []).map(v => v.replace(/[{}]/g, '')))
          : existing.variables
      }
    })
    return template
  })

  // ── DELETE /api/whatsapp/templates/:id ───────────────────────────────────────
  app.delete('/templates/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)

    const existing = await prisma.waTemplate.findFirst({ where: { id, userId } })
    if (!existing) {
      return { statusCode: 404, error: 'תבנית לא נמצאה' }
    }

    await prisma.waTemplate.delete({ where: { id } })
    return { success: true }
  })

  // ── POST /api/whatsapp/send ──────────────────────────────────────────────────
  app.post('/send', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { guestIds = [], templateId, message } = req.body || {}

    if (guestIds.length === 0) {
      return { statusCode: 400, error: 'יש לבחור לפחות אורח אחד' }
    }

    // Fetch guests to get names & phones
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds.map(Number) }, userId }
    })

    // Fetch template if templateId given
    let templateContent = message || ''
    if (templateId) {
      const tmpl = await prisma.waTemplate.findFirst({
        where: { id: Number(templateId), userId }
      })
      if (tmpl) templateContent = tmpl.content
    }

    // Mock send: randomly succeed/fail (90% success)
    const results = guests.map(g => ({
      guestId: g.id,
      guestName: g.name,
      phone: g.phone || 'לא ידוע',
      status: Math.random() > 0.1 ? 'sent' : 'failed',
      message: templateContent.replace(/{שם_אורח}/g, g.name)
    }))

    const sent = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    // Store in DB
    const batch = await prisma.waMessage.create({
      data: {
        userId,
        templateId: templateId ? Number(templateId) : null,
        recipientIds: JSON.stringify(guestIds.map(Number)),
        message: templateContent,
        results: JSON.stringify(results),
        status: failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial',
        sentAt: new Date()
      }
    })

    return {
      batchId: batch.id,
      total: guests.length,
      sent,
      failed,
      results
    }
  })

  // ── GET /api/whatsapp/history ────────────────────────────────────────────────
  app.get('/history', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId

    const batches = await prisma.waMessage.findMany({
      where: { userId, sentAt: { not: null } },
      include: { template: { select: { name: true, type: true } } },
      orderBy: { sentAt: 'desc' },
      take: 10
    })

    return batches.map(b => {
      const results = b.results ? JSON.parse(b.results) : []
      const recipientIds = b.recipientIds ? JSON.parse(b.recipientIds) : []
      return {
        id: b.id,
        sentAt: b.sentAt,
        templateName: b.template?.name || 'הודעה מותאמת',
        templateType: b.template?.type || 'custom',
        total: recipientIds.length,
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length,
        status: b.status,
        results
      }
    })
  })
}
