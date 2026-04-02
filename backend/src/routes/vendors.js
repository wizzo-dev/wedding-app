import { prisma } from '../models/db.js'

// Sample vendors seed data
const SEED_VENDORS = [
  // קייטרינג
  { category: 'קייטרינג', name: 'טעמים של פעם', phone: '054-1234501', priceRange: '₪80-120 לאדם', city: 'תל אביב', rating: 4.8, description: 'קייטרינג ים תיכוני ממשפחתי, מנות ביתיות ואוירה חמה. ניסיון של 15 שנה.', isFeatured: true },
  { category: 'קייטרינג', name: 'שף יוסי - גסטרו', phone: '054-1234502', priceRange: '₪150-250 לאדם', city: 'הרצליה', rating: 4.9, description: 'מסעדן בוגר לה-קורדון-בלו. מאכלים מייתויים ואסיאתיים. חוויה גסטרונומית בלתי נשכחת.', isFeatured: false },
  { category: 'קייטרינג', name: 'אורנה קייטרינג', phone: '054-1234503', priceRange: '₪60-100 לאדם', city: 'ירושלים', rating: 4.5, description: 'קייטרינג כשר למהדרין. מגוון רחב, שירות אישי ומחיר נוח.', isFeatured: false },
  { category: 'קייטרינג', name: 'פיצ׳ה כייטרינג', phone: '054-1234504', priceRange: '₪90-140 לאדם', city: 'חיפה', rating: 4.6, description: 'התמחות בפיצות ומאפים ארטיזנליים, מותאם לאירועים גדולים.', isFeatured: false },
  { category: 'קייטרינג', name: 'BBQ אמריקן', phone: '054-1234505', priceRange: '₪70-110 לאדם', city: 'פתח תקוה', rating: 4.4, description: 'ספיריבס, המבורגרים ובשר מעושן. אווירה כיפית ואינפורמלית.', isFeatured: false },

  // צילום
  { category: 'צילום', name: 'דניאלה לוי צלמת', phone: '054-2234501', priceRange: '₪6,000-10,000', city: 'תל אביב', rating: 5.0, description: 'צלמת חתונות מובילה עם סגנון בוהו-שיק. 200+ חתונות. אלבום דיגיטלי + ספר.', isFeatured: true },
  { category: 'צילום', name: 'MOMENT צלמים', phone: '054-2234502', priceRange: '₪4,000-7,000', city: 'רמת גן', rating: 4.7, description: 'צמד צלמים מקצועי לצילום ווידאו. חבילות כוללות רייל + ריס.', isFeatured: false },
  { category: 'צילום', name: 'כפיר בן-דוד', phone: '054-2234503', priceRange: '₪3,500-6,000', city: 'באר שבע', rating: 4.6, description: 'צלם חתונות דתיות ומסורתיות. ניסיון של 12 שנה. גלריה עשירה באתר.', isFeatured: false },
  { category: 'צילום', name: 'לייב פרודקשן', phone: '054-2234504', priceRange: '₪8,000-15,000', city: 'תל אביב', rating: 4.9, description: 'צלמי וידאו מקצועיים. ערכי הפקה גבוהים, קלינמטוגרפיה מדהימה.', isFeatured: true },
  { category: 'צילום', name: 'שמחה פוטו', phone: '054-2234505', priceRange: '₪2,500-4,500', city: 'נתניה', rating: 4.3, description: 'צלם מסורתי עם ניסיון רב. חבילה בסיסית עם אלבום מודפס.', isFeatured: false },

  // להקה
  { category: 'להקה', name: 'להקת גן עדן', phone: '054-3234501', priceRange: '₪5,000-9,000', city: 'גבעתיים', rating: 4.9, description: 'להקה עם 6 נגנים ושניים שרים. ריפרטואר מגוון מישראלי לפופ עולמי.', isFeatured: true },
  { category: 'להקה', name: 'DJ מאסטר', phone: '054-3234502', priceRange: '₪3,000-5,000', city: 'תל אביב', rating: 4.8, description: 'DJ מקצועי עם ציוד מהמתקדם בעולם. סאונד מדהים, תאורה צבעונית.', isFeatured: false },
  { category: 'להקה', name: 'ביג בנד ישראל', phone: '054-3234503', priceRange: '₪8,000-14,000', city: 'ירושלים', rating: 4.7, description: 'להקת ג׳אז ובינה בת 12 נגנים. אלגנטי ומרשים. מומלץ לחתונות וינטג׳.', isFeatured: false },
  { category: 'להקה', name: 'קורד - מוזיקה חיה', phone: '054-3234504', priceRange: '₪4,000-7,000', city: 'חיפה', rating: 4.6, description: 'להקת רוק ופופ ישראלי. אנרגיה גבוהה, פייר ולמעלה.', isFeatured: false },
  { category: 'להקה', name: 'מנגינות מזרח', phone: '054-3234505', priceRange: '₪3,500-6,000', city: 'אשדוד', rating: 4.5, description: 'מוזיקה מזרחית ואתנית. כלים מסורתיים. מותאם לחתונות מסורתיות.', isFeatured: false },

  // פרחים
  { category: 'פרחים', name: 'גינת עדן', phone: '054-4234501', priceRange: '₪3,000-8,000', city: 'רמת גן', rating: 4.9, description: 'עיצוב פרחוני מדהים. ורדים, אורכידיאות ופרחי שדה. סגנונות מכל הסוגים.', isFeatured: true },
  { category: 'פרחים', name: 'בלום פלאוור', phone: '054-4234502', priceRange: '₪2,000-5,000', city: 'תל אביב', rating: 4.7, description: 'עיצוב בוהו-שיק ומינימליסטי. ורדים חיוורים ויוקרה קלה.', isFeatured: false },
  { category: 'פרחים', name: 'פרחים של אושר', phone: '054-4234503', priceRange: '₪1,500-4,000', city: 'ירושלים', rating: 4.5, description: 'פרחים טריים ישר מהשוק. עיצוב ידידותי לתקציב.', isFeatured: false },
  { category: 'פרחים', name: 'רויאל פלורל', phone: '054-4234504', priceRange: '₪5,000-12,000', city: 'הרצליה', rating: 5.0, description: 'עיצוב פרמיום עם פרחים נדירים מיובאים. יוקרתי ובלתי נשכח.', isFeatured: true },
  { category: 'פרחים', name: 'טבע יפה', phone: '054-4234505', priceRange: '₪1,200-3,000', city: 'חדרה', rating: 4.3, description: 'פרחי שדה טבעיים ואורגניים. סגנון כפרי ורומנטי.', isFeatured: false },

  // אולם
  { category: 'אולם', name: 'ארמון המלכות', phone: '054-5234501', priceRange: '₪200-350 לאדם', city: 'פתח תקוה', rating: 4.9, description: 'אולם יוקרתי לבין 200-600 אורחים. חניה ענקית, קוקטייל + סלון VIP.', isFeatured: true },
  { category: 'אולם', name: 'גן הוורדים', phone: '054-5234502', priceRange: '₪150-280 לאדם', city: 'ראשון לציון', rating: 4.7, description: 'אולם גן עם מרחב ירוק עצום. אווירה כפרית ורומנטית, 100-400 אורחים.', isFeatured: false },
  { category: 'אולם', name: 'דיוק אבנט', phone: '054-5234503', priceRange: '₪250-400 לאדם', city: 'תל אביב', rating: 4.8, description: 'אולם אורבני מרשים בלב העיר. עיצוב תעשייתי מודרני. 150-500 אורחים.', isFeatured: false },
  { category: 'אולם', name: 'כרם ברק', phone: '054-5234504', priceRange: '₪120-200 לאדם', city: 'כפר ורדים', rating: 4.6, description: 'אולם על רקע נוף צפוני מרהיב. ייחודי ושלוו.', isFeatured: false },
  { category: 'אולם', name: 'הגן הסודי', phone: '054-5234505', priceRange: '₪180-300 לאדם', city: 'נס ציונה', rating: 4.5, description: 'גן ירוק גדול לעד 300 אורחים. בריכה + מרפסת רחבה. שכירות ציוד כלול.', isFeatured: false },
]

