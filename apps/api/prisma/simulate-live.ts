import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Set demo event to LIVE
  await prisma.event.update({
    where: { id: 'event-demo' },
    data: { status: 'LIVE' },
  })

  // Add a public HLS test stream to the feed
  await prisma.feed.update({
    where: { id: 'feed-main' },
    data: {
      hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      label: 'Main Camera (Live)',
    },
  })

  console.log('✓ Event set to LIVE')
  console.log('✓ Test HLS stream attached')
  console.log('')
  console.log('Visit http://localhost:3000/events to see the live event.')
  console.log('Run prisma/simulate-recorded.ts to switch back to RECORDED.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
