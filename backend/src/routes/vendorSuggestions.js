import { prisma } from '../models/db.js'

// Static vendor suggestions — no DB model needed

const VENDOR_SUGGESTIONS = [
  {
    id: 1,
    name: 'צלם חתונות',
    nameEn: 'Photographer',
    description: 'צלם מקצועי שיתעד את כל רגעי היום המיוחד שלכם בצורה האידיאלית',
    icon: '📸',
    tags: ['צילום', 'וידאו'],
    priceMin: 3000,
    priceMax: 12000,
    currency: '₪',
    category: 'צילום',
    tip: 'בדקו עבודות קודמות ובקשו המלצות לפני ההזמנה'
  },
  {
    id: 2,
    name: 'וידאוגרף',
    nameEn: 'Videographer',
    description: 'הפקת סרטון חתונה מרגש שישמור את הזיכרונות לדורות',
    icon: '🎬',
    tags: ['צילום', 'וידאו'],
    priceMin: 2500,
    priceMax: 10000,
    currency: '₪',
    category: 'צילום',
    tip: 'בקשו סרטון טיזר בנוסף לסרטון המלא'
  },
  {
    id: 3,
    name: 'קייטרינג',
    nameEn: 'Catering',
    description: 'שירותי קייטרינג מקצועיים עם תפריטים מגוונים ומתאימים לכל טעם',
    icon: '🍽️',
    tags: ['אוכל', 'שתייה'],
    priceMin: 150,
    priceMax: 400,
    currency: '₪ לאורח',
    category: 'אוכל',
    tip: 'בקשו טעימה מקדימה לפני חתימת החוזה'
  },
  {
    id: 4,
    name: 'עוגת חתונה',
    nameEn: 'Wedding Cake',
    description: 'עוגת חתונה עוצרת נשימה שמשלבת יופי אסתטי עם טעם מצוין',
    icon: '🎂',
    tags: ['אוכל', 'ממתקים'],
    priceMin: 800,
    priceMax: 5000,
    currency: '₪',
    category: 'אוכל',
    tip: 'הזמינו לפחות 3 חודשים מראש לעיצובים מורכבים'
  },
  {
    id: 5,
    name: 'DJ ומוזיקאי',
    nameEn: 'DJ & Music',
    description: 'DJ מקצועי שיפעיל את הריקודים וייצור אווירה בלתי נשכחת',
    icon: '🎵',
    tags: ['מוזיקה', 'בידור'],
    priceMin: 2000,
    priceMax: 8000,
    currency: '₪',
    category: 'מוזיקה',
    tip: 'שמעו את הDJ בפעולה באירוע אחר לפני ההזמנה'
  },
  {
    id: 6,
    name: 'להקה חיה',
    nameEn: 'Live Band',
    description: 'להקה חיה שתהפוך את הערב לבלתי נשכח עם מוזיקה מגוונת ואנרגטית',
    icon: '🎸',
    tags: ['מוזיקה', 'בידור'],
    priceMin: 5000,
    priceMax: 20000,
    currency: '₪',
    category: 'מוזיקה',
    tip: 'ודאו שיש להם ניסיון בחתונות ספציפית'
  },
  {
    id: 7,
    name: 'פרחים ועיצוב',
    nameEn: 'Florist & Decor',
    description: 'עיצוב פרחוני מרהיב שיהפוך את האולם ליצירת אמנות',
    icon: '💐',
    tags: ['עיצוב', 'פרחים'],
    priceMin: 3000,
    priceMax: 20000,
    currency: '₪',
    category: 'עיצוב',
    tip: 'הביאו תמונות השראה לפגישה עם הפרחן'
  },
  {
    id: 8,
    name: 'אולם אירועים',
    nameEn: 'Venue',
    description: 'אולם אירועים מפואר המותאם לגודל ולסגנון החתונה שלכם',
    icon: '🏛️',
    tags: ['אולם', 'מקום'],
    priceMin: 15000,
    priceMax: 80000,
    currency: '₪',
    category: 'אולם',
    tip: 'בדקו זמינות תאריכים לפחות שנה מראש'
  },
  {
    id: 9,
    name: 'איפור ושיער',
    nameEn: 'Makeup & Hair',
    description: 'אמן/ית איפור מקצועי שיהפוך אתכם לתמונה מושלמת ביום החתונה',
    icon: '💄',
    tags: ['יופי', 'איפור'],
    priceMin: 800,
    priceMax: 4000,
    currency: '₪',
    category: 'יופי',
    tip: 'עשו ניסיון איפור לפני יום החתונה'
  },
  {
    id: 10,
    name: 'רב טקסים',
    nameEn: 'Officiant',
    description: 'רב טקסים מנוסה שיעניק לטקס הנישואין שלכם משמעות ורגש',
    icon: '🕊️',
    tags: ['טקס', 'דת'],
    priceMin: 1500,
    priceMax: 5000,
    currency: '₪',
    category: 'טקס',
    tip: 'פגשו את הרב מספר פגישות לפני האירוע'
  },
  {
    id: 11,
    name: 'לימוזינה והסעות',
    nameEn: 'Transportation',
    description: 'הסעות VIP לחתן, כלה ואורחים עם רכבים מפוארים ושירות מעולה',
    icon: '🚗',
    tags: ['הסעות', 'רכבים'],
    priceMin: 500,
    priceMax: 5000,
    currency: '₪',
    category: 'הסעות',
    tip: 'הזמינו הסעות לאורחים מבוגרים בנפרד'
  },
  {
    id: 12,
    name: 'מנחה ואיש מצוין',
    nameEn: 'Master of Ceremonies',
    description: 'מנחה כריזמטי שינהל את האירוע בשמחה, בהומור ובמקצועיות',
    icon: '🎤',
    tags: ['בידור', 'ניהול'],
    priceMin: 2000,
    priceMax: 8000,
    currency: '₪',
    category: 'בידור',
    tip: 'צפו בהופעות קודמות שלהם ביוטיוב'
  },
  {
    id: 13,
    name: 'שמלת כלה',
    nameEn: 'Wedding Dress',
    description: 'שמלת חלומות מותאמת אישית ממעצבים מובילים בישראל',
    icon: '👗',
    tags: ['אופנה', 'שמלה'],
    priceMin: 3000,
    priceMax: 25000,
    currency: '₪',
    category: 'אופנה',
    tip: 'התחילו חיפוש שמלה לפחות 8 חודשים מראש'
  },
  {
    id: 14,
    name: 'עיצוב הזמנות',
    nameEn: 'Invitations',
    description: 'הזמנות לחתונה בעיצוב ייחודי שיתאים לסגנון האירוע שלכם',
    icon: '💌',
    tags: ['הזמנות', 'עיצוב'],
    priceMin: 200,
    priceMax: 2000,
    currency: '₪',
    category: 'עיצוב',
    tip: 'הזמינו 10% יותר הזמנות ממספר האורחים'
  },
  {
    id: 15,
    name: 'גן ארועים',
    nameEn: 'Garden Venue',
    description: 'גן אירועים רומנטי עם ירק ופרחי טבע לחתונה אינטימית ומרגשת',
    icon: '🌿',
    tags: ['אולם', 'גן', 'מקום'],
    priceMin: 10000,
    priceMax: 50000,
    currency: '₪',
    category: 'אולם',
    tip: 'בדקו תוכנית גיבוי למזג אוויר גשום'
  }
]

