import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  // Accept either a full email address OR a plain username (e.g. "admin").
  // If no @ is present we append @benchlive.com before looking up the user.
  email: z.string().min(1),
  password: z.string().min(1),
})

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    let { email, password } = result.data

    // Allow plain username login: "admin" → "admin@benchlive.com"
    if (!email.includes('@')) {
      email = `${email}@benchlive.com`
    }

    const user = await app.prisma.user.findUnique({
      where: { email },
      include: { team: true },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
    }

    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    })

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          colour: user.colour,
          teamId: user.teamId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    })
  })

  // POST /api/auth/me
  app.get('/me', {
    preHandler: async (request, reply) => {
      try { await request.jwtVerify() } catch { return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }) }
    },
  }, async (request, reply) => {
    const { userId } = request.user

    const user = await app.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })
    }

    return reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        colour: user.colour,
        teamId: user.teamId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  })
}
