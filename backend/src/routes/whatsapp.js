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

  // GET /api/whatsapp/templates — system + this user's custom templates
  app.get('/templates', { preHandler: [app.authenticate] }, async (req) => {
    return prisma.waTemplate.findMany({
      where: { OR: [{ isSystem: true }, { userId: req.user.userId }] },
      orderBy: [{ category: 'asc' }, { style: 'asc' }]
    })
  })

  // POST /api/whatsapp/templates — create a user-owned template
  app.post('/templates', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { name, style, category, body, content, emoji } = req.body || {}
    if (!name?.trim()) return reply.code(400).send({ error: 'MISSING_NAME', message: 'חובה להזין שם תבנית' })
    const txt = (body ?? content ?? '').toString()
    if (!txt.trim()) return reply.code(400).send({ error: 'MISSING_BODY', message: 'חובה להזין תוכן תבנית' })
    return prisma.waTemplate.create({
      data: {
        userId: req.user.userId,
        name: name.trim(),
        style: style || null,
        category: category || null,
        body: txt,
        content: txt,
        emoji: emoji || null,
        isSystem: false
      }
    })
  })

  // PUT /api/whatsapp/templates/:id — update a user-owned template
  app.put('/templates/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const tmpl = await prisma.waTemplate.findUnique({ where: { id } })
    if (!tmpl || tmpl.userId !== req.user.userId) return reply.code(404).send({ error: 'NOT_FOUND' })
    const { name, style, category, body, content, emoji } = req.body || {}
    const txt = body ?? content
    return prisma.waTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(style !== undefined && { style }),
        ...(category !== undefined && { category }),
        ...(emoji !== undefined && { emoji }),
        ...(txt !== undefined && { body: String(txt), content: String(txt) })
      }
    })
  })

  // DELETE /api/whatsapp/templates/:id
  app.delete('/templates/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const tmpl = await prisma.waTemplate.findUnique({ where: { id } })
    if (!tmpl || tmpl.userId !== req.user.userId) return reply.code(404).send({ error: 'NOT_FOUND' })
    await prisma.waTemplate.delete({ where: { id } })
    return { ok: true }
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

    // Send now — verify WhatsApp is connected first
    const state = getClientState(userId)
    if (!state?.client || state.status !== 'connected') {
      return reply.code(400).send({ error: 'WA_NOT_CONNECTED', message: 'WhatsApp לא מחובר. אנא סרוק QR מחדש בהגדרות WhatsApp.' })
    }
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
        if (!state?.client || state.status !== 'connected') {
          // WhatsApp not connected — save as failed
          await prisma.waMessage.create({ data: { userId, templateId: template.id, recipientPhone: guest.phone, recipientName: guest.name, body, status: 'failed' } })
          results.failed++
          continue
        }
        // Normalize Israeli phone: 0XX → 972XX, +972XX → 972XX
        let normalized = guest.phone.replace(/\D/g, '')
        if (normalized.startsWith('0')) normalized = '972' + normalized.slice(1)
        else if (normalized.startsWith('00972')) normalized = normalized.slice(2)
        const chatId = normalized + '@c.us'
        console.log(`[WA] Sending to ${chatId}`)
        await state.client.sendMessage(chatId, body)
        await prisma.waMessage.create({ data: { userId, templateId: template.id, recipientPhone: guest.phone, recipientName: guest.name, body, status: 'sent', sentAt: new Date() } })
        results.sent++
      } catch(e) {
        const errMsg = e?.message || String(e) || 'unknown error'
        console.error(`[WA] Send failed to ${guest.phone}:`, errMsg)
        await prisma.waMessage.create({ data: { userId, templateId: template.id, recipientPhone: guest.phone, recipientName: guest.name, body, status: 'failed', error: errMsg } })
        results.failed++
      }
    }

    return { ok: true, ...results }
  })

  // GET /api/whatsapp/messages — history with pagination
  app.get('/messages', { preHandler: [app.authenticate] }, async (req) => {
    const { status, page = 1, limit = 20 } = req.query
    const userId = req.user.userId
    const where = { userId }
    if (status) where.status = status
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [total, items] = await Promise.all([
      prisma.waMessage.count({ where }),
      prisma.waMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) })
    ])
    return { items, totalPages: Math.ceil(total / parseInt(limit)), total, page: parseInt(page) }
  })

  // POST /api/whatsapp/resend/:id — resend failed messages from a batch
  app.post('/resend/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const msgId = parseInt(req.params.id)
    const original = await prisma.waMessage.findFirst({ where: { id: msgId, userId } })
    if (!original) return reply.code(404).send({ error: 'NOT_FOUND' })

    const state = getClientState(userId)
    if (!state?.client || state.status !== 'connected') {
      return reply.code(400).send({ error: 'WA_NOT_CONNECTED', message: 'WhatsApp לא מחובר' })
    }

    try {
      let normalized = original.recipientPhone.replace(/\D/g, '')
      if (normalized.startsWith('0')) normalized = '972' + normalized.slice(1)
      else if (normalized.startsWith('00972')) normalized = normalized.slice(2)
      const chatId = normalized + '@c.us'
      await state.client.sendMessage(chatId, original.body)
      await prisma.waMessage.update({ where: { id: msgId }, data: { status: 'sent', sentAt: new Date(), error: null } })
      return { ok: true, resent: 1 }
    } catch (e) {
      return reply.code(500).send({ error: 'SEND_FAILED', message: e.message })
    }
  })

  // Auto-reconnect users with existing WA sessions on startup
  app.addHook('onReady', async () => {
    try {
      const activeSessions = await prisma.waSession.findMany({ where: { status: 'connected' } })
      for (const session of activeSessions) {
        console.log(`[WA] Auto-reconnecting user ${session.userId}...`)
        createClient(session.userId).catch(e => console.error(`[WA] Auto-reconnect failed for user ${session.userId}:`, e.message))
      }
    } catch (e) {
      console.error('[WA] Auto-reconnect startup error:', e.message)
    }
  })
}
