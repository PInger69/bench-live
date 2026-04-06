import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../middleware/auth.js'
import { z } from 'zod'
import { TagType, WsEventType } from '@bench-live/shared'

const createTagSchema = z.object({
  eventId: z.string(),
  type: z.nativeEnum(TagType).default(TagType.NORMAL),
  name: z.string().min(1),
  time: z.number(),
  duration: z.number().default(30),
  colour: z.string().default('#3B82F6'),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  coachPick: z.boolean().default(false),
  period: z.string().optional(),
  players: z.array(z.string()).default([]),
  extraData: z.record(z.unknown()).default({}),
  durationId: z.string().optional(),
  startTime: z.number().optional(),
  closeTime: z.number().optional(),
})

const updateTagSchema = z.object({
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  coachPick: z.boolean().optional(),
  players: z.array(z.string()).optional(),
  period: z.string().optional(),
  extraData: z.record(z.unknown()).optional(),
  deleted: z.boolean().optional(),
})

export const tagsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET /api/tags?eventId=xxx
  app.get('/', async (request, reply) => {
    const { eventId } = request.query as { eventId?: string }

    if (!eventId) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'eventId query param required' } })
    }

    const tags = await app.prisma.tag.findMany({
      where: { eventId, deleted: false },
      include: { user: { select: { id: true, name: true, colour: true, role: true } } },
      orderBy: { time: 'asc' },
    })

    return reply.send({ success: true, data: tags })
  })

  // POST /api/tags
  app.post('/', async (request, reply) => {
    const result = createTagSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    const userId = (request.user as any).userId

    const tag = await app.prisma.tag.create({
      data: { ...result.data, userId },
      include: { user: { select: { id: true, name: true, colour: true, role: true } } },
    })

    // Broadcast via WebSocket to all clients in this event room
    app.websocketServer?.clients.forEach((client) => {
      if ((client as any).eventId === result.data.eventId && client.readyState === 1) {
        client.send(JSON.stringify({
          type: WsEventType.TAG_CREATED,
          payload: tag,
          eventId: result.data.eventId,
          userId,
          timestamp: new Date().toISOString(),
        }))
      }
    })

    return reply.status(201).send({ success: true, data: tag })
  })

  // PATCH /api/tags/:id
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = updateTagSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    const tag = await app.prisma.tag.update({
      where: { id },
      data: result.data,
      include: { user: { select: { id: true, name: true, colour: true, role: true } } },
    })

    return reply.send({ success: true, data: tag })
  })

  // DELETE /api/tags/:id (soft delete)
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    await app.prisma.tag.update({ where: { id }, data: { deleted: true } })

    return reply.send({ success: true, data: { id } })
  })
}
