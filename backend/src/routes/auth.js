import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../models/db.js'
import { validate, schemas } from '../middleware/validate.js'

const BCRYPT_ROUNDS = 12
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000

const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'אולם',             allocatedPercent: 30, icon: '🏛️',  color: '#e8d5b7' },
  { name: 'קייטרינג',         allocatedPercent: 25, icon: '🍽️',  color: '#f8b4b4' },
  { name: 'צילום ווידאו',     allocatedPercent: 12, icon: '📸',  color: '#b4d4f8' },
  { name: 'להקה / DJ',        allocatedPercent: 10, icon: '🎵',  color: '#d4b4f8' },
  { name: 'שמלה וחליפה',      allocatedPercent: 8,  icon: '👗',  color: '#f8d4e8' },
  { name: 'פרחים ועיצוב',     allocatedPercent: 7,  icon: '💐',  color: '#b4f8d4' },
  { name: 'הזמנות',           allocatedPercent: 3,  icon: '✉️',  color: '#f8f4b4' },
  { name: 'שונות',            allocatedPercent: 5,  icon: '📋',  color: '#d4d4d4' },
]

export default async function authRoutes(app) {
  // ── Register ────────────────────────────────────────────────────────────────
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    preHandler: [validate(schemas.register)]
  }, async (req, reply) => {
    const { email, password, name1, name2, weddingDate } = req.body

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return reply.code(409).send({ error: 'EMAIL_EXISTS', message: 'אימייל כבר רשום במערכת' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const rsvpToken = crypto.randomBytes(5).toString('hex') // 10 chars

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name1,
        name2,
        weddingDate: weddingDate ? new Date(weddingDate) : null,
        rsvpToken,
        budgetCategories: {
          create: DEFAULT_BUDGET_CATEGORIES.map(c => ({
            ...c,
            allocatedAmount: 0
          }))
        }
      }
    })

    const accessToken  = app.jwt.sign({ userId: user.id, plan: user.plan })
    const refreshToken = await createRefreshToken(user.id)

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: REFRESH_EXPIRES_MS / 1000,
      path: '/'
    })

    return {
      accessToken,
      user: sanitizeUser(user)
    }
  })

  // ── Login ────────────────────────────────────────────────────────────────────
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    preHandler: [validate(schemas.login)]
  }, async (req, reply) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // timing-safe: still hash even if user not found
      await bcrypt.hash(password, BCRYPT_ROUNDS)
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'אימייל או סיסמה שגויים' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'אימייל או סיסמה שגויים' })
    }

    const accessToken  = app.jwt.sign({ userId: user.id, plan: user.plan })
    const refreshToken = await createRefreshToken(user.id)

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: REFRESH_EXPIRES_MS / 1000,
      path: '/'
    })

    return {
      accessToken,
      user: sanitizeUser(user)
    }
  })

  // ── Refresh Token ────────────────────────────────────────────────────────────
  app.post('/refresh', async (req, reply) => {
    const token = req.cookies.refresh_token
    if (!token) return reply.code(401).send({ error: 'NO_REFRESH_TOKEN' })

    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.expiresAt < new Date()) {
      return reply.code(401).send({ error: 'INVALID_REFRESH_TOKEN' })
    }

    // rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { token } })
    const user = await prisma.user.findUnique({ where: { id: stored.userId } })

    const accessToken  = app.jwt.sign({ userId: user.id, plan: user.plan })
    const refreshToken = await createRefreshToken(user.id)

    reply.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: REFRESH_EXPIRES_MS / 1000,
      path: '/'
    })

    return { accessToken }
  })

  // ── Logout ───────────────────────────────────────────────────────────────────
  app.post('/logout', { preHandler: [app.authenticate] }, async (req, reply) => {
    const token = req.cookies.refresh_token
    if (token) await prisma.refreshToken.deleteMany({ where: { token } })
    reply.clearCookie('refresh_token', { path: '/' })
    return { success: true }
  })

  // ── Me ───────────────────────────────────────────────────────────────────────
  app.get('/me', { preHandler: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (!user) throw { statusCode: 404, message: 'משתמש לא נמצא' }
    return sanitizeUser(user)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex')
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS)
    }
  })
  return token
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user
  return safe
}
