import type { FastifyPluginAsync } from 'fastify'

export const wsRoutes: FastifyPluginAsync = async (app) => {
  // WS /ws/events/:eventId - join an event room for real-time tag sync
  app.get('/events/:eventId', { websocket: true }, (socket, request) => {
    const { eventId } = request.params as { eventId: string }

    // Tag the socket with the eventId so we can broadcast to the right room
    ;(socket as any).eventId = eventId

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        // Echo to all clients in the same event room
        app.websocketServer?.clients.forEach((client) => {
          if ((client as any).eventId === eventId && client !== socket && client.readyState === 1) {
            client.send(JSON.stringify(msg))
          }
        })
      } catch {
        // ignore malformed messages
      }
    })

    socket.on('close', () => {
      // client disconnected
    })

    socket.send(JSON.stringify({ type: 'CONNECTED', eventId, timestamp: new Date().toISOString() }))
  })
}
