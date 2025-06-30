#!/bin/bash
# Neuralock Recovery Scripts

# Function to check server status
check_server_status() {
    local server_url=$1
    echo "Checking server: $server_url"
    
    if curl -s -o /dev/null -w "%{http_code}" "$server_url/health" | grep -q "200"; then
        echo "✓ Server is healthy"
        return 0
    else
        echo "✗ Server is down or unhealthy"
        return 1
    fi
}

# Function to recover from threshold violation
recover_threshold_violation() {
    echo "Starting threshold violation recovery..."
    
    # 1. Count available servers
    available_servers=0
    for server in "${SERVERS[@]}"; do
        if check_server_status "$server"; then
            ((available_servers++))
        fi
    done
    
    echo "Available servers: $available_servers"
    
    # 2. Check if we meet minimum threshold
    if [ $available_servers -lt $THRESHOLD_MIN ]; then
        echo "ERROR: Not enough servers available ($available_servers < $THRESHOLD_MIN)"
        
        # Try to start backup servers
        echo "Attempting to start backup servers..."
        for backup in "${BACKUP_SERVERS[@]}"; do
            echo "Starting backup server: $backup"
            ssh "$backup" "systemctl start neuralock"
            sleep 5
            
            if check_server_status "https://$backup:8000"; then
                echo "✓ Backup server started successfully"
                ((available_servers++))
                
                if [ $available_servers -ge $THRESHOLD_MIN ]; then
                    echo "✓ Threshold requirement met"
                    break
                fi
            fi
        done
    fi
    
    return $available_servers
}

# Function to sync data between servers
sync_server_data() {
    local source_server=$1
    local target_server=$2
    
    echo "Syncing data from $source_server to $target_server"
    
    # Export data from source
    ssh "$source_server" "neuralock-cli export --output /tmp/neuralock-export.json"
    
    # Copy to target
    scp "$source_server:/tmp/neuralock-export.json" "$target_server:/tmp/"
    
    # Import on target
    ssh "$target_server" "neuralock-cli import --input /tmp/neuralock-export.json"
    
    echo "✓ Data sync completed"
}

# Emergency recovery mode
emergency_recovery() {
    echo "WARNING: Entering emergency recovery mode"
    echo "This will temporarily reduce security to restore service"
    
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Emergency recovery cancelled"
        exit 1
    fi
    
    # Enable emergency mode on all available servers
    for server in "${SERVERS[@]}"; do
        if check_server_status "$server"; then
            echo "Enabling emergency mode on $server"
            ssh "$server" "neuralock-cli emergency --enable --duration 3600"
        fi
    done
    
    echo "✓ Emergency mode enabled for 1 hour"
    echo "IMPORTANT: Re-secure the system as soon as possible"
}

# Main recovery menu
main() {
    echo "==================================="
    echo "Neuralock Recovery Tool"
    echo "==================================="
    echo
    echo "1. Check all server status"
    echo "2. Recover from threshold violation"
    echo "3. Sync data between servers"
    echo "4. Emergency recovery mode"
    echo "5. Exit"
    echo
    read -p "Select option: " option
    
    case $option in
        1)
            for server in "${SERVERS[@]}"; do
                check_server_status "$server"
            done
            ;;
        2)
            recover_threshold_violation
            ;;
        3)
            read -p "Source server: " source
            read -p "Target server: " target
            sync_server_data "$source" "$target"
            ;;
        4)
            emergency_recovery
            ;;
        5)
            exit 0
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
}

# Configuration
SERVERS=("server1.neuralock.io" "server2.neuralock.io" "server3.neuralock.io")
BACKUP_SERVERS=("backup1.neuralock.io" "backup2.neuralock.io")
THRESHOLD_MIN=2

# Run main menu
main
