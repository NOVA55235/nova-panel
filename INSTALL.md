# Nova Panel — Installation Guide
### Everest Node · Built by **@Lord_nova98**

> The world-class, production-ready game server, VPS & Discord bot management panel.
> Inspired by Pterodactyl & Airlink, redesigned with the **Everest Node** glacier theme.

---

## ✨ What You Get

| Feature | Description |
|---|---|
| 🎮 **Unlimited game servers** | Minecraft, Rust, CS2, FiveM, ARK, Valheim, Garry's Mod, Terraria, Factorio + custom |
| 💻 **VPS management** | Full virtual machine provisioning with snapshots & ISO mounts |
| 🤖 **Discord bot hosting** | Token-only setup, manage panel from Discord, no node needed |
| 🛡️ **DDoS protection** | L3/L4/L7 mitigation, rate limiting, anycast network |
| 🔄 **Auto-failover** | If a node dies, servers migrate to a healthy node automatically |
| 👥 **Unlimited users per server** | Admin creates servers, assigns to single or multiple users |
| 🎨 **Fully customizable** | Panel background, login background, themes — all admin-configurable |
| 📊 **Live status channel** | Real-time site load, DDoS stats, service health, activity log |
| 🐉 **Cinematic intro** | Mountain + dragon-fly splash animation on first load |
| 🖥️ **Live console** | 8-tab server view: Console, Files, Databases, Schedules, Sub-users, Backups, Network, Settings |

---

## 🔑 Default Admin Credentials

After installation, log in with:

```
Email:    admin@gamepanel.io
Password: admin123
```

