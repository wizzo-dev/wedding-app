import { prisma } from '../models/db.js'
import { randomBytes } from 'crypto'

const guests = await prisma.guest.findMany({ where: { guestToken: null } })

for (const g of guests) {
  await prisma.guest.update({
    where: { id: g.id },
    data: { guestToken: randomBytes(4).toString('hex') }
  })
}

await prisma.$disconnect()
console.log('Done:', guests.length, 'guests updated')
