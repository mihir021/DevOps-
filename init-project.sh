#!/usr/bin/env bash
# ==============================================================================
# MERN Stack GitHub Template Initializer
#
# Purpose:
#   Customizes a new project instantiated from this GitHub Template repository.
#   It prompts for project identity, lets you toggle CI/CD and monitoring features,
#   replaces all template placeholders, generates secure local secrets, and prints
#   clear guidance for local development and cloud deployment.
#
# Usage:
#   Interactive mode:      ./init-project.sh
#   Non-interactive mode:  ./init-project.sh --name "my-app" --user "myuser" --title "My App" -y
# ==============================================================================

set -euo pipefail

# ---- ANSI Color Definitions for Formatted Output ----
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
MAGENTA="\033[35m"
RESET="\033[0m"

# ---- Determine Script & Project Root Directory ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${CYAN}"
echo "========================================================================"
echo "    🚀  MERN Stack Production Template Initializer                      "
echo "========================================================================"
echo -e "${RESET}"

# ---- Parse Command-Line Flags ----
PROJECT_NAME=""
GITHUB_USER=""
APP_TITLE=""
USE_CI=""
USE_CD=""
USE_MONITORING=""
AUTO_CONFIRM=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      PROJECT_NAME="$2"
      shift 2
      ;;
    --user)
      GITHUB_USER="$2"
      shift 2
      ;;
    --title)
      APP_TITLE="$2"
      shift 2
      ;;
    --ci)
      USE_CI="$2"
      shift 2
      ;;
    --cd)
      USE_CD="$2"
      shift 2
      ;;
    --monitoring)
      USE_MONITORING="$2"
      shift 2
      ;;
    -y|--yes)
      AUTO_CONFIRM=true
      shift
      ;;
    -h|--help)
      echo "Usage: ./init-project.sh [options]"
      echo ""
      echo "Options:"
      echo "  --name <name>          Project slug name (e.g., 'shop-ease')"
      echo "  --user <username>      GitHub username or org (e.g., 'mihir021')"
      echo "  --title <title>        Display title of the Web App (e.g., 'ShopEase App')"
      echo "  --ci <y|n>             Enable/disable GitHub Actions CI workflow"
      echo "  --cd <y|n>             Enable/disable GitHub Actions CD deployment workflow"
      echo "  --monitoring <y|n>     Enable/disable Prometheus + Grafana monitoring profile"
      echo "  -y, --yes              Skip interactive confirmations"
      echo "  -h, --help             Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${RESET}"
      exit 1
      ;;
  esac
done

# ---- Helper Function: Cross-Platform Safe Regex Replacement ----
replace_in_file() {
  local search="$1"
  local replace="$2"
  local file="$3"

  if [[ -f "$file" ]]; then
    node -e "
      const fs = require('fs');
      let content = fs.readFileSync('$file', 'utf8');
      const regex = new RegExp(process.argv[1], 'g');
      content = content.replace(regex, process.argv[2]);
      fs.writeFileSync('$file', content, 'utf8');
    " "$search" "$replace"
  fi
}

# ==============================================================================
# STEP 1: Identity Prompts
# ==============================================================================
echo -e "${BOLD}${BLUE}Step 1: Project Identity${RESET}"

# Detect existing git remote user
DETECTED_USER=""
if git config --get remote.origin.url >/dev/null 2>&1; then
  REMOTE_URL="$(git config --get remote.origin.url)"
  DETECTED_USER="$(echo "$REMOTE_URL" | sed -E 's/.*[:/]([^/]+)\/[^/]+\.git$/\1/' || true)"
fi

if [[ -z "$PROJECT_NAME" ]]; then
  DEFAULT_NAME="$(basename "$SCRIPT_DIR" | tr '[:upper:]' '[:lower:]' | tr ' _' '-')"
  echo -e "${YELLOW}Enter your project slug name (kebab-case, e.g., 'shop-ease'):${RESET}"
  read -r -p "Project Name [${DEFAULT_NAME}]: " INPUT_NAME
  PROJECT_NAME="${INPUT_NAME:-$DEFAULT_NAME}"
fi
PROJECT_NAME="$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' _' '-' | sed 's/[^a-z0-9-]//g')"

if [[ -z "$GITHUB_USER" ]]; then
  DEFAULT_USER="${DETECTED_USER:-$(whoami)}"
  echo -e "\n${YELLOW}Enter your GitHub username or organization (for GHCR container registry):${RESET}"
  read -r -p "GitHub Username [${DEFAULT_USER}]: " INPUT_USER
  GITHUB_USER="${INPUT_USER:-$DEFAULT_USER}"