> ⚠️ **CHANGE THE PASSWORD IMMEDIATELY** after first login. See [§ Change Admin Password](#-change-admin-password) below.

---

## 📋 System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **OS** | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 LTS |
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 2 GB | 8 GB+ |
| **Disk** | 20 GB SSD | 100 GB NVMe |
| **Node.js** | 20.x | 22.x LTS |
| **PostgreSQL** | 14+ | 16+ |
| **pnpm** | 9.x | 10.x |
| **Network** | 100 Mbps + public IP | 1 Gbps + DDoS-protected IP |

---

## 🚀 Quick Install (One Liner)

For Ubuntu 22.04+ / Debian 12+:

```bash
curl -fsSL https://raw.githubusercontent.com/Lord-nova98/nova-panel/main/scripts/install.sh | sudo bash
```

This installs Node.js, pnpm, PostgreSQL, clones the repo, runs migrations, creates the admin user, and starts the panel as a systemd service.

---

## 🛠️ Manual Installation (Step-by-Step)

### 1 — System packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

### 2 — Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
```

### 3 — Install pnpm

```bash
sudo npm install -g pnpm@latest
```

### 4 — Configure PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE USER nova WITH PASSWORD 'changeme_secure_password';
CREATE DATABASE nova_panel OWNER nova;
GRANT ALL PRIVILEGES ON DATABASE nova_panel TO nova;
SQL
```

### 5 — Clone Nova Panel

```bash
sudo mkdir -p /opt/nova-panel
sudo chown $USER:$USER /opt/nova-panel
cd /opt/nova-panel
git clone https://github.com/Lord-nova98/nova-panel.git .
```

### 6 — Configure environment

```bash
cat > .env <<'EOF'
DATABASE_URL=postgresql://nova:changeme_secure_password@localhost:5432/nova_panel
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
PORT=3000
EOF
```

### 7 — Install & build

```bash
pnpm install --frozen-lockfile
pnpm run db:push
pnpm run build
```

### 8 — Start the panel

```bash
pnpm run start
```

The panel is now accessible at **http://your-server-ip:3000**.

---

## 🔐 Change Admin Password

### Option A — From the panel (recommended)

1. Log in at `/login` with the default credentials above
2. Go to **Settings → Security**
3. Enter new password and click **Update Password**

### Option B — Direct SQL reset

```bash
sudo -u postgres psql nova_panel <<'SQL'
-- Replace 'YourNewSecurePassword' with your password
UPDATE users
SET password_hash = encode(digest('YourNewSecurePassword' || 'gamepanel_salt_2024', 'sha256'), 'hex')
WHERE email = 'admin@gamepanel.io';
SQL
```

---

## 🌐 Port Forwarding

### Game ports (open as needed)

| Game | Default Port(s) | Protocol |
|---|---|---|
| Minecraft Java | 25565 | TCP |
| Minecraft Bedrock | 19132 | UDP |
| Rust | 28015–28016 | TCP + UDP |
| Counter-Strike 2 | 27015 | TCP + UDP |
| FiveM (GTA V) | 30120 | TCP + UDP |
| Garry's Mod | 27015 | TCP + UDP |
| ARK: Survival | 7777, 27015 | UDP |
| Valheim | 2456–2458 | UDP |
| Terraria | 7777 | TCP |
| Factorio | 34197 | UDP |
| Discord Bots | — | Outbound only |
| VPS / SSH | 22 | TCP |
| Panel HTTPS | 443 | TCP |

### UFW firewall

```bash
sudo ufw allow 22/tcp                          # SSH
sudo ufw allow 80/tcp                          # HTTP
sudo ufw allow 443/tcp                         # HTTPS
sudo ufw allow 25565/tcp                       # Minecraft
sudo ufw allow 27015                           # CS2 / Gmod
sudo ufw allow 28015:28016/tcp                 # Rust
sudo ufw allow 28015:28016/udp
sudo ufw enable
```

### Home router (NAT)

1. Open router admin → `192.168.1.1`
2. **Port Forwarding** → **Add Rule**
3. External port = Internal port, Internal IP = your server's LAN IP
4. Save & restart router

### Cloud VPS firewall

| Provider | Setting |
|---|---|
| **DigitalOcean** | Networking → Firewalls → Add Inbound Rule |
| **Hetzner** | Cloud Console → Firewalls → Inbound Rules |
| **AWS EC2** | Security Groups → Inbound → Add port |
| **Vultr** | Firewall → Manage → Add Rule |
| **OVH** | Network → Firewall → Add Rule |

---

## 🔒 Production: Nginx + SSL

### Reverse proxy

`/etc/nginx/sites-available/nova-panel`:

```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nova-panel /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d panel.yourdomain.com
```

---

## ⚙️ systemd Service

`/etc/systemd/system/nova-panel.service`:

```ini
[Unit]
Description=Nova Panel — Game Server Management
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=nova
Group=nova
WorkingDirectory=/opt/nova-panel
Environment=NODE_ENV=production
EnvironmentFile=/opt/nova-panel/.env
ExecStart=/usr/bin/pnpm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd -r -s /bin/false nova
sudo chown -R nova:nova /opt/nova-panel
sudo systemctl daemon-reload
sudo systemctl enable --now nova-panel
sudo journalctl -u nova-panel -f      # live logs
```

---

## 🤖 Discord Bot Setup (optional)

1. Go to https://discord.com/developers/applications
2. **New Application** → name it "Nova Panel"
3. **Bot** tab → **Reset Token** → copy the token
4. In the panel: **Settings → Integrations → Discord** → paste token → **Connect**
5. Invite the bot with this URL (replace `YOUR_CLIENT_ID`):
   ```
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=8
   ```

### Bot commands

| Command | Description |
|---|---|
| `/status` | Show panel + node health |
| `/servers` | List all servers |
| `/start <server>` | Start a server |
| `/stop <server>` | Stop a server |
| `/restart <server>` | Restart a server |
| `/console <server>` | Read recent console output |
| `/users` | List panel users (admin) |
| `/backup <server>` | Trigger backup |
| `/failover <node>` | Manually migrate all servers off a node |

---

## 🔄 Updating Nova Panel

```bash
cd /opt/nova-panel
sudo systemctl stop nova-panel
git pull origin main
pnpm install --frozen-lockfile
pnpm run db:push
pnpm run build
sudo systemctl start nova-panel
```

---

## 💾 Backup & Restore

### Backup

```bash
# Database
pg_dump -U nova nova_panel | gzip > /backups/nova-$(date +%F).sql.gz

# Files
tar -czf /backups/nova-files-$(date +%F).tar.gz /opt/nova-panel
```

### Restore

```bash
gunzip < /backups/nova-2026-04-22.sql.gz | psql -U nova nova_panel
tar -xzf /backups/nova-files-2026-04-22.tar.gz -C /
```

---

## ❓ FAQ & Troubleshooting

<details>
<summary><strong>Panel won't load — blank page</strong></summary>

- Check `sudo journalctl -u nova-panel -n 100`
- Ensure port 3000 is bound: `sudo ss -tlnp | grep 3000`
- Verify `.env` has all required variables
</details>

<details>
<summary><strong>Cannot log in with admin credentials</strong></summary>

- Reset password via SQL (see [§ Change Admin Password](#-change-admin-password))
- The salt MUST be `gamepanel_salt_2024` — do not change it
</details>

<details>
<summary><strong>Database connection refused</strong></summary>

- `sudo systemctl status postgresql`
- Check `pg_hba.conf` allows `local` connections with `md5` or `scram-sha-256`
</details>

<details>
<summary><strong>WebSocket / live console not working</strong></summary>

- Nginx must include the `Upgrade` headers (see config above)
- Cloudflare? Enable WebSockets in Network settings
</details>

<details>
<summary><strong>Server says "starting" forever</strong></summary>

- Ensure the daemon (wings) is running on the assigned node
- Check node connectivity from panel: `Status → Service Status → Game Server Daemon`
- Try manual failover: `/failover <node>` from Discord, or in admin → Nodes
</details>

<details>
<summary><strong>How do I add another admin?</strong></summary>

```sql
UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
```
</details>

---

## 🎨 Customization

Everything is configurable from **Settings** (admin tabs):

| Tab | Options |
|---|---|
| **Panel Background** | 7 gradient presets (Everest, Aurora, Nebula, Ocean, Matrix, Sunset) + custom image URL + intensity slider |
| **Login Background** | 9 presets + custom image + intensity slider + live preview |
| **Animated Background** | 6 live animation styles (Particles, Matrix, Aurora, Stars, Hex Grid, Nebula) + intensity + speed sliders |
| **Profile** | Email, first/last name |
| **Security** | Change password |

All changes apply live — no page reload needed. Settings are saved to the database and applied to all users.

---

## 📞 Support

- **Author:** [@Lord_nova98](https://discord.com/users/Lord_nova98)
- **GitHub:** https://github.com/Lord-nova98/nova-panel
- **Docs:** https://docs.nova-panel.io
- **Discord:** https://discord.gg/nova-panel

---

## 📜 License

MIT — Free to use, modify, and self-host. Attribution to **@Lord_nova98** appreciated.

---

> *"From the summit of Everest to the depths of the data center — Nova Panel powers them all."*
> — **@Lord_nova98**
