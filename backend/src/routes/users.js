import bcrypt from 'bcrypt'
import { prisma } from '../models/db.js'

export default async function userRoutes(app) {
  app.get('/profile', { preHandler: [app.authenticate] }, async (req) => {
    return prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true, profileImageUrl: true, plan: true, rsvpToken: true }
    })
  })

  app.put('/profile', { preHandler: [app.authenticate] }, async (req) => {
    const { name1, name2, weddingDate, venue, venueAddress } = req.body
    return prisma.user.update({
      where: { id: req.user.userId },
      data: { name1, name2, weddingDate: weddingDate ? new Date(weddingDate) : undefined, venue, venueAddress },
      select: { id: true, name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true }
    })
  })

  // PUT /api/users/account — change email / password
  app.put('/account', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { email, currentPassword, newPassword } = req.body || {}

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'משתמש לא נמצא' })

    const updates = {}

    if (email && email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists) return reply.code(400).send({ error: 'כתובת המייל כבר קיימת במערכת' })
      updates.email = email
    }

    if (newPassword) {
      if (!currentPassword) return reply.code(400).send({ error: 'סיסמה נוכחית חסרה' })
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) return reply.code(400).send({ error: 'סיסמה נוכחית שגויה' })
      updates.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    if (!Object.keys(updates).length) return { message: 'לא בוצעו שינויים' }

    await prisma.user.update({ where: { id: userId }, data: updates })
    return { success: true, message: 'הפרטים עודכנו בהצלחה' }
  })

}