fi

if [[ -z "$APP_TITLE" ]]; then
  DEFAULT_TITLE="$(echo "$PROJECT_NAME" | sed -E 's/(^|-)([a-z])/\U \2/g' | sed 's/^ //')"
  echo -e "\n${YELLOW}Enter the display title for your Web App:${RESET}"
  read -r -p "App Title [${DEFAULT_TITLE}]: " INPUT_TITLE
  APP_TITLE="${INPUT_TITLE:-$DEFAULT_TITLE}"
fi

# ==============================================================================
# STEP 2: Feature Toggles
# ==============================================================================
echo -e "\n${BOLD}${BLUE}Step 2: Feature Toggles${RESET}"

if [[ -z "$USE_CI" ]]; then
  echo -e "${YELLOW}Enable GitHub Actions CI (lint, test, build verification)? [Y/n]${RESET}"
  read -r -p "> " INPUT_CI
  if [[ "$INPUT_CI" =~ ^[Nn]$ ]]; then
    USE_CI="n"
  else
    USE_CI="y"
  fi
fi

if [[ -z "$USE_CD" ]]; then
  echo -e "${YELLOW}Enable GitHub Actions CD (auto-build & deploy to AWS EC2)? [Y/n]${RESET}"
  read -r -p "> " INPUT_CD
  if [[ "$INPUT_CD" =~ ^[Nn]$ ]]; then
    USE_CD="n"
  else
    USE_CD="y"
  fi
fi

if [[ -z "$USE_MONITORING" ]]; then
  echo -e "${YELLOW}Enable Prometheus & Grafana Monitoring stack? [y/N]${RESET}"
  read -r -p "> " INPUT_MONITORING
  if [[ "$INPUT_MONITORING" =~ ^[Yy]$ ]]; then
    USE_MONITORING="y"
  else
    USE_MONITORING="n"
  fi
fi

# ==============================================================================
# Confirmation
# ==============================================================================
echo -e "\n${BOLD}${BLUE}Configuration Summary:${RESET}"
echo -e "  • Project Name:       ${GREEN}${PROJECT_NAME}${RESET}"
echo -e "  • GitHub User:        ${GREEN}${GITHUB_USER}${RESET}"
echo -e "  • App Title:          ${GREEN}${APP_TITLE}${RESET}"
echo -e "  • CI Workflow:        $([ "$USE_CI" = "y" ] && echo -e "${GREEN}Enabled${RESET}" || echo -e "${RED}Disabled (file will be removed)${RESET}")"
echo -e "  • CD Workflow:        $([ "$USE_CD" = "y" ] && echo -e "${GREEN}Enabled${RESET}" || echo -e "${RED}Disabled (file will be removed)${RESET}")"
echo -e "  • Monitoring Stack:   $([ "$USE_MONITORING" = "y" ] && echo -e "${GREEN}Enabled (profile: monitoring)${RESET}" || echo -e "${YELLOW}Disabled (dormant profile)${RESET}")"
echo ""

