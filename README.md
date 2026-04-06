# Bench Live

Professional sports video analysis platform. Tag moments, review footage, and coach smarter.

## Structure

```
bench-live/
├── apps/
│   ├── web/          # Next.js 14 frontend (port 3000)
│   └── api/          # Fastify backend (port 3001)
├── packages/
│   └── shared/       # Shared TypeScript types
├── package.json      # npm workspaces root
└── turbo.json        # Turborepo config
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Install dependencies
```bash
npm install
```

### Configure environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit apps/api/.env with your DATABASE_URL
```

### Set up database
```bash
cd apps/api
npx prisma db push
npx tsx prisma/seed.ts
```

### Run development servers
```bash
npm run dev
```

Frontend: http://localhost:3000
API: http://localhost:3001

### Demo accounts
| Email | Password | Role |
|-------|----------|------|
| admin@benchlive.com | admin123 | Superuser |
| coach@benchlive.com | coach123 | Coach |
| player@benchlive.com | player123 | Player |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Fastify, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time | WebSockets (via @fastify/websocket) |
| Video | HLS.js |
| State | Zustand |
| Monorepo | Turborepo + npm workspaces |
