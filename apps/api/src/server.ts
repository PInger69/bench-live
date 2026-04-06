import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { authRoutes } from './routes/auth.js'
import { eventsRoutes } from './routes/events.js'
import { tagsRoutes } from './routes/tags.js'
import { usersRoutes } from './routes/users.js'
import { wsRoutes } from './routes/ws.js'
import { prismaPlugin } from './plugins/prisma.js'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
})

// Plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'bench-live-dev-secret-change-in-production',
  sign: { expiresIn: '7d' },
})

await app.register(websocket)
await app.register(prismaPlugin)

// Routes
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(eventsRoutes, { prefix: '/api/events' })
await app.register(tagsRoutes, { prefix: '/api/tags' })
await app.register(usersRoutes, { prefix: '/api/users' })
await app.register(wsRoutes, { prefix: '/ws' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`Bench Live API running at http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
