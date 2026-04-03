import { prisma } from '../models/db.js'

const PLANS = [
  {
    id: 'free',
    name: 'חינמי',
    nameEn: 'Free',
    price: 0,
    currency: '₪',
    period: 'לתמיד',
    icon: '🆓',
    color: '#6B7280',
    features: [
      'עד 50 אורחים',
      'ניהול תקציב בסיסי',
      'כרטיסי הושבה',
      'ניהול משימות',
      'גישה לדאשבורד',
    ],
    limitations: [
      'ללא שליחת WhatsApp',
      'ללא ייצוא PDF',
      'ללא ספקים מורחבים',
    ],
    cta: 'תוכנית נוכחית',
    popular: false
  },
  {
    id: 'pro',
    name: 'פרו',
    nameEn: 'Pro',
    price: 79,
    currency: '₪',
    period: 'לחודש',
    icon: '⭐',
    color: '#E91E8C',
    features: [
      'אורחים ללא הגבלה',
      'שליחת WhatsApp',
      'ייצוא כרטיסי הושבה PDF',
      'ניהול ספקים מלא',
      'סטטיסטיקות מתקדמות',
      'תמיכה מועדפת',
    ],
    limitations: [],
    cta: 'שדרג לפרו',
    popular: true
  },
  {
    id: 'premium',
    name: 'פרמיום',
    nameEn: 'Premium',
    price: 149,
    currency: '₪',
    period: 'לחודש',
    icon: '👑',
    color: '#7C3AED',
    features: [
      'כל מה שבפרו +',
      'מנהל חתונה אישי',
      'עיצוב הזמנות מותאם',
      'אינטגרציה עם ספקים',
      'גיבוי ענן מלא',
      'תמיכה 24/7 VIP',
      'ללא מגבלות אחסון',
    ],
    limitations: [],
    cta: 'שדרג לפרמיום',
    popular: false
  }
]

export default async function subscriptionRoutes(app) {
  // GET /api/subscription/plans — return plan comparison data
  app.get('/plans', { preHandler: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { plan: true }
    })
    return {
      plans: PLANS,
      currentPlan: user?.plan || 'free'
    }
  })

  // POST /api/subscription/upgrade — STUB: log + return demo response
  app.post('/upgrade', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { plan, paymentMethod } = req.body

    if (!plan) {
      return reply.code(400).send({ error: 'MISSING_PLAN', message: 'יש לבחור תוכנית' })
    }

    const validPlans = ['pro', 'premium']
    if (!validPlans.includes(plan)) {
      return reply.code(400).send({ error: 'INVALID_PLAN', message: 'תוכנית לא תקינה' })
    }

    // STUB: Log the upgrade request without actually processing payment
    console.log(`[SUBSCRIPTION STUB] User ${req.user.userId} requested upgrade to ${plan}`, {
      userId: req.user.userId,
      plan,
      paymentMethod: paymentMethod || 'unknown',
      timestamp: new Date().toISOString()
    })

    // In demo mode, we don't actually process payment or change the plan
    return {
      success: true,
      message: 'מצב דמו — לא בוצע חיוב',
      demo: true,
      requestedPlan: plan,
      note: 'בגרסה הסופית, כאן יתבצע עיבוד התשלום ועדכון המנוי'
    }
  })
}
