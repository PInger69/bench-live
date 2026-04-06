import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { UserRole } from '@bench-live/shared'

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET /api/users - admin/coach only
  app.get('/', {
    preHandler: requireRole(UserRole.SUPERUSER, UserRole.TEAM_ADMIN, UserRole.COACH),
  }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: (request.user as any).userId } })
    if (!user) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })

    const users = await app.prisma.user.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, email: true, name: true, role: true, colour: true, teamId: true, createdAt: true, updatedAt: true },
    })

    return reply.send({ success: true, data: users })
  })

  // GET /api/users/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const user = await app.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, colour: true, teamId: true, createdAt: true, updatedAt: true },
    })

    if (!user) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })

    return reply.send({ success: true, data: user })
  })
}