export default async function vendorSuggestionsRoutes(app) {
  // GET /api/vendors/suggestions — returns static list of vendor categories
  app.get('/suggestions', { preHandler: [app.authenticate] }, async (req) => {
    const { category, search } = req.query
    let results = [...VENDOR_SUGGESTIONS]

    if (category && category !== 'all') {
      results = results.filter(v => v.category === category || v.tags.includes(category))
    }

    if (search) {
      const q = search.toLowerCase()
      results = results.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    const categories = [...new Set(VENDOR_SUGGESTIONS.map(v => v.category))]

    return { suggestions: results, categories, total: results.length }
  })

  // POST /api/vendors/suggestions/add — add freeform vendor suggestion to user's vendor list
  // Accepts {category, name, notes} without requiring an existing DB vendor FK
  app.post('/suggestions/add', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.userId
    const { category, name, notes } = req.body || {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return reply.code(400).send({ error: 'שם הספק חסר' })
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return reply.code(400).send({ error: 'קטגוריה חסרה' })
    }

    // Create vendor and link to user atomically — prevents orphan Vendor rows
    const { vendor, userVendor } = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          category: category.trim(),
          name: name.trim(),
          description: notes ? notes.trim() : null,
        }
      })

      const userVendor = await tx.userVendor.create({
        data: {
          userId,
          vendorId: vendor.id,
          status: 'considering',
          notes: notes ? notes.trim() : null,
        }
      })

      return { vendor, userVendor }
    })

    return reply.code(201).send({ success: true, userVendor, vendor })
  })
}
