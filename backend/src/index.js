import 'dotenv/config'
import Fastify from 'fastify'
import { prisma } from './models/db.js'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { readFileSync } from 'fs'
// socket.io - will be added later
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import budgetRoutes from './routes/budget.js'
import guestRoutes from './routes/guests.js'
import whatsappRoutes from './routes/whatsapp.js'
import seatingRoutes from './routes/seating.js'
import cardsRoutes from './routes/cards.js'
import giftsRoutes from './routes/gifts.js'
import vendorRoutes from './routes/vendors.js'
import dashboardRoutes from './routes/dashboard.js'
import timelineRoutes from './routes/timeline.js'
import statsRoutes from './routes/stats.js'
import subscriptionRoutes from './routes/subscription.js'
import rsvpRoutes from './routes/rsvp.js'

import notificationRoutes from './routes/notifications.js'
import vendorSuggestionsRoutes from './routes/vendorSuggestions.js'
import invitationRoutes from './routes/invitations.js'
import tasksRoutes from './routes/tasks.js'

const app = Fastify({ logger: process.env.NODE_ENV === 'development' })

// ── Security Middleware ───────────────────────────────────────────────────────
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  }
})

await app.register(cors, {
  origin: (origin, cb) => {
    // Allow any origin (supports Cloudflare tunnel + dev)
    cb(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
})

await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  ban: 3,
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'יותר מדי בקשות, נסה שוב בעוד דקה'
  })
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET,
  sign: { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
})

await app.register(cookie, {
  secret: process.env.JWT_REFRESH_SECRET
})

await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

// ── Auth Decorator ────────────────────────────────────────────────────────────
app.decorate('authenticate', async (req, reply) => {
  try {
    await req.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: 'UNAUTHORIZED', message: 'אנא התחבר מחדש' })
  }
})

app.decorate('requirePremium', async (req, reply) => {
  if (req.user.plan !== 'premium') {
    reply.code(403).send({
      error: 'UPGRADE_REQUIRED',
      message: 'פיצ\'ר זה זמין בחבילת פרמיום בלבד',
      upgradeUrl: '/settings/subscription'
    })
  }
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.register(authRoutes,      { prefix: '/api/auth' })
app.register(userRoutes,      { prefix: '/api/users' })
app.register(budgetRoutes,    { prefix: '/api/budget' })
app.register(guestRoutes,     { prefix: '/api/guests' })
app.register(whatsappRoutes,  { prefix: '/api/whatsapp' })
app.register(seatingRoutes,   { prefix: '/api/seating' })
app.register(cardsRoutes,     { prefix: '/api/cards' })
app.register(giftsRoutes,     { prefix: '/api/gifts' })
app.register(vendorRoutes,            { prefix: '/api/vendors' })
app.register(vendorSuggestionsRoutes, { prefix: '/api/vendors' })
app.register(dashboardRoutes, { prefix: '/api/dashboard' })
app.register(timelineRoutes,        { prefix: '/api/timeline' })
app.register(statsRoutes,           { prefix: '/api/stats' })
app.register(notificationRoutes,    { prefix: '/api/notifications' })
app.register(subscriptionRoutes,    { prefix: '/api/subscription' })
app.register(rsvpRoutes,           { prefix: '/api/rsvp' })
app.register(invitationRoutes,     { prefix: '/api/invitations' })
app.register(tasksRoutes,          { prefix: '/api/tasks' })

// ── RSVP OG Tags — serve index.html with injected Open Graph meta tags ───────
const frontendDist = join(__dirname, '../../frontend/dist')

app.get('/rsvp/:code', async (req, reply) => {
  const { code } = req.params
  try {
    // Try guest token first, then user rsvpToken
    const guest = await prisma.guest.findFirst({ where: { guestToken: code }, include: { user: true } })
    let user = guest?.user || await prisma.user.findUnique({ where: { rsvpToken: code } })
    if (!user) {
      // Not found — fall through to SPA (will show 404 in Vue)
      const indexPath = join(frontendDist, 'index.html')
      return reply.type('text/html').send(readFileSync(indexPath))
    }
    const names = [user.name1, user.name2].filter(Boolean).join(' ❤️ ')
    const date  = user.weddingDate ? new Date(user.weddingDate).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
    const venue = user.venue || ''
    const title = names ? `הזמנה לחתונה — ${names}` : 'הזמנה לחתונה'
    const desc  = [date && `📅 ${date}`, venue && `📍 ${venue}`, 'לחץ לאישור הגעה'].filter(Boolean).join(' | ')
    const image = user.profileImageUrl || 'https://aware-carries-protecting-bay.trycloudflare.com/og-default.jpg'
    const url   = `https://aware-carries-protecting-bay.trycloudflare.com/rsvp/${code}`

    const ogTags = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="he_IL" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />`

    const indexPath = join(frontendDist, 'index.html')
    const html = readFileSync(indexPath, 'utf8').replace('</head>', `${ogTags}\n  </head>`)
    reply.type('text/html').send(html)
  } catch(e) {
    const indexPath = join(frontendDist, 'index.html')
    reply.type('text/html').send(readFileSync(indexPath))
  }
})

// ── Static Frontend ───────────────────────────────────────────────────────────
app.register(staticFiles, {
  root: frontendDist,
  prefix: '/'
})

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', ts: Date.now() }))

// ── 404 - SPA Fallback ────────────────────────────────────────────────────────
app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'NOT_FOUND', message: 'endpoint לא קיים' })
  } else {
    const indexPath = join(frontendDist, 'index.html')
    reply.type('text/html').send(readFileSync(indexPath))
  }
})

// ── Error Handler ─────────────────────────────────────────────────────────────
app.setErrorHandler((err, req, reply) => {
  app.log.error(err)
  // לא חושפים stack traces ב-production
  if (process.env.NODE_ENV === 'production') {
    reply.code(err.statusCode || 500).send({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'שגיאה פנימית'
    })
  } else {
    reply.code(err.statusCode || 500).send({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack
    })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`🚀 Server running on port ${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
