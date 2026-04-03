import { prisma } from '../models/db.js'

const templates = [
  {
    name: 'קלאסי לבן',
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80',
    textZones: JSON.stringify([
      { field: 'blessing',   label: 'ברכה',       x: 0.5, y: 0.08, fontSize: 18, color: '#B8860B', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
      { field: 'groomName',  label: 'שם החתן',     x: 0.5, y: 0.32, fontSize: 36, color: '#2C2C2C', fontFamily: 'Heebo', align: 'center', maxWidth: 0.6 },
      { field: 'andSign',    label: '&',            x: 0.5, y: 0.44, fontSize: 28, color: '#B8860B', fontFamily: 'Heebo', align: 'center', maxWidth: 0.2 },
      { field: 'brideName',  label: 'שם הכלה',     x: 0.5, y: 0.54, fontSize: 36, color: '#2C2C2C', fontFamily: 'Heebo', align: 'center', maxWidth: 0.6 },
      { field: 'date',       label: 'תאריך',        x: 0.5, y: 0.70, fontSize: 20, color: '#555555', fontFamily: 'Heebo', align: 'center', maxWidth: 0.5 },
      { field: 'time',       label: 'שעה',          x: 0.5, y: 0.76, fontSize: 18, color: '#555555', fontFamily: 'Heebo', align: 'center', maxWidth: 0.4 },
      { field: 'venue',      label: 'מקום',         x: 0.5, y: 0.83, fontSize: 20, color: '#444444', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'address',    label: 'כתובת',        x: 0.5, y: 0.88, fontSize: 16, color: '#666666', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'extraText',  label: 'טקסט נוסף',   x: 0.5, y: 0.95, fontSize: 14, color: '#888888', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
    ]),
    isSystem: true,
  },
  {
    name: 'נייבי רומנטי',
    imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80',
    textZones: JSON.stringify([
      { field: 'blessing',   label: 'ברכה',       x: 0.5, y: 0.07, fontSize: 16, color: '#F5D98B', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
      { field: 'groomName',  label: 'שם החתן',     x: 0.5, y: 0.30, fontSize: 38, color: '#FFFFFF', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'andSign',    label: '&',            x: 0.5, y: 0.43, fontSize: 30, color: '#F5D98B', fontFamily: 'Heebo', align: 'center', maxWidth: 0.2 },
      { field: 'brideName',  label: 'שם הכלה',     x: 0.5, y: 0.54, fontSize: 38, color: '#FFFFFF', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'date',       label: 'תאריך',        x: 0.5, y: 0.70, fontSize: 20, color: '#F5D98B', fontFamily: 'Heebo', align: 'center', maxWidth: 0.5 },
      { field: 'time',       label: 'שעה',          x: 0.5, y: 0.77, fontSize: 18, color: '#EEEEEE', fontFamily: 'Heebo', align: 'center', maxWidth: 0.4 },
      { field: 'venue',      label: 'מקום',         x: 0.5, y: 0.84, fontSize: 20, color: '#FFFFFF', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'address',    label: 'כתובת',        x: 0.5, y: 0.90, fontSize: 15, color: '#DDDDDD', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'extraText',  label: 'טקסט נוסף',   x: 0.5, y: 0.96, fontSize: 13, color: '#CCCCCC', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
    ]),
    isSystem: true,
  },
  {
    name: 'פרחוני עדין',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1200&q=80',
    textZones: JSON.stringify([
      { field: 'blessing',   label: 'ברכה',       x: 0.5, y: 0.10, fontSize: 16, color: '#8B4513', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'groomName',  label: 'שם החתן',     x: 0.5, y: 0.33, fontSize: 34, color: '#5C2E00', fontFamily: 'Heebo', align: 'center', maxWidth: 0.6 },
      { field: 'andSign',    label: '&',            x: 0.5, y: 0.46, fontSize: 26, color: '#C0806B', fontFamily: 'Heebo', align: 'center', maxWidth: 0.2 },
      { field: 'brideName',  label: 'שם הכלה',     x: 0.5, y: 0.57, fontSize: 34, color: '#5C2E00', fontFamily: 'Heebo', align: 'center', maxWidth: 0.6 },
      { field: 'date',       label: 'תאריך',        x: 0.5, y: 0.72, fontSize: 19, color: '#6B3A2A', fontFamily: 'Heebo', align: 'center', maxWidth: 0.5 },
      { field: 'time',       label: 'שעה',          x: 0.5, y: 0.78, fontSize: 17, color: '#7A4030', fontFamily: 'Heebo', align: 'center', maxWidth: 0.4 },
      { field: 'venue',      label: 'מקום',         x: 0.5, y: 0.85, fontSize: 19, color: '#5C2E00', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'address',    label: 'כתובת',        x: 0.5, y: 0.91, fontSize: 15, color: '#7A4030', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'extraText',  label: 'טקסט נוסף',   x: 0.5, y: 0.96, fontSize: 13, color: '#8B5E52', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
    ]),
    isSystem: true,
  },
  {
    name: 'מינימל מודרני',
    imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80',
    textZones: JSON.stringify([
      { field: 'blessing',   label: 'ברכה',       x: 0.5, y: 0.06, fontSize: 15, color: '#E91E8C', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
      { field: 'groomName',  label: 'שם החתן',     x: 0.5, y: 0.28, fontSize: 40, color: '#1A1F36', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'andSign',    label: '&',            x: 0.5, y: 0.42, fontSize: 32, color: '#E91E8C', fontFamily: 'Heebo', align: 'center', maxWidth: 0.2 },
      { field: 'brideName',  label: 'שם הכלה',     x: 0.5, y: 0.54, fontSize: 40, color: '#1A1F36', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'date',       label: 'תאריך',        x: 0.5, y: 0.70, fontSize: 20, color: '#333333', fontFamily: 'Heebo', align: 'center', maxWidth: 0.5 },
      { field: 'time',       label: 'שעה',          x: 0.5, y: 0.76, fontSize: 18, color: '#555555', fontFamily: 'Heebo', align: 'center', maxWidth: 0.4 },
      { field: 'venue',      label: 'מקום',         x: 0.5, y: 0.83, fontSize: 20, color: '#333333', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'address',    label: 'כתובת',        x: 0.5, y: 0.89, fontSize: 16, color: '#666666', fontFamily: 'Heebo', align: 'center', maxWidth: 0.7 },
      { field: 'extraText',  label: 'טקסט נוסף',   x: 0.5, y: 0.95, fontSize: 14, color: '#999999', fontFamily: 'Heebo', align: 'center', maxWidth: 0.8 },
    ]),
    isSystem: true,
  },
]

async function seed() {
  console.log('🌱 Seeding invitation templates...')
  for (const t of templates) {
    const existing = await prisma.invitationTemplate.findFirst({
      where: { name: t.name, isSystem: true }
    })
    if (!existing) {
      await prisma.invitationTemplate.create({ data: t })
      console.log(`  ✅ Created: ${t.name}`)
    } else {
      await prisma.invitationTemplate.update({
        where: { id: existing.id },
        data: { imageUrl: t.imageUrl, textZones: t.textZones }
      })
      console.log(`  🔄 Updated: ${t.name}`)
    }
  }
  console.log('✨ Done!')
  await prisma.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
