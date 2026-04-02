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

  // GET /api/cards/selected
  app.get('/selected', { preHandler: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { selectedCardTemplateId: true }
    })
    return { templateId: user?.selectedCardTemplateId || null }
  })

  // PUT /api/cards/selected
  app.put('/selected', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { templateId } = req.body
    if (!templateId) return reply.code(400).send({ error: 'templateId נדרש' })
    const template = TEMPLATES.find(t => t.id === parseInt(templateId))
    if (!template) return reply.code(404).send({ error: 'תבנית לא נמצאה' })
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { selectedCardTemplateId: parseInt(templateId) }
    })
    return { success: true, templateId: parseInt(templateId), templateName: template.name }
  })

  // GET /api/cards/preview/:templateId — template + user settings merged
  app.get('/preview/:templateId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = parseInt(req.params.templateId)
    const template = TEMPLATES.find(t => t.id === id)
    if (!template) return reply.code(404).send({ error: 'תבנית לא נמצאה' })

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true, rsvpToken: true }
    })

    return {
      template,
      settings: {
        name1: user?.name1 || '',
        name2: user?.name2 || '',
        weddingDate: user?.weddingDate || null,
        venue: user?.venue || '',
        venueAddress: user?.venueAddress || '',
        rsvpToken: user?.rsvpToken || ''
      }
    }
  })

  // PUT /api/cards/settings — save card settings (updates user profile)
  app.put('/settings', { preHandler: [app.authenticate] }, async (req) => {
    const { name1, name2, weddingDate, venue, venueAddress, phone } = req.body
    const data = {}
    if (name1 !== undefined) data.name1 = name1
    if (name2 !== undefined) data.name2 = name2
    if (weddingDate !== undefined) data.weddingDate = weddingDate ? new Date(weddingDate) : null
    if (venue !== undefined) data.venue = venue
    if (venueAddress !== undefined) data.venueAddress = venueAddress

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { name1: true, name2: true, weddingDate: true, venue: true, venueAddress: true, rsvpToken: true }
    })
    return { success: true, settings: updated }
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
}