async function ensureSeed() {
  const count = await prisma.vendor.count()
  if (count === 0) {
    await prisma.vendor.createMany({ data: SEED_VENDORS })
  }
}

export default async function vendorsRoutes(app) {
  // Seed on first request
  await ensureSeed()

  // GET /api/vendors — list all, optional ?category=
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const { category } = req.query
    const where = category ? { category } : {}
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }]
    })

    // Add userVendor info
    const userId = req.user.userId
    const myVendors = await prisma.userVendor.findMany({
      where: { userId },
      select: { vendorId: true, status: true }
    })
    const myMap = {}
    for (const uv of myVendors) myMap[uv.vendorId] = uv

    return vendors.map(v => ({ ...v, myStatus: myMap[v.id]?.status || null }))
  })

  // GET /api/vendors/categories — list all categories
  app.get('/categories', { preHandler: [app.authenticate] }, async () => {
    const vendors = await prisma.vendor.findMany({ select: { category: true } })
    const cats = [...new Set(vendors.map(v => v.category))]
    return cats
  })

  // GET /api/vendors/mine — my vendors
  app.get('/mine', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const userVendors = await prisma.userVendor.findMany({
      where: { userId },
      include: { vendor: true },
      orderBy: { id: 'desc' }
    })
    return userVendors
  })

  // GET /api/vendors/:id — single vendor
  app.get('/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const vendor = await prisma.vendor.findUnique({ where: { id } })
    if (!vendor) return { statusCode: 404, error: 'ספק לא נמצא' }

    const myVendor = await prisma.userVendor.findFirst({
      where: { userId, vendorId: id }
    })

    return { ...vendor, myVendor: myVendor || null }
  })

  // POST /api/vendors/user — add vendor to my list
  app.post('/user', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const { vendorId, status, priceAgreed, notes } = req.body || {}

    if (!vendorId) return { statusCode: 400, error: 'vendorId חסר' }

    const vendor = await prisma.vendor.findUnique({ where: { id: Number(vendorId) } })
    if (!vendor) return { statusCode: 404, error: 'ספק לא נמצא' }

    const existing = await prisma.userVendor.findFirst({
      where: { userId, vendorId: Number(vendorId) }
    })

    if (existing) {
      const updated = await prisma.userVendor.update({
        where: { id: existing.id },
        data: { status: status || existing.status, priceAgreed: priceAgreed ?? existing.priceAgreed, notes: notes ?? existing.notes }
      })
      return { ...updated, vendor }
    }

    const uv = await prisma.userVendor.create({
      data: { userId, vendorId: Number(vendorId), status: status || 'considering', priceAgreed: priceAgreed ? parseFloat(priceAgreed) : null, notes: notes || null }
    })
    return { ...uv, vendor }
  })

  // PATCH /api/vendors/user/:id — update my vendor
  app.patch('/user/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)
    const { status, priceAgreed, notes } = req.body || {}

    const uv = await prisma.userVendor.findFirst({ where: { id, userId } })
    if (!uv) return { statusCode: 404, error: 'לא נמצא' }

    const updated = await prisma.userVendor.update({
      where: { id },
      data: { status: status ?? uv.status, priceAgreed: priceAgreed !== undefined ? parseFloat(priceAgreed) || null : uv.priceAgreed, notes: notes !== undefined ? notes : uv.notes }
    })
    return updated
  })

  // DELETE /api/vendors/user/:id — remove from my list
  app.delete('/user/:id', { preHandler: [app.authenticate] }, async (req) => {
    const userId = req.user.userId
    const id = parseInt(req.params.id)

    const uv = await prisma.userVendor.findFirst({ where: { id, userId } })
    if (!uv) return { statusCode: 404, error: 'לא נמצא' }

    await prisma.userVendor.delete({ where: { id } })
    return { success: true }
  })
}
