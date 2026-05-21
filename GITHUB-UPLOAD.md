# Nova Panel — GitHub & Docker Hub Guide

## Option A — Push source code to GitHub

Open the Replit **Shell** tab and run:

```bash
git config --global user.email "your@email.com"
git config --global user.name "Your Name"

git remote set-url origin https://github.com/NOVA55235/nova-panel.git
# (if origin doesn't exist yet: git remote add origin ...)

git add -A
git commit -m "Nova Panel v1.0 — by @Lord_nova98"
git push -u origin main
```

> Use a **Personal Access Token** as your password.
> Generate one at: https://github.com/settings/tokens → tick `repo` scope.

---

## Option B — Build & push to Docker Hub

### 1. Build the Docker image
```bash
docker build -t YOUR_DOCKERHUB_USERNAME/nova-panel:latest .
```

### 2. Log in to Docker Hub
```bash
docker login
```

### 3. Push the image
```bash
docker push YOUR_DOCKERHUB_USERNAME/nova-panel:latest
```

---

## Running on your VPS with Docker Compose

### 1. SSH into your VPS and install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Create a folder and set up env
```bash
mkdir /opt/nova-panel && cd /opt/nova-panel

# Download just the compose file (or copy it from the repo)
curl -O https://raw.githubusercontent.com/NOVA55235/nova-panel/main/docker-compose.yml

# Create your .env file
cat > .env << 'EOF'
POSTGRES_PASSWORD=your_strong_password_here
SESSION_SECRET=your_long_random_secret_here
HOST_PORT=3000
EOF
```

### 3. Pull and start
```bash
# If using your Docker Hub image, edit docker-compose.yml to replace
# "nova-panel:latest" with "YOUR_DOCKERHUB_USERNAME/nova-panel:latest"
# then:

docker compose pull
docker compose up -d
```

### 4. Open the panel
```
http://YOUR_VPS_IP:3000
Admin: admin@gamepanel.io / admin123
```

### 5. (Optional) nginx reverse proxy + SSL

```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name panel.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/panel.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Get free SSL with certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d panel.yourdomain.com
```

---

## Updating the panel

```bash
# Pull latest image from Docker Hub
docker compose pull
docker compose up -d --force-recreate panel
```

Or if self-building:
```bash
git pull
docker build -t YOUR_DOCKERHUB_USERNAME/nova-panel:latest .
docker push YOUR_DOCKERHUB_USERNAME/nova-panel:latest
```
