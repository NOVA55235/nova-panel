#!/bin/bash
################################################################
# Nova Panel — One-command installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/NOVA55235/nova-panel/main/install.sh | bash
# Or after cloning:
#   chmod +x install.sh && ./install.sh
################################################################

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[Nova]${NC} $1"; }
success() { echo -e "${GREEN}[✔]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✘]${NC} $1"; exit 1; }

echo ""
echo -e "${BOLD}${CYAN}"
echo "  ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗     ██████╗  █████╗ ███╗   ██╗███████╗██╗     "
echo "  ████╗  ██║██╔═══██╗██║   ██║██╔══██╗    ██╔══██╗██╔══██╗████╗  ██║██╔════╝██║     "
echo "  ██╔██╗ ██║██║   ██║██║   ██║███████║    ██████╔╝███████║██╔██╗ ██║█████╗  ██║     "
echo "  ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║    ██╔═══╝ ██╔══██║██║╚██╗██║██╔══╝  ██║     "
echo "  ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║    ██║     ██║  ██║██║ ╚████║███████╗███████╗"
echo "  ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Game Server & VPS Management Panel${NC}  |  by @Lord_nova98"
echo ""

# ── 1. Check OS ──────────────────────────────────────────────
if [[ "$EUID" -ne 0 ]]; then
  warn "Not running as root. Some steps may require sudo."
fi

# ── 2. Install Docker ────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  if [[ "$EUID" -ne 0 ]]; then
    sudo usermod -aG docker "$USER"
    warn "Docker installed. You may need to log out and back in for group changes."
  fi
  success "Docker installed."
else
  success "Docker already installed: $(docker --version)"
fi

# ── 3. Check docker compose ──────────────────────────────────
if ! docker compose version &>/dev/null; then
  error "Docker Compose V2 not found. Update Docker to a recent version."
fi
success "Docker Compose: $(docker compose version --short)"

# ── 4. Create install directory ──────────────────────────────
INSTALL_DIR="${NOVA_DIR:-/opt/nova-panel}"
info "Installing to: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ── 5. Clone or pull repo ────────────────────────────────────
REPO_URL="${NOVA_REPO:-https://github.com/NOVA55235/nova-panel.git}"

if [[ -d ".git" ]]; then
  info "Repo already exists — pulling latest..."
  git pull
else
  info "Cloning Nova Panel..."
  git clone "$REPO_URL" . 2>/dev/null || {
    warn "Could not clone — using files in current directory."
  }
fi

# ── 6. Configure .env ────────────────────────────────────────
if [[ ! -f ".env" ]]; then
  cp .env.docker .env

  # Generate a random secret
  SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | head -c 64)
  # Generate a random DB password
  DBPASS=$(openssl rand -hex 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 24)

  sed -i "s/changeme_strong_password/$DBPASS/g" .env
  sed -i "s/change_this_to_a_long_random_string_at_least_32_chars/$SECRET/g" .env

  success ".env created with random passwords."
  echo ""
  warn "Your admin credentials (save these!):"
  echo -e "   ${BOLD}URL:      ${CYAN}http://$(hostname -I | awk '{print $1}')${NC}"
  echo -e "   ${BOLD}Email:    ${NC}admin@gamepanel.io"
  echo -e "   ${BOLD}Password: ${NC}admin123"
  echo -e "   ${YELLOW}Change your password after first login!${NC}"
  echo ""
else
  warn ".env already exists — skipping config generation."
fi

# ── 7. Create nginx ssl directory ───────────────────────────
mkdir -p nginx/ssl

# ── 8. Build Docker image ────────────────────────────────────
info "Building Nova Panel Docker image (this takes ~2 minutes)..."
docker build -t nova-panel:latest . 2>&1 | tail -5
success "Image built."

# ── 9. Start services ────────────────────────────────────────
info "Starting all services..."
docker compose up -d
success "Nova Panel is running!"

# ── 10. Done ─────────────────────────────────────────────────
IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${BOLD}${GREEN}Nova Panel is live!${NC}"
echo -e "  ${BOLD}URL:      ${CYAN}http://$IP${NC}"
echo -e "  ${BOLD}Email:    ${NC}admin@gamepanel.io"
echo -e "  ${BOLD}Password: ${NC}admin123"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "  ${CYAN}docker compose logs -f panel${NC}    — view logs"
echo -e "  ${CYAN}docker compose restart panel${NC}    — restart panel"
echo -e "  ${CYAN}docker compose down${NC}             — stop everything"
echo -e "  ${CYAN}docker compose pull && docker compose up -d${NC}  — update"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
