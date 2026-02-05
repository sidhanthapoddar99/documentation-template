#!/bin/bash

# =============================================================================
# Documentation Template Skills Downloader
# =============================================================================
# Downloads docs-guide and docs-settings skills from the documentation-template
# GitHub repository and installs them to your project's .claude/skills folder.
#
# Usage:
#   ./download-skills.sh [options]
#
# Options:
#   -d, --dest DIR    Destination .claude directory (default: ./.claude)
#   -r, --repo URL    GitHub repo URL (default: auto-detect or hardcoded)
#   -b, --branch NAME Branch to download from (default: main)
#   -f, --force       Overwrite existing skills without prompting
#   -h, --help        Show this help message
#
# Example:
#   ./download-skills.sh --dest /path/to/project/.claude
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
GITHUB_REPO="https://github.com/sidhanthapoddar99/documentation-template"
BRANCH="main"
DEST_DIR="./.claude"
FORCE=false
SKILLS=("docs-guide" "docs-settings")

# Temporary directory for downloads
TMP_DIR=""

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║       Documentation Template Skills Downloader                ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

cleanup() {
    if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
        rm -rf "$TMP_DIR"
    fi
}

trap cleanup EXIT

show_help() {
    head -30 "$0" | tail -25
    exit 0
}

# =============================================================================
# Argument Parsing
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dest)
            DEST_DIR="$2"
            shift 2
            ;;
        -r|--repo)
            GITHUB_REPO="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# =============================================================================
# Main Script
# =============================================================================

print_header

# Check for required tools
for cmd in curl tar; do
    if ! command -v $cmd &> /dev/null; then
        print_error "$cmd is required but not installed."
        exit 1
    fi
done

# Validate GitHub repo URL
if [ -z "$GITHUB_REPO" ]; then
    print_error "Repository URL is required."
    exit 1
fi

# Extract owner/repo from URL
REPO_PATH=$(echo "$GITHUB_REPO" | sed -E 's|https?://github\.com/||' | sed 's|\.git$||' | sed 's|/$||')

if [ -z "$REPO_PATH" ]; then
    print_error "Invalid GitHub URL: $GITHUB_REPO"
    exit 1
fi

print_info "Repository: $REPO_PATH"
print_info "Branch: $BRANCH"
print_info "Destination: $DEST_DIR"
echo ""

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR/skills"

# Create temporary directory
TMP_DIR=$(mktemp -d)
print_info "Downloading repository archive..."

# Download the repository archive
ARCHIVE_URL="https://github.com/$REPO_PATH/archive/refs/heads/$BRANCH.tar.gz"

if ! curl -sL "$ARCHIVE_URL" -o "$TMP_DIR/repo.tar.gz"; then
    print_error "Failed to download from: $ARCHIVE_URL"
    print_info "Make sure the repository and branch exist and are public."
    exit 1
fi

# Extract the archive
print_info "Extracting archive..."
tar -xzf "$TMP_DIR/repo.tar.gz" -C "$TMP_DIR"

# Find the extracted directory (usually repo-name-branch)
EXTRACTED_DIR=$(find "$TMP_DIR" -maxdepth 1 -type d -name "*-$BRANCH" -o -name "*-main" -o -name "*-master" | head -1)

if [ -z "$EXTRACTED_DIR" ] || [ ! -d "$EXTRACTED_DIR" ]; then
    # Try alternative naming
    EXTRACTED_DIR=$(find "$TMP_DIR" -maxdepth 1 -type d ! -name "$(basename $TMP_DIR)" | head -1)
fi

if [ -z "$EXTRACTED_DIR" ] || [ ! -d "$EXTRACTED_DIR" ]; then
    print_error "Could not find extracted directory"
    exit 1
fi

print_success "Archive extracted"
echo ""

# =============================================================================
# Process Each Skill
# =============================================================================

INSTALLED_COUNT=0
SKIPPED_COUNT=0

