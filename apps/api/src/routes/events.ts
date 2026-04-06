import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { z } from 'zod'
import { SportType, EventStatus } from '@prisma/client'

const createEventSchema = z.object({
  name: z.string().min(1),
  sportType: z.nativeEnum(SportType).default(SportType.GENERIC),
  date: z.string().datetime(),
  homeTeamId: z.string().optional(),
  visitTeamId: z.string().optional(),
})

export const eventsRoutes: FastifyPluginAsync = async (app) => {
  // All event routes require auth
  app.addHook('preHandler', requireAuth)

  // GET /api/events
  app.get('/', async (request, reply) => {
    const { organisationId } = request.user as { organisationId?: string }
    const user = await app.prisma.user.findUnique({ where: { id: (request.user as any).userId } })
    if (!user) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })

    const events = await app.prisma.event.findMany({
      where: { organisationId: user.organisationId },
      include: {
        homeTeam: true,
        visitTeam: true,
        feeds: true,
        _count: { select: { tags: { where: { deleted: false } } } },
      },
      orderBy: { date: 'desc' },
    })

    return reply.send({
      success: true,
      data: events.map((e) => ({
        ...e,
        tagCount: e._count.tags,
        _count: undefined,
      })),
    })
  })

  // GET /api/events/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const event = await app.prisma.event.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        visitTeam: true,
        feeds: true,
        _count: { select: { tags: { where: { deleted: false } } } },
      },
    })

    if (!event) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } })
    }

    return reply.send({
      success: true,
      data: { ...event, tagCount: event._count.tags, _count: undefined },
    })
  })

  // POST /api/events
  app.post('/', async (request, reply) => {
    const result = createEventSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    const user = await app.prisma.user.findUnique({ where: { id: (request.user as any).userId } })
    if (!user) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })

    const event = await app.prisma.event.create({
      data: {
        ...result.data,
        date: new Date(result.data.date),
        organisationId: user.organisationId,
        status: EventStatus.RECORDED,
      },
      include: { homeTeam: true, visitTeam: true, feeds: true },
    })

    return reply.status(201).send({ success: true, data: event })
  })

  // PATCH /api/events/:id
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>

    const event = await app.prisma.event.update({
      where: { id },
      data: body,
      include: { homeTeam: true, visitTeam: true, feeds: true },
    })

    return reply.send({ success: true, data: event })
  })
}
