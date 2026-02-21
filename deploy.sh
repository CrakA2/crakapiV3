#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.server"

if [[ ! -f "$ENV_FILE" ]]; then
    log_error ".env.server file not found at $ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

if [[ -z "$server_ip" || -z "$server_user" || -z "$server_ssh_pass" ]]; then
    log_error "Missing required variables in .env.server"
    log_error "Required: server_ip, server_user, server_ssh_pass"
    exit 1
fi

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/crakapi-v3}"
NODE_VERSION="${NODE_VERSION:-20}"

detect_package_manager() {
    if command -v apt-get &> /dev/null; then
        echo "apt"
    elif command -v dnf &> /dev/null; then
        echo "dnf"
    else
        echo "unknown"
    fi
}

install_requirement_local() {
    local pkg=$1
    if which $pkg &> /dev/null; then
        log_info "$pkg already installed locally"
        return 0
    fi

    log_info "Installing $pkg locally..."
    local pm=$(detect_package_manager)
    
    case $pm in
        apt)
            sudo apt-get update -qq && sudo apt-get install -y -qq $pkg
            ;;
        dnf)
            sudo dnf install -y -q $pkg
            ;;
        *)
            log_error "Unsupported package manager. Please install $pkg manually."
            exit 1
            ;;
    esac
    log_info "$pkg installed successfully"
}

check_server_requirements() {
    log_info "Checking server requirements..."
    
    sshpass -p "$server_ssh_pass" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$server_user@$server_ip" "bash -s" << 'REMOTE_SCRIPT'
set -e

NODE_VERSION="${NODE_VERSION:-20}"

install_curl() {
    if ! command -v curl &> /dev/null; then
        echo "[INFO] Installing curl..."
        if command -v apt-get &> /dev/null; then
            apt-get update -qq && apt-get install -y -qq curl
        elif command -v dnf &> /dev/null; then
            dnf install -y -q curl
        fi
    fi
}

install_rsync() {
    if ! command -v rsync &> /dev/null; then
        echo "[INFO] Installing rsync..."
        if command -v apt-get &> /dev/null; then
            apt-get install -y -qq rsync
        elif command -v dnf &> /dev/null; then
            dnf install -y -q rsync
        fi
    fi
}

install_node() {
    echo "[INFO] Node.js not found, installing..."
    install_curl
    
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y nodejs
    elif command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
        dnf install -y nodejs
    else
        echo "[ERROR] Cannot install Node.js - no supported package manager"
        exit 1
    fi
}

install_rsync

if ! command -v node &> /dev/null; then
    install_node
fi

if ! command -v npm &> /dev/null; then
    echo "[WARN] npm not found - will use transferred node_modules"
fi

if command -v pm2 &> /dev/null; then
    echo "[INFO] PM2 version: $(pm2 -v)"
else
    echo "[INFO] PM2 not found"
fi

echo "[INFO] Node version: $(node -v)"
if command -v npm &> /dev/null; then
    echo "[INFO] npm version: $(npm -v)"
fi
REMOTE_SCRIPT

    log_info "Server requirements satisfied"
}

build_project() {
    log_info "Building project locally..."
    cd "$SCRIPT_DIR"
    
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    npm run build
    log_info "Build completed successfully"
}

deploy_to_server() {
    log_info "Deploying to $server_user@$server_ip:$DEPLOY_DIR..."
    
    sshpass -p "$server_ssh_pass" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$server_user@$server_ip" "mkdir -p $DEPLOY_DIR"
    
    log_info "Transferring files..."
    
    local has_npm=$(sshpass -p "$server_ssh_pass" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$server_user@$server_ip" "command -v npm &> /dev/null && echo 'yes' || echo 'no'")
    
    if [[ "$has_npm" == *"yes"* ]]; then
        log_info "npm available on server - transferring without node_modules..."
        sshpass -p "$server_ssh_pass" rsync -avz --progress \
            -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
            --exclude 'node_modules' \
            --exclude '.svelte-kit' \
            --exclude '.git' \
            --exclude 'logs' \
            --exclude '*.log' \
            "$SCRIPT_DIR/" "$server_user@$server_ip:$DEPLOY_DIR/"
        
        log_info "Installing production dependencies on server..."
        sshpass -p "$server_ssh_pass" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            "$server_user@$server_ip" "cd $DEPLOY_DIR && npm install --production"
    else
        log_info "npm NOT available on server - transferring with node_modules (this may take longer)..."
        sshpass -p "$server_ssh_pass" rsync -avz --progress \
            -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
            --exclude '.svelte-kit' \
            --exclude '.git' \
            --exclude 'logs' \
            --exclude '*.log' \
            "$SCRIPT_DIR/" "$server_user@$server_ip:$DEPLOY_DIR/"
    fi
    
    log_info "Files deployed successfully"
}

start_application() {
    log_info "Starting application..."
    
    sshpass -p "$server_ssh_pass" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$server_user@$server_ip" "bash -s" << REMOTE_SCRIPT
cd $DEPLOY_DIR

has_pm2=false
has_npm=false

if command -v pm2 &> /dev/null; then
    has_pm2=true
fi

if command -v npm &> /dev/null; then
    has_npm=true
fi

if [[ "\$has_pm2" == "false" && "\$has_npm" == "true" ]]; then
    echo "[INFO] Installing PM2 globally..."
    npm install -g pm2
    has_pm2=true
fi

if [[ "\$has_pm2" == "true" ]]; then
    echo "[INFO] Starting with PM2..."
    pm2 delete crakapi-v3 2>/dev/null || true
    pm2 start ecosystem.config.cjs
    pm2 save
    
    if command -v systemctl &> /dev/null; then
        pm2 startup systemd -u $server_user --hp /home/$server_user 2>/dev/null || true
    fi
    
    pm2 list
else
    echo "[INFO] PM2 not available - starting with node directly..."
    pkill -f "node build/handler.js" 2>/dev/null || true
    nohup node build/handler.js > logs/out.log 2> logs/error.log &
    echo "[INFO] Application started (PID: \$!)"
    echo "[INFO] Logs: $DEPLOY_DIR/logs/"
fi
REMOTE_SCRIPT

    log_info "Application started successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    sleep 2
    
    local response=$(sshpass -p "$server_ssh_pass" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$server_user@$server_ip" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null || echo "000")
    
    if [[ "$response" == "200" || "$response" == "304" ]]; then
        log_info "Deployment verified! Server responding with HTTP $response"
        log_info "Application available at: http://$server_ip:3000"
    else
        log_warn "Server returned HTTP $response - check logs with: pm2 logs crakapi-v3"
    fi
}

main() {
    log_info "========================================="
    log_info "Starting deployment of crakapi-v3"
    log_info "Target: $server_user@$server_ip:$DEPLOY_DIR"
    log_info "========================================="
    
    install_requirement_local "sshpass"
    check_server_requirements
    build_project
    deploy_to_server
    start_application
    verify_deployment
    
    log_info "========================================="
    log_info "Deployment completed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Useful commands:"
    log_info "  View logs: ssh $server_user@$server_ip 'pm2 logs crakapi-v3'"
    log_info "  Restart:   ssh $server_user@$server_ip 'pm2 restart crakapi-v3'"
    log_info "  Status:    ssh $server_user@$server_ip 'pm2 status'"
}

main "$@"
