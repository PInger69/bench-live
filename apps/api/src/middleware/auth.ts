import type { FastifyRequest, FastifyReply } from 'fastify'
import { UserRole } from '@bench-live/shared'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply)
    const user = request.user as { role: UserRole }
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
    }
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
      email: string
      role: UserRole
      teamId: string | null
    }
    user: {
      userId: string
      email: string
      role: UserRole
      teamId: string | null
    }
  }
}
