import { prisma } from '../models/db.js'

const SYSTEM_TEMPLATES = [
  // --- הזמנה ---
  {
    name: 'הזמנה — רשמי',
    style: 'formal',
    category: 'invite',
    body: `שלום {{name}},\n\nאנו מתכבדים להזמינך לחתונתנו של {{name1}} ו{{name2}}.\nהאירוע יתקיים ב-{{date}} בשעה {{time}}, ב{{venue}}.\n\nנשמח מאוד לנוכחותך.\nלאישור הגעה: {{rsvp_link}}`,
    emoji: '💌'
  },
  {
    name: 'הזמנה — קליל',
    style: 'casual',
    category: 'invite',
    body: `היי {{name}}! 🎉\n\n{{name1}} ו{{name2}} מתחתנים!\nמתי? {{date}} בשעה {{time}}\nאיפה? {{venue}}\n\nבאים? לחצו כאן: {{rsvp_link}} 💃`,
    emoji: '🎊'
  },
  {
    name: 'הזמנה — אישי',
    style: 'personal',
    category: 'invite',
    body: `{{name}} יקר/ה,\n\nאנחנו כל כך שמחים לשתף אותך ביום המיוחד שלנו! 💕\n{{name1}} ו{{name2}} מתחתנים ב-{{date}} ב{{venue}}.\n\nחיכינו לרגע הזה ואין לנו ספק שרוצים אותך שם 🥂\nאישור הגעה: {{rsvp_link}}`,
    emoji: '❤️'
  },
  // --- תזכורת RSVP ---
  {
    name: 'תזכורת RSVP — רשמי',
    style: 'formal',
    category: 'rsvp_reminder',
    body: `שלום {{name}},\n\nטרם קיבלנו את אישורך להגעה לחתונת {{name1}} ו{{name2}} ב-{{date}}.\nנשמח לתגובתך: {{rsvp_link}}\n\nתודה רבה.`,
    emoji: '📋'
  },
  {
    name: 'תזכורת RSVP — קליל',
    style: 'casual',
    category: 'rsvp_reminder',
    body: `היי {{name}} 😊\n\nעוד לא שמענו ממך לגבי החתונה של {{name1}} ו{{name2}}!\nשניה לאשר? {{rsvp_link}}\n\nממתינים לך! 🎈`,
    emoji: '⏰'
  },
  {
    name: 'תזכורת RSVP — אישי',
    style: 'personal',
    category: 'rsvp_reminder',
    body: `{{name}} שלום 💛\n\nרק רצינו לוודא שקיבלת את ההזמנה לחתונה שלנו ב-{{date}}.\nנשמח לדעת אם תוכל/י להגיע: {{rsvp_link}}\n\nאנחנו אוהבים אותך! {{name1}} ו{{name2}}`,
    emoji: '🌸'
  },
  // --- תזכורת יום לפני ---
  {
    name: 'תזכורת — מחר — רשמי',
    style: 'formal',
    category: 'reminder',
    body: `שלום {{name}},\n\nתזכורת — מחר, {{date}}, מתקיימת חתונת {{name1}} ו{{name2}}.\nשעת התחלה: {{time}} | מיקום: {{venue}}\n\nנתראה מחר!`,
    emoji: '📅'
  },
  {
    name: 'תזכורת — מחר — קליל',
    style: 'casual',
    category: 'reminder',
    body: `מחר זה היום! 🎉🥂\n\n{{name}}, מחכים לך בחתונה של {{name1}} ו{{name2}}!\n🕐 {{time}} | 📍 {{venue}}\n\nנתראה מחר! 💃🕺`,
    emoji: '🎊'
  },
  {
    name: 'תזכורת — מחר — אישי',
    style: 'personal',
    category: 'reminder',
    body: `{{name}} יקר/ה 💕\n\nמחר אנחנו מתחתנים!!! ממש לא יכולים להאמין שהגיע היום 🥹\nנתראה ב-{{time}} ב{{venue}}.\n\nתודה שאתם חלק מהיום הכי מיוחד שלנו ❤️\n{{name1}} ו{{name2}}`,
    emoji: '💍'
  }
]

const existing = await prisma.waTemplate.findFirst({ where: { isSystem: true } }).catch(() => null)
if (!existing) {
  for (const t of SYSTEM_TEMPLATES) {
    await prisma.waTemplate.create({ data: { ...t, userId: null, isSystem: true } })
  }
  console.log(`Seeded ${SYSTEM_TEMPLATES.length} system templates`)
} else {
  console.log('System templates already exist')
}
await prisma.$disconnect()
