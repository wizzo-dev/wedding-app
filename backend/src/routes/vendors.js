import { prisma } from '../models/db.js'

export default async function vendorsRoutes(app) {
  // List vendors (optional ?q=search &category=&city=&limit=)
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const { q, category, city, limit = 20 } = req.query
    const where = {}
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
    if (category) where.category = category
    if (city) where.city = city

    const vendors = await prisma.vendor.findMany({
      where,
      take: Number(limit),
      orderBy: { isFeatured: 'desc' }
    })
    return vendors
  })

  // Vendor detail
  app.get('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const id = Number(req.params.id)
    const vendor = await prisma.vendor.findUnique({ where: { id } })
    if (!vendor) return { error: 'NOT_FOUND', message: 'ספק לא נמצא' }
    return vendor
  })

  // My vendors (saved/added by user)
  app.get('/mine/list', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const my = await prisma.userVendor.findMany({
      where: { userId },
      include: { vendor: true }
    })
    return my.map(i => ({
      id: i.id,
      status: i.status,
      priceAgreed: i.priceAgreed,
      notes: i.notes,
      contractUrl: i.contractUrl,
      vendor: i.vendor
    }))
  })

  // Add vendor to my list
  app.post('/:id/save', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const vendorId = Number(req.params.id)
    const exists = await prisma.userVendor.findFirst({ where: { userId, vendorId } })
    if (exists) return reply.code(409).send({ error: 'ALREADY_EXISTS', message: 'הספק כבר ברשימה שלך' })
    const created = await prisma.userVendor.create({ data: { userId, vendorId } })
    return created
  })
}
