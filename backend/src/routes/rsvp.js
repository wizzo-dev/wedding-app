import { prisma } from '../models/db.js'

export default async function rsvpRoutes(app) {
  // ── GET /api/rsvp/:code ─────────────────────────────────────────────────
  // Accepts guestToken (personal code) or user rsvpToken (couple's public link)
  app.get('/:code', async (req, reply) => {
    const { code } = req.params

    // First try: guestToken
    const guest = await prisma.guest.findFirst({
      where: { guestToken: code },
      select: {
        id: true, name: true, phone: true, numPeople: true,
        rsvpStatus: true, mealPref: true, rsvpMessage: true,
        user: { select: { name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true } }
      }
    })
    if (guest) {
      return {
        type: 'guest', couple: guest.user,
        guest: { id: guest.id, name: guest.name, phone: guest.phone, numPeople: guest.numPeople, rsvpStatus: guest.rsvpStatus, mealPref: guest.mealPref, rsvpMessage: guest.rsvpMessage }
      }
    }

    // Second try: rsvpToken (couple's public link)
    const user = await prisma.user.findUnique({
      where: { rsvpToken: code },
      select: { name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true }
    })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קוד RSVP לא נמצא' })
    return { type: 'couple', couple: user, guest: null }
  })

  // ── POST /api/rsvp/submit ───────────────────────────────────────────────
  app.post('/submit', {
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } }
  }, async (req, reply) => {
    const { code, name, phone, rsvpStatus = 'confirmed', mealPref, numPeople = 1, message, coupleToken } = req.body || {}

    if (!['confirmed', 'declined', 'maybe', 'pending'].includes(rsvpStatus)) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סטטוס RSVP לא תקין' })
    }

    // Case 1: personal RSVP code
    if (code) {
      const existing = await prisma.guest.findFirst({ where: { guestToken: code } })
      if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קוד RSVP לא נמצא' })
      const updatedGuest = await prisma.guest.update({
        where: { id: existing.id },
        data: {
          rsvpStatus,
          ...(mealPref  !== undefined && { mealPref }),
          ...(numPeople !== undefined && { numPeople: parseInt(numPeople) }),
          ...(message   !== undefined && { rsvpMessage: message })
        },
        select: {
          id: true, name: true, rsvpStatus: true, numPeople: true, mealPref: true,
          user: { select: { name1: true, name2: true, weddingDate: true, venue: true } }
        }
      })
      return { success: true, guest: updatedGuest, couple: updatedGuest.user }
    }

    // Case 2: name + phone + coupleToken
    if (!name?.trim()) return reply.code(400).send({ error: 'VALIDATION', message: 'שם נדרש' })

    let user = null
    if (coupleToken) user = await prisma.user.findUnique({ where: { rsvpToken: coupleToken } })

    const nameClean  = name.trim()
    const phoneClean = phone?.trim() || null

    if (user) {
      const existing = await prisma.guest.findFirst({
        where: {
          userId: user.id,
          OR: [{ name: { equals: nameClean } }, ...(phoneClean ? [{ phone: { equals: phoneClean } }] : [])]
        }
      })
      let updatedGuest
      if (existing) {
        updatedGuest = await prisma.guest.update({
          where: { id: existing.id },
          data: { rsvpStatus, ...(mealPref !== undefined && { mealPref }), ...(numPeople !== undefined && { numPeople: parseInt(numPeople) }), ...(message !== undefined && { rsvpMessage: message }), ...(phoneClean && { phone: phoneClean }) },
          select: { id: true, name: true, rsvpStatus: true, numPeople: true, mealPref: true, user: { select: { name1: true, name2: true, weddingDate: true, venue: true } } }
        })
      } else {
        updatedGuest = await prisma.guest.create({
          data: { userId: user.id, name: nameClean, phone: phoneClean, rsvpStatus, mealPref: mealPref || null, numPeople: parseInt(numPeople) || 1, rsvpMessage: message || null },
          select: { id: true, name: true, rsvpStatus: true, numPeople: true, mealPref: true, user: { select: { name1: true, name2: true, weddingDate: true, venue: true } } }
        })
      }
      return { success: true, guest: updatedGuest, couple: updatedGuest.user }
    }

    return reply.code(400).send({ error: 'MISSING_CONTEXT', message: 'נא לספק קוד RSVP של הזוג' })
  })
}
