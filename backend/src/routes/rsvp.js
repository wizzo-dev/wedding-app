import { prisma } from '../models/db.js'

export default async function rsvpRoutes(app) {

  // ── GET /api/rsvp/groups — list groups with their numeric link IDs ────────
  app.get('/groups', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const groups = await prisma.guest.groupBy({
      by: ['groupName'],
      where: { userId, groupName: { not: null } }
    })
    const groupNames = groups.map(g => g.groupName).filter(Boolean)

    // Ensure each group has a GroupLink record, create if missing
    const result = []
    for (const name of groupNames) {
      const link = await prisma.groupLink.upsert({
        where: { userId_groupName: { userId, groupName: name } },
        create: { userId, groupName: name },
        update: {}
      })
      result.push({ name, linkId: link.id })
    }
    return result
  })

  // ── POST /api/rsvp/group-link — create or get a group link ───────────────
  app.post('/group-link', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { groupName } = req.body
    if (!groupName) return reply.code(400).send({ error: 'VALIDATION', message: 'groupName נדרש' })
    const link = await prisma.groupLink.upsert({
      where: { userId_groupName: { userId, groupName } },
      create: { userId, groupName },
      update: {}
    })
    return { id: link.id, groupName: link.groupName }
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

    let groupContext = null

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

      // Third try: numeric group link ID
      if (!user && /^\d+$/.test(code)) {
        const groupLink = await prisma.groupLink.findUnique({
          where: { id: parseInt(code) },
          include: { user: true }
        })
        if (groupLink) {
          user = groupLink.user
          groupContext = groupLink.groupName
        }
      }
    }

    if (!user) return reply.code(404).send({ error: 'NOT_FOUND', message: 'לינק לא תקין' })

    // Get latest invitation with template
    const latestInv = await prisma.userInvitation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { template: true }
    })

    return {
      couple: {
        name1:           user.name1,
        name2:           user.name2,
        weddingDate:     user.weddingDate,
        weddingTime:     user.weddingTime,
        venue:           user.venue,
        venueAddress:    user.venueAddress,
        couplePhoto:     user.profileImageUrl,
        coupleToken:     user.rsvpToken,        // needed for submit from group/general link
        invitationId:    latestInv?.id || null,
        rsvpGreeting:    user.rsvpGreeting || null,
        rsvpBgColor:     user.rsvpBgColor || null,
        rsvpBgImage:     user.rsvpBgImage || null,
        rsvpAccentColor: user.rsvpAccentColor || null
      },
      prefilledGuest,
      groupContext,   // group name for group links, null otherwise
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
