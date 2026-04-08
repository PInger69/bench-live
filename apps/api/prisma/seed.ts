import { PrismaClient, UserRole, SportType, EventStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create organisation
  const org = await prisma.organisation.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organisation',
      slug: 'demo-org',
    },
  })

  // Create teams
  const homeTeam = await prisma.team.upsert({
    where: { id: 'team-home' },
    update: {},
    create: {
      id: 'team-home',
      name: 'Home Lions',
      shortName: 'HOM',
      colour: '#3B82F6',
      organisationId: org.id,
    },
  })

  const visitTeam = await prisma.team.upsert({
    where: { id: 'team-visit' },
    update: {},
    create: {
      id: 'team-visit',
      name: 'Visit Tigers',
      shortName: 'VIS',
      colour: '#EF4444',
      organisationId: org.id,
    },
  })

  // Create users
  const adminPassword = await bcrypt.hash('admin', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@benchlive.com' },
    update: { passwordHash: adminPassword },
    create: {
      email: 'admin@benchlive.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: UserRole.SUPERUSER,
      colour: '#8B5CF6',
      organisationId: org.id,
    },
  })

  const coachPassword = await bcrypt.hash('coach123', 10)
  await prisma.user.upsert({
    where: { email: 'coach@benchlive.com' },
    update: {},
    create: {
      email: 'coach@benchlive.com',
      passwordHash: coachPassword,
      name: 'Head Coach',
      role: UserRole.COACH,
      colour: '#10B981',
      teamId: homeTeam.id,
      organisationId: org.id,
    },
  })

  const playerPassword = await bcrypt.hash('player123', 10)
  await prisma.user.upsert({
    where: { email: 'player@benchlive.com' },
    update: {},
    create: {
      email: 'player@benchlive.com',
      passwordHash: playerPassword,
      name: 'Demo Player',
      role: UserRole.PLAYER,
      colour: '#F59E0B',
      teamId: homeTeam.id,
      organisationId: org.id,
    },
  })

  // Create a demo event
  const event = await prisma.event.upsert({
    where: { id: 'event-demo' },
    update: {},
    create: {
      id: 'event-demo',
      name: 'Demo Match - Home Lions vs Visit Tigers',
      sportType: SportType.SOCCER,
      status: EventStatus.RECORDED,
      date: new Date(),
      homeTeamId: homeTeam.id,
      visitTeamId: visitTeam.id,
      organisationId: org.id,
    },
  })

  // Create demo feeds
  // mp4Url points to a 40-minute test video in apps/web/public/
  // Replace with your own video URL (HLS or MP4) as needed
  await prisma.feed.upsert({
    where: { id: 'feed-main' },
    update: { mp4Url: '/test-40min.mp4', hlsUrl: null },
    create: {
      id: 'feed-main',
      eventId: event.id,
      sourceName: 's_00',
      label: 'Main Camera',
      mp4Url: '/test-40min.mp4',
      quality: 'HQ',
      isActive: true,
    },
  })

  console.log('Seed complete.')
  console.log('')
  console.log('Demo accounts:')
  console.log('  admin  / admin   (Superuser)   — or admin@benchlive.com')
  console.log('  coach@benchlive.com  / coach123  (Coach)')
  console.log('  player@benchlive.com / player123 (Player)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
