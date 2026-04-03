import { prisma } from '../models/db.js'

// Static card templates — no DB required (phase 1)
const TEMPLATES = [
  {
    id: 1, slug: 'classic-white', name: 'קלאסי לבן', category: 'classic',
    primaryColor: '#1A1F36', accentColor: '#E91E8C', bgColor: '#FFFFFF',
    fontFamily: 'Heebo', description: 'עיצוב נקי ואלגנטי בשחור לבן עם מגע ורוד',
    popular: true, premium: false, layout: 'portrait',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone']
  },
  {
    id: 2, slug: 'romantic-blush', name: 'רומנטי ורוד', category: 'romantic',
    primaryColor: '#E91E8C', accentColor: '#FDE8F4', bgColor: '#FFF5FB',
    fontFamily: 'Heebo', description: 'ורוד מתוק ורומנטי — מושלם לחתונת חלומות',
    popular: true, premium: false, layout: 'portrait',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone']
  },
  {
    id: 3, slug: 'navy-gold', name: 'נייבי וזהב', category: 'luxury',
    primaryColor: '#1A1F36', accentColor: '#D4AF37', bgColor: '#1A1F36',
    fontFamily: 'Heebo', description: 'יוקרה ועושר — כחול כהה עם מגע זהב',
    popular: false, premium: true, layout: 'portrait',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone', 'dresscode']
  },
  {
    id: 4, slug: 'garden-green', name: 'גן ירוק', category: 'nature',
    primaryColor: '#2D6A4F', accentColor: '#95D5B2', bgColor: '#F0FFF4',
    fontFamily: 'Heebo', description: 'טבעי ורענן — כמו חתונה בגינה פורחת',
    popular: false, premium: false, layout: 'landscape',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone']
  },
  {
    id: 5, slug: 'modern-minimal', name: 'מינימליסטי מודרני', category: 'modern',
    primaryColor: '#374151', accentColor: '#9CA3AF', bgColor: '#F9FAFB',
    fontFamily: 'Heebo', description: 'פשוט, נקי, וסטייל — לזוגות שאוהבים מינימליזם',
    popular: true, premium: false, layout: 'portrait',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate']
  },
  {
    id: 6, slug: 'floral-vintage', name: 'פרחוני ווינטג', category: 'vintage',
    primaryColor: '#7C3AED', accentColor: '#DDD6FE', bgColor: '#FDF8FF',
    fontFamily: 'Heebo', description: 'קסום ורומנטי עם פרחים ועיטורים ווינטג',
    popular: false, premium: true, layout: 'portrait',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone', 'dresscode', 'blessings']
  },
  {
    id: 7, slug: 'beach-sunset', name: 'שקיעה בים', category: 'beach',
    primaryColor: '#EA580C', accentColor: '#FED7AA', bgColor: '#FFF7ED',
    fontFamily: 'Heebo', description: 'חום ורוחות ים — לחתונה על החוף',
    popular: false, premium: false, layout: 'landscape',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone']
  },
  {
    id: 8, slug: 'rustic-wood', name: 'כפרי עץ', category: 'rustic',
    primaryColor: '#78350F', accentColor: '#D97706', bgColor: '#FFFBEB',
    fontFamily: 'Heebo', description: 'חמים וכפרי — לחתונה בחווה או בטבע',
    popular: false, premium: false, layout: 'portrait',
    fields: ['coupleName', 'weddingDate', 'venue', 'rsvpDate', 'phone']
  }
]

const CATEGORIES = [
  { id: 'all', name: 'הכל' },
  { id: 'classic', name: 'קלאסי' },
  { id: 'romantic', name: 'רומנטי' },
  { id: 'modern', name: 'מודרני' },
  { id: 'luxury', name: 'יוקרה' },
  { id: 'nature', name: 'טבע' },
  { id: 'vintage', name: 'ווינטג' },
  { id: 'beach', name: 'ים' },
  { id: 'rustic', name: 'כפרי' }
]

