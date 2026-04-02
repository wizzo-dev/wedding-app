import { prisma } from '../models/db.js'

export default async function rsvpRoutes(app) {
  // GET /api/rsvp/:token — public RSVP page data
  app.get('/:token', async (req, reply) => {
    const { token } = req.params
    const user = await prisma.user.findFirst({ where: { rsvpToken: token }, select: { id:true, name1:true, name2:true, weddingDate:true, venue:true, venueAddress:true, rsvpToken:true } })
    if (!user) return reply.code(404).send({ error: 'לא נמצא' })
    const names = [user.name1, user.name2].filter(Boolean).join(' ו-')
    return {
      name1: user.name1, name2: user.name2,
      weddingDate: user.weddingDate, venue: user.venue, venueAddress: user.venueAddress,
      ogTitle: `הזמנה לחתונה של ${names}`,
      ogDescription: `אנחנו מתחתנים! ${user.venue || ''}`,
    }
  })

  // GET /api/rsvp/:token/:guestToken — pre-fill guest info
  app.get('/:token/:guestToken', async (req, reply) => {
    const { token, guestToken } = req.params
    const user = await prisma.user.findFirst({ where: { rsvpToken: token }, select: { id:true, name1:true, name2:true, weddingDate:true, venue:true, venueAddress:true } })
    if (!user) return reply.code(404).send({ error: 'לא נמצא' })
    const guest = await prisma.guest.findFirst({ where: { userId: user.id, guestToken } })
    return {
      name1: user.name1, name2: user.name2,
      weddingDate: user.weddingDate, venue: user.venue, venueAddress: user.venueAddress,
      ogTitle: `הזמנה לחתונה של ${user.name1} ו-${user.name2}`,
      ogDescription: `אנחנו מתחתנים!`,
      guest: guest ? { name: guest.name, phone: guest.phone, numPeople: guest.numPeople } : null,
    }
  })

  // POST /api/rsvp/:token/respond
  app.post('/:token/respond', async (req, reply) => {
    const { token } = req.params
    const { guestToken, name, phone, numPeople, rsvpStatus, notes } = req.body || {}
    if (!name || !rsvpStatus) return reply.code(400).send({ error: 'שם וסטטוס נדרשים' })
    const user = await prisma.user.findFirst({ where: { rsvpToken: token } })
    if (!user) return reply.code(404).send({ error: 'לא נמצא' })
    if (guestToken) {
      const existing = await prisma.guest.findFirst({ where: { userId: user.id, guestToken } })
      if (existing) {
        await prisma.guest.update({ where: { id: existing.id }, data: { rsvpStatus, numPeople: parseInt(numPeople)||1, notes: notes||null } })
        return { success: true, updated: true }
      }
    }
    await prisma.guest.create({ data: { userId: user.id, name, phone: phone||null, numPeople: parseInt(numPeople)||1, rsvpStatus, notes: notes||null, guestToken: guestToken||null } })
    return { success: true, created: true }
  })
}