for SKILL in "${SKILLS[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Processing skill: ${NC}$SKILL"
    echo ""

    SOURCE_PATH="$EXTRACTED_DIR/.claude/skills/$SKILL"
    DEST_PATH="$DEST_DIR/skills/$SKILL"

    # Check if skill exists in the downloaded repo
    if [ ! -d "$SOURCE_PATH" ]; then
        print_warning "Skill '$SKILL' not found in repository"
        continue
    fi

    # Check if skill already exists in destination
    if [ -d "$DEST_PATH" ]; then
        print_warning "Skill '$SKILL' already exists at: $DEST_PATH"

        if [ "$FORCE" = true ]; then
            print_info "Force mode: Overwriting existing skill"
            rm -rf "$DEST_PATH"
        else
            echo ""
            echo "Options:"
            echo "  [o] Overwrite - Replace existing skill with downloaded version"
            echo "  [b] Backup    - Backup existing skill and install new one"
            echo "  [s] Skip      - Keep existing skill, don't install"
            echo "  [d] Diff      - Show differences (if diff is available)"
            echo ""
            read -p "What would you like to do? [o/b/s/d]: " choice

            case $choice in
                o|O)
                    print_info "Overwriting existing skill..."
                    rm -rf "$DEST_PATH"
                    ;;
                b|B)
                    BACKUP_PATH="${DEST_PATH}.backup.$(date +%Y%m%d%H%M%S)"
                    print_info "Backing up to: $BACKUP_PATH"
                    mv "$DEST_PATH" "$BACKUP_PATH"
                    ;;
                d|D)
                    if command -v diff &> /dev/null; then
                        echo ""
                        echo "Differences in SKILL.md:"
                        diff -u "$DEST_PATH/SKILL.md" "$SOURCE_PATH/SKILL.md" 2>/dev/null || true
                        echo ""
                        read -p "Install this skill? [y/n]: " install_choice
                        if [[ "$install_choice" != "y" && "$install_choice" != "Y" ]]; then
                            print_info "Skipping $SKILL"
                            ((SKIPPED_COUNT++))
                            continue
                        fi
                        rm -rf "$DEST_PATH"
                    else
                        print_warning "diff command not available"
                        print_info "Skipping $SKILL"
                        ((SKIPPED_COUNT++))
                        continue
                    fi
                    ;;
                s|S|*)
                    print_info "Skipping $SKILL"
                    ((SKIPPED_COUNT++))
                    continue
                    ;;
            esac
        fi
    fi

    # Copy the skill
    cp -r "$SOURCE_PATH" "$DEST_PATH"
    print_success "Installed skill: $SKILL"

    # List installed files
    echo ""
    echo "  Files installed:"
    find "$DEST_PATH" -type f | while read -r file; do
        echo "    - ${file#$DEST_DIR/skills/}"
    done

    ((INSTALLED_COUNT++))
    echo ""
done

# =============================================================================
# Post-Installation
# =============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $INSTALLED_COUNT -gt 0 ]; then
    print_success "Installation complete!"
    echo ""
    echo "  Installed: $INSTALLED_COUNT skill(s)"
    [ $SKIPPED_COUNT -gt 0 ] && echo "  Skipped:   $SKIPPED_COUNT skill(s)"
    echo ""

    # Check if settings.local.json exists and remind about permissions
    SETTINGS_FILE="$DEST_DIR/settings.local.json"

    echo -e "${YELLOW}Next Steps:${NC}"
    echo ""
    echo "1. Add skill permissions to your Claude settings."
    echo "   Edit: $SETTINGS_FILE"
    echo ""
    echo "   Add these to the 'allow' array:"
    echo ""
    echo '   "Skill(docs-guide)",'
    echo '   "Skill(docs-settings)",'
    echo ""
    echo "2. Restart Claude Code to load the new skills."
    echo ""
    echo "3. Use the skills:"
    echo "   - /docs-guide - For writing documentation content"
    echo "   - /docs-settings - For configuring documentation sites"
    echo ""
else
    print_info "No new skills were installed."
fi

# =============================================================================
# Cleanup handled by trap
# =============================================================================
