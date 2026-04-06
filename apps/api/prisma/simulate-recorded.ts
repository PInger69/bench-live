import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.event.update({
    where: { id: 'event-demo' },
    data: { status: 'RECORDED' },
  })

  console.log('✓ Event set back to RECORDED')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