export default async function cardsRoutes(app) {

  // GET /api/cards/templates
  app.get('/templates', { preHandler: [app.authenticate] }, async (req) => {
    const { category, popular, premium } = req.query
    let templates = [...TEMPLATES]
    if (category && category !== 'all') templates = templates.filter(t => t.category === category)
    if (popular === 'true') templates = templates.filter(t => t.popular)
    if (premium === 'false') templates = templates.filter(t => !t.premium)
    if (premium === 'true') templates = templates.filter(t => t.premium)
    return { templates, categories: CATEGORIES, total: templates.length }
  })

  // GET /api/cards/templates/:id
  app.get('/templates/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.id)
    const template = TEMPLATES.find(t => t.id === id)
    if (!template) return reply.code(404).send({ error: 'תבנית לא נמצאה' })
    return template
  })

  // GET /api/cards/templates/slug/:slug
  app.get('/templates/slug/:slug', { preHandler: [app.authenticate] }, async (req, reply) => {
    const template = TEMPLATES.find(t => t.slug === req.params.slug)
    if (!template) return reply.code(404).send({ error: 'תבנית לא נמצאה' })
    return template
  })

  // ── GET /api/cards/export — generate export job ───────────────────────────
  // Creates a CardExport record (status: pending → ready)
  // Returns job id + status; client polls GET /api/cards/export/:jobId
  app.get('/export', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId

    // Get user info + guests for export
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name1: true, name2: true, weddingDate: true, venue: true, selectedCardTemplateId: true }
    })
    if (!user) return reply.code(404).send({ error: 'NOT_FOUND' })

    const guests = await prisma.guest.findMany({
      where: { userId },
      select: { id: true, name: true, phone: true, email: true, numPeople: true, rsvpStatus: true, groupName: true }
    })

    const templateId = user.selectedCardTemplateId || 1
    const template   = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0]

    // Find an existing layout or use 1 as dummy
    const layoutId = 1

    // Create CardExport job
    const job = await prisma.cardExport.create({
      data: { userId, layoutId, templateId: template.id, status: 'pending' }
    })

    // Simulate async processing: update to 'ready' immediately in background
    setImmediate(async () => {
      try {
        await prisma.cardExport.update({
          where: { id: job.id },
          data: { status: 'ready', pdfUrl: `/api/cards/export/${job.id}/download` }
        })
      } catch {}
    })

    return {
      jobId:       job.id,
      status:      'pending',
      guestCount:  guests.length,
      template:    { id: template.id, name: template.name, slug: template.slug },
      couple:      { name1: user.name1, name2: user.name2, weddingDate: user.weddingDate, venue: user.venue },
      guests:      guests,
      pollUrl:     `/api/cards/export/${job.id}`
    }
  })

  // ── GET /api/cards/export/:jobId — poll export job status ────────────────
  app.get('/export/:jobId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const jobId  = parseInt(req.params.jobId, 10)
    if (isNaN(jobId)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const job = await prisma.cardExport.findFirst({
      where: { id: jobId, userId }
    })
    if (!job) return reply.code(404).send({ error: 'NOT_FOUND', message: 'משימת ייצוא לא נמצאה' })

    return {
      jobId:   job.id,
      status:  job.status,
      pdfUrl:  job.pdfUrl,
      downloadUrl: job.status === 'ready' ? job.pdfUrl : null
    }
  })

  // ── GET /api/cards/export/:jobId/download — download exported data ────────
  app.get('/export/:jobId/download', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const jobId  = parseInt(req.params.jobId, 10)
    if (isNaN(jobId)) return reply.code(400).send({ error: 'VALIDATION', message: 'מזהה לא תקין' })

    const job = await prisma.cardExport.findFirst({ where: { id: jobId, userId } })
    if (!job || job.status !== 'ready') return reply.code(404).send({ error: 'NOT_FOUND', message: 'הקובץ אינו מוכן' })

    // In a real system this would serve a ZIP/PDF file
    // Here we return JSON with all guests for client-side rendering
    const guests = await prisma.guest.findMany({
      where: { userId },
      select: { id: true, name: true, phone: true, rsvpStatus: true, numPeople: true }
    })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name1: true, name2: true, weddingDate: true, venue: true }
    })

    reply.header('Content-Disposition', `attachment; filename="invitations-${jobId}.json"`)
    reply.header('Content-Type', 'application/json')
    return { jobId, couple: user, guests, exportedAt: new Date().toISOString() }
  })
}
