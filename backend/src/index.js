import 'dotenv/config'
import Fastify from 'fastify'
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

// ── Static Frontend ───────────────────────────────────────────────────────────
const frontendDist = join(__dirname, '../../frontend/dist')
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
