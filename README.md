<div align="center">

# Nova Panel

**Game Server · VPS · Discord Bot Management**

Built by [@Lord_nova98](https://github.com/NOVA55235) &nbsp;·&nbsp; [Discord](https://discord.gg/qnMmKQKaZ) &nbsp;·&nbsp; [GitHub](https://github.com/NOVA55235)

</div>

---

## One-Command Install

SSH into your VPS and run:

```bash
curl -fsSL https://raw.githubusercontent.com/NOVA55235/nova-panel/main/install.sh | bash
```

That's it. The script will:
- Install Docker if not present
- Clone the repo
- Generate random passwords automatically
- Build the Docker image
- Start the panel with nginx

**Open your browser:** `http://YOUR_VPS_IP`
**Login:** `admin@gamepanel.io` / `admin123`

> Change your password immediately via **Settings → Security**

---

## Manual Install (step-by-step)

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone the repo
git clone https://github.com/NOVA55235/nova-panel.git /opt/nova-panel
cd /opt/nova-panel

# 3. Configure environment
cp .env.docker .env
nano .env   # set your passwords

# 4. Build the image
docker build -t nova-panel:latest .

# 5. Start everything
docker compose up -d
```

---

## Add HTTPS / SSL (optional)

After installing, to use `https://panel.yourdomain.com`:

```bash
cd /opt/nova-panel

# Point your domain DNS A record to this VPS IP first, then:
apt install certbot -y
certbot certonly --standalone --preferred-challenges http -d panel.yourdomain.com

# Copy certs into the nginx ssl folder
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/panel.yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/panel.yourdomain.com/privkey.pem   nginx/ssl/key.pem

# Uncomment the HTTPS block in nginx/nova-panel.conf
nano nginx/nova-panel.conf   # uncomment the HTTPS server block

# Restart nginx
docker compose restart nginx
```

---

## Management Commands

```bash
# View logs
docker compose logs -f panel

# Restart panel
docker compose restart panel

# Stop everything
docker compose down

# Update to latest version
docker compose pull
docker compose up -d --force-recreate panel

# Backup database
docker exec nova-db pg_dump -U nova nova_panel > backup.sql
```

---

## Panel Background

The admin can set a custom background image for the panel and login page:

1. Log in as admin → **Settings → Panel Background**
2. Paste any public image URL (e.g. `https://example.com/bg.jpg`)
3. Click **Use Image** → **Save Panel Background**
4. The image is saved to the database — all users will see it automatically

**Supported background types:**
- Gradient presets (built-in)
- Custom image URL (any public HTTPS image)
- Video URL (e.g. from motionbgs.com — paste the direct `.mp4` link)
- Animated backgrounds (canvas animations built-in)

---

## Features

| Feature | Description |
|---------|-------------|
| **Game Servers** | Create, start/stop/restart, live console, file manager, backups, schedules |
| **VPS Management** | LXC-based VPS, Ubuntu/Debian/Alpine templates, resource charts, power controls |
| **Discord Bots** | Bot instance management |
| **Node System** | Multi-node with API key auth |
| **User Management** | Admin / User roles, resource limits per user |
| **Custom UI** | Video/image/animated backgrounds, login page customization |
| **API Keys** | Admin-scoped API key management |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | *(required)* | Database password |
| `SESSION_SECRET` | *(required)* | JWT secret — use `openssl rand -hex 32` |
| `ADMIN_EMAIL` | `admin@gamepanel.io` | First-run admin email |
| `ADMIN_PASSWORD` | `admin123` | First-run admin password |
| `ADMIN_USERNAME` | `admin` | First-run admin username |
| `DOCKER_IMAGE` | `nova-panel:latest` | Docker image name |

---

## Stack

- **Backend** — Node.js 20, Express 5, Drizzle ORM, PostgreSQL 16
- **Frontend** — React 18, Vite, Tailwind CSS, shadcn/ui
- **Proxy** — Nginx
- **Containers** — Docker + docker-compose

---

<div align="center">

Made with ❤️ by [@Lord_nova98](https://github.com/NOVA55235) &nbsp;·&nbsp; [Discord](https://discord.gg/qnMmKQKaZ)

</div>
