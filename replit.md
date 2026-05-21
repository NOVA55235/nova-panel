# GamePanel - Game Server & VPS Management Panel

## Overview

A production-ready game server and VPS management panel similar to Pterodactyl Panel, with additional VPS management capabilities.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Auth**: JWT (custom HMAC-based tokens)

## Features

### Game Server Management
- Create/delete/start/stop/restart game servers
- Live console (WebSocket-ready UI)
- File manager interface
- Resource limits (CPU, RAM, Disk)
- Backup system
- Schedule tasks

### VPS Management Module
- Create VPS instances (LXC/Docker-based)
- OS templates: Ubuntu 22.04, Ubuntu 24.04, Debian 12, Debian 11, Alpine 3.19
- Auto-generate IP, username, SSH port
- Power controls (start/stop/restart/reinstall)
- Resource monitoring with live charts

### Node System
- Multi-node support
- Node registration with API key
- Online/offline status monitoring
- Per-node resource stats

### Auth & Permissions
- Admin / User roles
- JWT-based authentication
- Server & VPS allocation limits per user

## Directory Structure

```
artifacts/
├── api-server/           # Express backend API
│   └── src/routes/       # Auth, users, nodes, servers, vps, dashboard
└── panel/                # React + Vite frontend
    └── src/pages/        # Dashboard, Servers, VPS, Nodes, Users, Settings

lib/
├── db/src/schema/        # Drizzle ORM schema (users, nodes, servers, vps, allocations, backups, activity)
├── api-spec/             # OpenAPI spec (openapi.yaml)
└── api-client-react/     # Generated React Query hooks
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/panel run dev` — run frontend locally

## Default Credentials

- Admin: `admin@gamepanel.io` / `admin123`

## API Routes

- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `GET /api/auth/me` — Current user
- `GET /api/dashboard/summary` — Stats overview
- `GET /api/dashboard/activity` — Recent activity
- `GET /api/servers` — List game servers
- `POST /api/servers` — Create server
- `POST /api/servers/:id/power` — Power actions
- `GET /api/vps` — List VPS instances
- `POST /api/vps` — Create VPS
- `POST /api/vps/:id/power` — VPS power actions
- `GET /api/nodes` — List nodes
- `POST /api/nodes` — Add node
- `GET /api/users` — List users (admin only)

## Installation

See INSTALL.md for the complete production installation guide covering Ubuntu 22/24, Docker, nginx, SSL, systemd services, and node daemon setup.
