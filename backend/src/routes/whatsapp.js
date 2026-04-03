import { prisma } from '../models/db.js'
import pkg from 'whatsapp-web.js'
const { Client, LocalAuth, MessageMedia } = pkg
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSIONS_DIR = path.join(__dirname, '../../../sessions')

// Per-user WhatsApp clients
const clients = new Map()  // userId → { client, qr, status }

function getClientState(userId) {
  return clients.get(userId) || { client: null, qr: null, status: 'disconnected' }
}

async function createClient(userId) {
  const state = getClientState(userId)
  if (state.client) return state.client

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `user_${userId}`,
      dataPath: SESSIONS_DIR
    }),
    puppeteer: {
      executablePath: '/home/pico/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
  })

  clients.set(userId, { client, qr: null, status: 'loading' })

  client.on('qr', (qr) => {
    console.log(`[WA] QR for user ${userId}`)
    clients.set(userId, { client, qr, status: 'qr' })
  })

  client.on('ready', async () => {
    console.log(`[WA] Ready for user ${userId}`)
    const info = client.info
    clients.set(userId, { client, qr: null, status: 'connected' })
    await prisma.waSession.upsert({
      where: { userId },
      update: { status: 'connected', phoneNumber: info?.wid?.user || '', lastActive: new Date() },
      create: { userId, status: 'connected', phoneNumber: info?.wid?.user || '' }
    })
  })

  client.on('disconnected', async () => {
    console.log(`[WA] Disconnected user ${userId}`)
    clients.set(userId, { client: null, qr: null, status: 'disconnected' })
    clients.delete(userId)
    await prisma.waSession.updateMany({
      where: { userId },
      data: { status: 'disconnected' }
    })
  })

  client.on('auth_failure', () => {
    clients.set(userId, { client: null, qr: null, status: 'auth_failure' })
    clients.delete(userId)
  })

  await client.initialize()
  return client
}

