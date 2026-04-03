import bcrypt from 'bcrypt'
import { prisma } from '../models/db.js'

const BCRYPT_ROUNDS = 12

export default async function userRoutes(app) {
  // GET /api/users/profile
  app.get('/profile', { preHandler: [app.authenticate] }, async (req) => {
    return prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true, profileImageUrl: true, plan: true, rsvpToken: true }
    })
  })

  // PUT /api/users/profile
  app.put('/profile', { preHandler: [app.authenticate] }, async (req) => {
    const { name1, name2, weddingDate, venue, venueAddress } = req.body
    return prisma.user.update({
      where: { id: req.user.userId },
      data: { name1, name2, weddingDate: weddingDate ? new Date(weddingDate) : undefined, venue, venueAddress },
      select: { id: true, name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true }
    })
  })

  // PATCH /api/users/profile — update profile including profileImageUrl
  app.patch('/profile', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { name1, name2, weddingDate, venue, venueAddress, profileImageUrl } = req.body || {}

    // Validate name1 / name2 — max 100 chars
    if (name1 !== undefined && name1 !== null) {
      if (typeof name1 !== 'string' || name1.length > 100) {
        return reply.code(400).send({ error: 'INVALID_NAME', message: 'שם 1 חייב להיות עד 100 תווים' })
      }
    }
    if (name2 !== undefined && name2 !== null) {
      if (typeof name2 !== 'string' || name2.length > 100) {
        return reply.code(400).send({ error: 'INVALID_NAME', message: 'שם 2 חייב להיות עד 100 תווים' })
      }
    }

    // Validate profileImageUrl — must be a valid URL string, max 500 chars
    if (profileImageUrl !== undefined && profileImageUrl !== null && profileImageUrl !== '') {
      if (typeof profileImageUrl !== 'string' || profileImageUrl.length > 500) {
        return reply.code(400).send({ error: 'INVALID_URL', message: 'כתובת תמונה חייבת להיות עד 500 תווים' })
      }
      try {
        const u = new URL(profileImageUrl)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error('bad protocol')
        }
      } catch {
        return reply.code(400).send({ error: 'INVALID_URL', message: 'כתובת תמונה אינה תקינה. יש לספק כתובת URL מלאה' })
      }
    }

    // Validate weddingDate — must be a parseable date string
    let parsedWeddingDate
    if (weddingDate !== undefined) {
      if (weddingDate === null || weddingDate === '') {
        parsedWeddingDate = null
      } else {
        const d = new Date(weddingDate)
        if (isNaN(d.getTime())) {
          return reply.code(400).send({ error: 'INVALID_DATE', message: 'תאריך החתונה אינו תקין' })
        }
        parsedWeddingDate = d
      }
    }

    const data = {}
    if (name1 !== undefined) data.name1 = name1
    if (name2 !== undefined) data.name2 = name2
    if (weddingDate !== undefined) data.weddingDate = parsedWeddingDate
    if (venue !== undefined) data.venue = venue
    if (venueAddress !== undefined) data.venueAddress = venueAddress
    if (profileImageUrl !== undefined) data.profileImageUrl = profileImageUrl || null

    return prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true, profileImageUrl: true, plan: true }
    })
  })

  // POST /api/users/change-password
  app.post('/change-password', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ error: 'MISSING_FIELDS', message: 'יש למלא את כל השדות' })
    }
    if (newPassword.length < 8) {
      return reply.code(400).send({ error: 'PASSWORD_TOO_SHORT', message: 'הסיסמה החדשה חייבת להכיל לפחות 8 תווים' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND', message: 'משתמש לא נמצא' })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'WRONG_PASSWORD', message: 'הסיסמה הנוכחית אינה נכונה' })
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newHash }
    })

    // Invalidate all refresh tokens to force re-login on other devices
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.userId } })

    return { success: true, message: 'הסיסמה שונתה בהצלחה' }
  })

  // DELETE /api/users/account
  app.delete('/account', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { password } = req.body

    if (!password) {
      return reply.code(400).send({ error: 'MISSING_PASSWORD', message: 'יש לאשר את מחיקת החשבון עם הסיסמה' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND', message: 'משתמש לא נמצא' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'WRONG_PASSWORD', message: 'הסיסמה שגויה' })
    }

    // Delete user — cascade deletes all related records (Prisma onDelete: Cascade)
    await prisma.user.delete({ where: { id: req.user.userId } })

    // Clear the refresh token cookie
    reply.clearCookie('refresh_token', { path: '/api/auth/refresh' })

    return { success: true, message: 'החשבון נמחק בהצלחה' }
  })
}