if [[ "$AUTO_CONFIRM" != "true" ]]; then
  read -r -p "Apply these settings? [Y/n] " CONFIRM
  if [[ "$CONFIRM" =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}Setup cancelled.${RESET}"
    exit 0
  fi
fi

echo -e "\n${BOLD}Applying configuration...${RESET}"

# ==============================================================================
# STEP 3: Workflow Handling (Clean File Deletions)
# ==============================================================================
if [[ "$USE_CI" != "y" ]]; then
  if [[ -f "./.github/workflows/ci.yml" ]]; then
    rm -f "./.github/workflows/ci.yml"
    echo -e "  🗑️  Removed ${YELLOW}.github/workflows/ci.yml${RESET}"
  fi
else
  echo -e "  ✅ Kept CI workflow"
fi

if [[ "$USE_CD" != "y" ]]; then
  if [[ -f "./.github/workflows/cd.yml" ]]; then
    rm -f "./.github/workflows/cd.yml"
    echo -e "  🗑️  Removed ${YELLOW}.github/workflows/cd.yml${RESET}"
  fi
else
  echo -e "  ✅ Kept CD workflow"
fi

# ==============================================================================
# STEP 4: Placeholder Replacement
# ==============================================================================
echo -e "  ⚙️  Substituting placeholders in manifests and config files..."

# Package manifests
replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./client/package.json"
replace_in_file "__APP_TITLE__" "${APP_TITLE}" "./client/package.json"

replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./server/package.json"
replace_in_file "__APP_TITLE__" "${APP_TITLE}" "./server/package.json"

# HTML Title
replace_in_file "__APP_TITLE__" "${APP_TITLE}" "./client/index.html"

# Docker Compose files
replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./docker-compose.yml"
replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./docker-compose.prod.yml"
replace_in_file "__GITHUB_USER__" "${GITHUB_USER}" "./docker-compose.prod.yml"

# Workflows (if kept)
replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./.github/workflows/ci.yml"
replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./.github/workflows/cd.yml"
replace_in_file "__GITHUB_USER__" "${GITHUB_USER}" "./.github/workflows/cd.yml"

# Prometheus
replace_in_file "__PROJECT_NAME__" "${PROJECT_NAME}" "./monitoring/prometheus.yml"

# ==============================================================================
# STEP 5: Secrets & Environment Files
# ==============================================================================
echo -e "  ⚙️  Setting up environment files and secrets..."

RANDOM_JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

# Root .env for Compose Profiles
COMPOSE_PROFILE_VAL=""
if [[ "$USE_MONITORING" == "y" ]]; then
  COMPOSE_PROFILE_VAL="monitoring"
fi

cat > "./.env" <<EOF
# Compose Profiles (e.g., monitoring)
COMPOSE_PROFILES=${COMPOSE_PROFILE_VAL}

# Local port mappings
SERVER_PORT=5000
CLIENT_PORT=8080
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Secrets for local containers
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/${PROJECT_NAME}?retryWrites=true&w=majority
JWT_SECRET=${RANDOM_JWT_SECRET}
GRAFANA_ADMIN_PASSWORD=admin
EOF

# Server .env
if [[ ! -f "./server/.env" ]]; then
  cat > "./server/.env" <<EOF
# Local backend configuration
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/${PROJECT_NAME}?retryWrites=true&w=majority
JWT_SECRET=${RANDOM_JWT_SECRET}
EOF
fi

# Client .env
if [[ ! -f "./client/.env" ]]; then
  cat > "./client/.env" <<EOF
# Local frontend configuration
# Vite dev server proxies /api calls to localhost:5000 automatically
EOF
fi

echo -e "\n${BOLD}${GREEN}========================================================================${RESET}"
echo -e "${BOLD}${GREEN}    🎉  '${PROJECT_NAME}' Initialized Successfully!                     ${RESET}"
echo -e "${BOLD}${GREEN}========================================================================${RESET}\n"

# ==============================================================================
# STEP 6: Output Next Steps & Developer Guidance
# ==============================================================================
echo -e "${BOLD}${CYAN}▶ LOCAL DEVELOPMENT COMMANDS:${RESET}"
echo -e "  1. Add your real MongoDB Atlas connection URI in ${BOLD}server/.env${RESET}"
echo -e "  2. Start with Docker Compose:"
if [[ "$USE_MONITORING" == "y" ]]; then
  echo -e "     ${YELLOW}docker compose --profile monitoring up --build${RESET}"
  echo -e "     (Frontend: :8080 | Backend: :5000 | Prometheus: :9090 | Grafana: :3000)"
else
  echo -e "     ${YELLOW}docker compose up --build${RESET}"
  echo -e "     (Frontend: :8080 | Backend: :5000)"
  echo -e "     Tip: Run with monitoring anytime via: ${MAGENTA}docker compose --profile monitoring up${RESET}"
fi
echo ""
echo -e "  3. Or run without Docker:"
echo -e "     ${YELLOW}cd server && npm install && npm run dev${RESET}"
echo -e "     ${YELLOW}cd client && npm install && npm run dev${RESET}"
echo ""

if [[ "$USE_CD" == "y" ]]; then
  echo -e "${BOLD}${CYAN}▶ AWS EC2 DEPLOYMENT (GITHUB SECRETS CHECKLIST):${RESET}"
  echo -e "  Go to your GitHub repo → ${BOLD}Settings > Secrets and variables > Actions${RESET} and add:"
  echo -e "    • ${GREEN}EC2_HOST${RESET}:               Public IP address of your EC2 instance"
  echo -e "    • ${GREEN}EC2_USER${RESET}:               SSH user (usually 'ubuntu')"
  echo -e "    • ${GREEN}EC2_SSH_KEY${RESET}:            Your private SSH key (.pem file content)"
  echo -e "    • ${GREEN}MONGODB_URI${RESET}:            Production MongoDB Atlas connection URI"
  echo -e "    • ${GREEN}JWT_SECRET${RESET}:             Production JWT secret key"
  if [[ "$USE_MONITORING" == "y" ]]; then
    echo -e "    • ${GREEN}GRAFANA_ADMIN_PASSWORD${RESET}: Password to access Grafana at port 3000"
  fi
  echo ""
fi
