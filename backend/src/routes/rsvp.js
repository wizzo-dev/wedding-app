import { prisma } from '../models/db.js'

export default async function rsvpRoutes(app) {
  // GET /api/rsvp/:token — public, no auth
  app.get('/:token', async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { rsvpToken: req.params.token },
      select: { name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true }
    })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND' })
    return user
  })

  // GET /api/rsvp/:token/:guestToken — public, pre-fill guest
  app.get('/:token/:guestToken', async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { rsvpToken: req.params.token },
      select: { name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true }
    })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND' })
    const guest = await prisma.guest.findFirst({
      where: { guestToken: req.params.guestToken },
      select: { name: true, phone: true, numPeople: true, rsvpStatus: true }
    })
    return { ...user, guest: guest || null }
  })

  // POST /api/rsvp/:token/respond — public, rate-limited
  app.post('/:token/respond', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } }
  }, async (req, reply) => {
    const { guestToken, name, phone, numPeople = 1, rsvpStatus, notes } = req.body
    const user = await prisma.user.findUnique({ where: { rsvpToken: req.params.token } })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND' })

    if (guestToken) {
      await prisma.guest.updateMany({
        where: { guestToken, userId: user.id },
        data: { rsvpStatus, numPeople: parseInt(numPeople), notes }
      })
    } else {
      await prisma.guest.create({
        data: {
          userId: user.id,
          name,
          phone,
          numPeople: parseInt(numPeople),
          rsvpStatus: rsvpStatus || 'confirmed',
          notes
        }
      })
    }
    return { success: true }
  })

  // GET /api/gift/:token — public
  app.get('/gift/:token', async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { rsvpToken: req.params.token },
      select: { name1: true, name2: true, weddingDate: true }
    })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND' })
    return user
  })

  // POST /api/gift/:token/submit — public, rate-limited
  app.post('/gift/:token/submit', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } }
  }, async (req, reply) => {
    const { name, message, amount } = req.body
    const user = await prisma.user.findUnique({ where: { rsvpToken: req.params.token } })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND' })

    if (amount) {
      await prisma.guest.create({
        data: {
          userId: user.id,
          name: name || 'אנונימי',
          giftAmount: parseFloat(amount),
          notes: message,
          rsvpStatus: 'confirmed',
          numPeople: 0
        }
      })
    }
    return { success: true }
  })
}
