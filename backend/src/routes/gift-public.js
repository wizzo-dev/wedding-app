import { prisma } from '../models/db.js'

export default async function giftPublicRoutes(app) {
  // GET /api/gift/:token — get event details for gift page
  app.get('/:token', async (req, reply) => {
    const { token } = req.params
    const user = await prisma.user.findFirst({
      where: { rsvpToken: token },
      select: { id:true, name1:true, name2:true, weddingDate:true, venue:true }
    })
    if (!user) return reply.code(404).send({ error: 'לא נמצא' })
    return { name1: user.name1, name2: user.name2, weddingDate: user.weddingDate, venue: user.venue }
  })

  // POST /api/gift/:token/submit — submit a digital gift
  app.post('/:token/submit', async (req, reply) => {
    const { token } = req.params
    const { name, message, amount } = req.body || {}
    if (!name) return reply.code(400).send({ error: 'שם נדרש' })
    const user = await prisma.user.findFirst({ where: { rsvpToken: token } })
    if (!user) return reply.code(404).send({ error: 'לא נמצא' })
    const gift = await prisma.giftSubmission.create({
      data: { userId: user.id, name, message: message||null, amount: amount ? parseFloat(amount) : null }
    })
    return { success: true, id: gift.id }
  })
}