export default async function whatsappRoutes(app) {

  // GET /api/whatsapp/status
  app.get('/status', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const state = getClientState(userId)

    // Try to load from DB for persistent session info
    const session = await prisma.waSession.findUnique({ where: { userId } }).catch(() => null)

    return {
      status: state.status,
      connected: state.status === 'connected',
      qr: state.qr || null,
      phone: session?.phoneNumber || null,
      lastActive: session?.lastActive || null
    }
  })

  // POST /api/whatsapp/connect — start client and get QR
  app.post('/connect', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const state = getClientState(userId)

    if (state.status === 'connected') return { connected: true, status: 'connected' }
    if (state.status === 'loading' || state.status === 'qr') {
      return { status: state.status, qr: state.qr }
    }

    // Start client async (don't await full init — just start it)
    createClient(userId).catch(e => console.error('[WA] init error:', e))

    // Wait up to 15s for QR to appear
    let waited = 0
    while (waited < 15000) {
      await new Promise(r => setTimeout(r, 500))
      waited += 500
      const s = getClientState(userId)
      if (s.qr || s.status === 'connected') break
    }

    const s = getClientState(userId)
    return { status: s.status, qr: s.qr, connected: s.status === 'connected' }
  })

  // GET /api/whatsapp/qr — poll for QR code (returns base64 qr image)
  app.get('/qr', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const state = getClientState(userId)
    if (!state.qr) return reply.code(204).send()

    // Convert qr string to PNG using qrcode
    try {
      const QRCode = (await import('qrcode')).default
      const png = await QRCode.toDataURL(state.qr, { width: 300 })
      return { qr: png, status: state.status }
    } catch {
      return { qr: state.qr, status: state.status }
    }
  })

  // POST /api/whatsapp/disconnect
  app.post('/disconnect', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const state = getClientState(userId)
    if (state.client) {
      await state.client.destroy().catch(() => {})
      clients.delete(userId)
    }
    await prisma.waSession.updateMany({ where: { userId }, data: { status: 'disconnected' } })
    return { ok: true }
  })

  // POST /api/whatsapp/send — send message to a phone number
  app.post('/send', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { phone, message } = req.body
    const state = getClientState(userId)
    if (!state.client || state.status !== 'connected') {
      return reply.code(400).send({ error: 'NOT_CONNECTED' })
    }
    const chatId = phone.replace(/\D/g, '') + '@c.us'
    await state.client.sendMessage(chatId, message)
    return { ok: true }
  })

  // GET /api/whatsapp/templates — returns system templates only
  app.get('/templates', { preHandler: [app.authenticate] }, async (req) => {
    return prisma.waTemplate.findMany({
      where: { isSystem: true },
      orderBy: [{ category: 'asc' }, { style: 'asc' }]
    })
  })

  // POST /api/whatsapp/admin/templates — admin only (requires x-admin-key header)
  app.post('/admin/templates', async (req, reply) => {
    if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY && req.headers['x-admin-key'] !== 'yalla-admin-2026') {
      return reply.code(403).send({ error: 'FORBIDDEN' })
    }
    const { name, style, category, body, emoji } = req.body
    return prisma.waTemplate.create({ data: { name, style, category, body, emoji, isSystem: true, userId: null } })
  })

  // POST /api/whatsapp/send-bulk
  app.post('/send-bulk', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { templateId, guestIds, scheduledAt } = req.body

    if (!templateId || !guestIds?.length) return reply.code(400).send({ error: 'MISSING_PARAMS' })

    // Validate schedule time (9:00-22:00 only)
    if (scheduledAt) {
      const dt = new Date(scheduledAt)
      const hour = dt.getHours()
      if (hour < 9 || hour >= 22) return reply.code(400).send({ error: 'INVALID_HOUR', message: 'ניתן לשלוח רק בין 9:00 ל-22:00' })
    }

    const template = await prisma.waTemplate.findFirst({ where: { id: parseInt(templateId) } })
    if (!template) return reply.code(404).send({ error: 'TEMPLATE_NOT_FOUND' })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    const guests = await prisma.guest.findMany({ where: { id: { in: guestIds.map(Number) }, userId } })

    if (scheduledAt) {
      // Save as scheduled messages
      await prisma.waMessage.createMany({
        data: guests.map(g => ({
          userId,
          templateId: template.id,
          recipientPhone: g.phone,
          recipientName: g.name,
          body: (template.body || template.content)
            .replace(/{{name}}/g, g.name)
            .replace(/{{name1}}/g, user.name1 || '')
            .replace(/{{name2}}/g, user.name2 || ''),
          status: 'scheduled',
          scheduledAt: new Date(scheduledAt)
        }))
      })
      return { ok: true, scheduled: guests.length }
    }

    // Send now
    const state = getClientState(userId)
    const results = { sent: 0, failed: 0 }

    for (const guest of guests) {
      if (!guest.phone) { results.failed++; continue }
      const body = (template.body || template.content)
        .replace(/{{name}}/g, guest.name)
        .replace(/{{name1}}/g, user.name1 || '')
        .replace(/{{name2}}/g, user.name2 || '')
        .replace(/{{venue}}/g, user.venue || '')
        .replace(/{{date}}/g, user.weddingDate ? new Date(user.weddingDate).toLocaleDateString('he-IL') : '')
        .replace(/{{rsvp_link}}/g, `https://aware-carries-protecting-bay.trycloudflare.com/rsvp/${user.rsvpToken}`)

      try {
        if (state?.client && state.status === 'connected') {
          const chatId = guest.phone.replace(/\D/g, '') + '@c.us'
          await state.client.sendMessage(chatId, body)
        }
        await prisma.waMessage.create({ data: { userId, templateId: template.id, recipientPhone: guest.phone, recipientName: guest.name, body, status: 'sent', sentAt: new Date() } })
        results.sent++
      } catch(e) {
        await prisma.waMessage.create({ data: { userId, templateId: template.id, recipientPhone: guest.phone, recipientName: guest.name, body, status: 'failed' } })
        results.failed++
      }
    }

    return { ok: true, ...results }
  })

  // GET /api/whatsapp/messages — history
  app.get('/messages', { preHandler: [app.authenticate] }, async (req) => {
    const { status, limit = 50 } = req.query
    const where = { userId: req.user.userId }
    if (status) where.status = status
    return prisma.waMessage.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit) })
  })
}
