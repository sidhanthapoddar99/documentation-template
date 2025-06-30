#!/bin/bash
#
# Neuralock Server Installation Script
# This script automates the installation of Neuralock server on Ubuntu/Debian systems
#

set -euo pipefail

# Configuration
NEURALOCK_VERSION="${NEURALOCK_VERSION:-latest}"
INSTALL_DIR="/opt/neuralock"
SERVICE_USER="neuralock"
PYTHON_VERSION="3.9"
REDIS_VERSION="7"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
    fi
}

# Detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        log_error "Cannot detect OS version"
    fi
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."
    
    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y \
                python${PYTHON_VERSION} \
                python${PYTHON_VERSION}-venv \
                python${PYTHON_VERSION}-dev \
                redis-server \
                build-essential \
                libssl-dev \
                libffi-dev \
                libleveldb-dev \
                git \
                curl \
                wget \
                supervisor \
                nginx \
                ufw
            ;;
        centos|rhel|fedora)
            yum install -y epel-release
            yum install -y \
                python${PYTHON_VERSION/./} \
                python${PYTHON_VERSION/./}-devel \
                redis \
                gcc \
                gcc-c++ \
                openssl-devel \
                leveldb-devel \
                git \
                curl \
                wget \
                supervisor \
                nginx \
                firewalld
            ;;
        *)
            log_error "Unsupported OS: $OS"
            ;;
    esac
}

# Create service user
create_user() {
    log_info "Creating service user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -m -d /home/$SERVICE_USER $SERVICE_USER
    fi
}

# Setup directory structure
setup_directories() {
    log_info "Setting up directory structure..."
    
    mkdir -p $INSTALL_DIR/{config,data,logs,scripts,src}
    chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    chmod 750 $INSTALL_DIR
}

# Download and install Neuralock
install_neuralock() {
    log_info "Installing Neuralock server..."
    
    cd $INSTALL_DIR
    
    # Clone repository or download release
    if [[ "$NEURALOCK_VERSION" == "latest" ]]; then
        sudo -u $SERVICE_USER git clone https://github.com/neuralabs/neuralock-server.git .
    else
        wget -O neuralock-server.tar.gz \
            "https://github.com/neuralabs/neuralock-server/archive/refs/tags/v${NEURALOCK_VERSION}.tar.gz"
        tar -xzf neuralock-server.tar.gz --strip-components=1
        rm neuralock-server.tar.gz
        chown -R $SERVICE_USER:$SERVICE_USER .
    fi
    
    # Setup Python virtual environment
    sudo -u $SERVICE_USER python${PYTHON_VERSION} -m venv venv
    sudo -u $SERVICE_USER ./venv/bin/pip install --upgrade pip setuptools wheel
    sudo -u $SERVICE_USER ./venv/bin/pip install -r requirements.txt
}

# Configure Redis
configure_redis() {
    log_info "Configuring Redis..."
    
    # Backup original config
    cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
    
    # Set Redis password
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    cat > /etc/redis/redis.conf.d/neuralock.conf <<EOF
# Neuralock Redis Configuration
bind 127.0.0.1 ::1
protected-mode yes
port 6379
requirepass $REDIS_PASSWORD
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
EOF
    
    # Restart Redis
    systemctl restart redis
    systemctl enable redis
    
    # Save password for later use
    echo "REDIS_PASSWORD=$REDIS_PASSWORD" > $INSTALL_DIR/.env
    chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR/.env
    chmod 600 $INSTALL_DIR/.env
}

# Generate cryptographic keys
generate_keys() {
    log_info "Generating cryptographic keys..."
    
    cd $INSTALL_DIR
    sudo -u $SERVICE_USER ./venv/bin/python scripts/generate_keys.py \
        --output config/keys.yaml \
        --encrypt-password
}

# Setup systemd service
setup_service() {
    log_info "Setting up systemd service..."
    
    cp $INSTALL_DIR/config/neuralock.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable neuralock
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall..."
    
    case $OS in
        ubuntu|debian)
            ufw allow 8000/tcp comment "Neuralock API"
            ufw allow 22/tcp comment "SSH"
            echo "y" | ufw enable
            ;;
        centos|rhel|fedora)
            firewall-cmd --permanent --add-port=8000/tcp
            firewall-cmd --permanent --add-service=ssh
            firewall-cmd --reload
            ;;
    esac
}

# Initialize database
initialize_database() {
    log_info "Initializing database..."
    
    cd $INSTALL_DIR
    source .env
    
    sudo -u $SERVICE_USER ./venv/bin/python scripts/init_redis.py \
        --host localhost \
        --port 6379 \
        --password "$REDIS_PASSWORD"
}

# Start service
start_service() {
    log_info "Starting Neuralock service..."
    
    systemctl start neuralock
    
    # Wait for service to start
    sleep 5
    
    # Check if service is running
    if systemctl is-active --quiet neuralock; then
        log_info "Neuralock service started successfully"
    else
        log_error "Failed to start Neuralock service. Check logs: journalctl -u neuralock -n 50"
    fi
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."
    
    # Check API health
    if curl -sf http://localhost:8000/api/v1/health > /dev/null; then
        log_info "API health check passed"
    else
        log_warn "API health check failed. Service may still be starting..."
    fi
    
    # Get server info
    SERVER_INFO=$(curl -s http://localhost:8000/api/v1/info)
    log_info "Server info: $SERVER_INFO"
}

# Print summary
print_summary() {
    echo
    echo "================================================"
    echo "Neuralock Server Installation Complete!"
    echo "================================================"
    echo
    echo "Installation directory: $INSTALL_DIR"
    echo "Service user: $SERVICE_USER"
    echo "API endpoint: http://localhost:8000"
    echo
    echo "Configuration files:"
    echo "  - $INSTALL_DIR/config/config.yaml"
    echo "  - $INSTALL_DIR/config/keys.yaml"
    echo
    echo "Service management:"
    echo "  - Start: systemctl start neuralock"
    echo "  - Stop: systemctl stop neuralock"
    echo "  - Status: systemctl status neuralock"
    echo "  - Logs: journalctl -u neuralock -f"
    echo
    echo "Next steps:"
    echo "  1. Edit $INSTALL_DIR/config/config.yaml"
    echo "  2. Configure blockchain RPC endpoints"
    echo "  3. Register server with Neuralock Registry"
    echo "  4. Setup monitoring and alerts"
    echo
    log_warn "Redis password saved in: $INSTALL_DIR/.env"
    log_warn "Keep this file secure!"
}

# Main installation flow
main() {
    log_info "Starting Neuralock server installation..."
    
    check_root
    detect_os
    install_dependencies
    create_user
    setup_directories
    install_neuralock
    configure_redis
    generate_keys
    setup_service
    configure_firewall
    initialize_database
    start_service
    verify_installation
    print_summary
    
    log_info "Installation completed successfully!"
}

# Run main function
main "$@"