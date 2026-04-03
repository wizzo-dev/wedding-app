import { prisma } from '../models/db.js'

export default async function rsvpRoutes(app) {

  // ── GET /api/rsvp/groups — list groups for the logged-in user ────────────
  app.get('/groups', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const groups = await prisma.guest.groupBy({
      by: ['groupName'],
      where: { userId, groupName: { not: null } }
    })
    return groups.map(g => g.groupName).filter(Boolean)
  })

  // ── GET /api/rsvp/:code ─────────────────────────────────────────────────
  // Accepts either a couple's rsvpToken or a guest's guestToken
  app.get('/:code', async (req, reply) => {
    const { code } = req.params

    // First try: guestToken (personal RSVP code)
    const guestRecord = await prisma.guest.findFirst({
      where: { guestToken: code },
      include: { user: true }
    })

    let user = null
    let prefilledGuest = null

    if (guestRecord) {
      user = guestRecord.user
      prefilledGuest = {
        id:          guestRecord.id,
        name:        guestRecord.name,
        phone:       guestRecord.phone,
        groupName:   guestRecord.groupName,
        numPeople:   guestRecord.numPeople,
        rsvpStatus:  guestRecord.rsvpStatus,
        mealPref:    guestRecord.mealPref,
        rsvpMessage: guestRecord.rsvpMessage
      }
    } else {
      // Second try: rsvpToken (couple's public link)
      user = await prisma.user.findUnique({ where: { rsvpToken: code } })
    }

    if (!user) return reply.code(404).send({ error: 'NOT_FOUND', message: 'קוד RSVP לא נמצא' })

    // Get latest invitation with template
    const latestInv = await prisma.userInvitation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { template: true }
    })

    return {
      couple: {
        name1:        user.name1,
        name2:        user.name2,
        weddingDate:  user.weddingDate,
        weddingTime:  user.weddingTime,
        venue:        user.venue,
        venueAddress: user.venueAddress,
        couplePhoto:  user.profileImageUrl,
        invitationId: latestInv?.id || null  // kept for backward compat
      },
      prefilledGuest,
      invitation: latestInv ? {
        id:               latestInv.id,
        templateImageUrl: latestInv.template.imageUrl,
        fields:           JSON.parse(latestInv.fields || '{}')
      } : null
    }
  })

  // ── POST /api/rsvp/submit ───────────────────────────────────────────────
  app.post('/submit', {
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } }
  }, async (req, reply) => {
    const {
      code,
      name,
      phone,
      rsvpStatus = 'confirmed',
      mealPref,
      numPeople = 1,
      message,
      coupleToken
    } = req.body || {}

    if (!['confirmed', 'declined', 'maybe', 'pending'].includes(rsvpStatus)) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'סטטוס RSVP לא תקין' })
    }

    let updatedGuest

    // Case 1: personal RSVP code (guestToken)
    if (code) {
      const existing = await prisma.guest.findFirst({
        where: { guestToken: code }
      })
      if (!existing) {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'קוד RSVP לא נמצא' })
      }
      updatedGuest = await prisma.guest.update({
        where: { id: existing.id },
        data: {
          rsvpStatus,
          ...(mealPref   !== undefined && { mealPref }),
          ...(numPeople  !== undefined && { numPeople: parseInt(numPeople) }),
          ...(message    !== undefined && { rsvpMessage: message })
        },
        select: {
          id: true, name: true, rsvpStatus: true, numPeople: true, mealPref: true,
          user: { select: { name1: true, name2: true, weddingDate: true, venue: true } }
        }
      })
      return { success: true, guest: updatedGuest, couple: updatedGuest.user }
    }

    // Case 2: look up by name + phone
    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'שם נדרש' })
    }

    let hostUser = null
    if (coupleToken) {
      hostUser = await prisma.user.findUnique({ where: { rsvpToken: coupleToken } })
    }

    const nameClean  = name.trim()
    const phoneClean = phone?.trim() || null

    if (hostUser) {
      const existing = await prisma.guest.findFirst({
        where: {
          userId: hostUser.id,
          OR: [
            { name: { equals: nameClean } },
            ...(phoneClean ? [{ phone: { equals: phoneClean } }] : [])
          ]
        }
      })

      if (existing) {
        updatedGuest = await prisma.guest.update({
          where: { id: existing.id },
          data: {
            rsvpStatus,
            ...(mealPref  !== undefined && { mealPref }),
            ...(numPeople !== undefined && { numPeople: parseInt(numPeople) }),
            ...(message   !== undefined && { rsvpMessage: message }),
            ...(phoneClean && { phone: phoneClean })
          },
          select: {
            id: true, name: true, rsvpStatus: true, numPeople: true, mealPref: true,
            user: { select: { name1: true, name2: true, weddingDate: true, venue: true } }
          }
        })
      } else {
        // New walk-in guest
        const { randomBytes } = await import('crypto')
        updatedGuest = await prisma.guest.create({
          data: {
            userId: hostUser.id,
            name: nameClean,
            phone: phoneClean,
            rsvpStatus,
            mealPref:    mealPref || null,
            numPeople:   parseInt(numPeople) || 1,
            rsvpMessage: message || null,
            guestToken:  randomBytes(4).toString('hex')
          },
          select: {
            id: true, name: true, rsvpStatus: true, numPeople: true, mealPref: true,
            user: { select: { name1: true, name2: true, weddingDate: true, venue: true } }
          }
        })
      }

      return { success: true, guest: updatedGuest, couple: updatedGuest.user }
    }

    return reply.code(400).send({
      error: 'MISSING_CONTEXT',
      message: 'נא לספק קוד RSVP של הזוג'
    })
  })
}
