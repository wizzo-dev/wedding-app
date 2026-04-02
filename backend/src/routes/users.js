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
}
