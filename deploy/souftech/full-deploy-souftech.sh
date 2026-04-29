#!/usr/bin/env bash
set -euo pipefail

# ==========================================================
# FULL OMKOORA PROJECT DEPLOY - SOUFTECH / HESTIA
# ==========================================================
# Run on the server as a user that can write to /home/user/web
# and can run chown/chmod for these web directories.

# ================================
# 0) VALUES
# ================================
DEPLOY_USER="user"
WEB_GROUP="www-data"
BRANCH="main"
REPO="git@github.com:Almukhtar1984/oman-kooora.git"

BACKEND_DOMAIN="omkoora-backend.souftech.com"
CLUB_DOMAIN="omkoora-club.souftech.com"
TEAM_DOMAIN="omkoora-team.souftech.com"
PLYER_DOMAIN="omkoora-plyer.souftech.com"
SUPER_ADMIN_DOMAIN="omkoora-super-admin.souftech.com"
SPORTS_COURSE_DOMAIN="omkoora-sports-course.souftech.com"
LANDING_PAGE_DOMAIN="omkoora-landing-page.souftech.com"

BACKEND_PORT="7001"
CLUB_PORT="3001"
TEAM_PORT="3008"
PLYER_PORT="30010"
SUPER_ADMIN_PORT="3006"

BACKEND_URL="https://${BACKEND_DOMAIN}"
CLUB_URL="https://${CLUB_DOMAIN}"
TEAM_URL="https://${TEAM_DOMAIN}"
PLYER_URL="https://${PLYER_DOMAIN}"
SUPER_ADMIN_URL="https://${SUPER_ADMIN_DOMAIN}"
SPORTS_COURSE_URL="https://${SPORTS_COURSE_DOMAIN}"
LANDING_PAGE_URL="https://${LANDING_PAGE_DOMAIN}"

# Fill these before running.
SECRET_JWT="CHANGE_ME_LONG_RANDOM_SECRET"
DB_PRO_USERNAME="CHANGE_ME_DB_USER"
DB_PRO_PASSWORD="CHANGE_ME_DB_PASSWORD"
DB_PRO_DATABASE="CHANGE_ME_DB_NAME"

# Optional mail values.
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER=""
SMTP_PASS=""
ERROR_MAIL_TO=""
MAIL_FROM_NAME="Omkoora"
MAIL_FROM_EMAIL=""
MAIL_DEFAULT_TO_NAME="Recipient"
MAIL_DEFAULT_TO_EMAIL=""
BREVO_API_KEY=""

# Optional payment values used by client/team.
NEXT_PUBLIC_THAWANI_API=""
NEXT_PUBLIC_THAWANI_SECRET_KEY=""
NEXT_PUBLIC_THAWANI_PUBLISHABLE_KEY=""
NEXT_PUBLIC_API_PAYMENT_SUCESS="${TEAM_URL}/payment/success"
NEXT_PUBLIC_API_PAYMENT_CANCEL="${TEAM_URL}/payment/cancel"

BACKEND_ROOT="/home/${DEPLOY_USER}/web/${BACKEND_DOMAIN}/public_html"
CLUB_ROOT="/home/${DEPLOY_USER}/web/${CLUB_DOMAIN}/public_html"
TEAM_ROOT="/home/${DEPLOY_USER}/web/${TEAM_DOMAIN}/public_html"
PLYER_ROOT="/home/${DEPLOY_USER}/web/${PLYER_DOMAIN}/public_html"
SUPER_ADMIN_ROOT="/home/${DEPLOY_USER}/web/${SUPER_ADMIN_DOMAIN}/public_html"
SPORTS_COURSE_ROOT="/home/${DEPLOY_USER}/web/${SPORTS_COURSE_DOMAIN}/public_html"
LANDING_PAGE_ROOT="/home/${DEPLOY_USER}/web/${LANDING_PAGE_DOMAIN}/public_html"

PM2_DIR="/home/${DEPLOY_USER}/web/pm2"
PM2_FILE="${PM2_DIR}/ecosystem.souftech.cjs"

CLIENT_ORIGINS="${CLUB_URL},${TEAM_URL},${PLYER_URL},${SUPER_ADMIN_URL},${SPORTS_COURSE_URL},${LANDING_PAGE_URL}"

# ================================
# 1) SSH KEY CHECK
# ================================
if [ ! -f "${HOME}/.ssh/id_ed25519.pub" ]; then
  ssh-keygen -t ed25519 -C "ymouawia10@gmail.com"
  echo "Add this SSH key to GitHub, then run this script again:"
  cat "${HOME}/.ssh/id_ed25519.pub"
  exit 1
fi

# ================================
# 2) HELPERS
# ================================
clean_public_html() {
  local dir="$1"
  mkdir -p "$dir"
  rm -rf "${dir:?}"/* "${dir}"/.[!.]* "${dir}"/..?* 2>/dev/null || true
}

add_safe_directory() {
  local dir="$1"
  git config --global --add safe.directory "$dir" || true
}

sparse_checkout() {
  local root="$1"
  local sparse_path="$2"

  cd "$root"
  rm -rf .git
  git init
  git remote add origin "$REPO"
  git config core.sparseCheckout true
  printf "%s\n" "$sparse_path" > .git/info/sparse-checkout
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
}

fix_permissions() {
  local dir="$1"
  chown -R "${DEPLOY_USER}:${WEB_GROUP}" "$dir" || true
  find "$dir" -type d -exec chmod 775 {} \;
  find "$dir" -type f -exec chmod 664 {} \;
  chmod -R g+s "$dir"
}

write_proxy_htaccess() {
  local root="$1"
  local port="$2"
  cat > "${root}/.htaccess" <<HTACCESS
Options -Indexes
RewriteEngine On

RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^(.*)$ ws://127.0.0.1:${port}/\$1 [P,L]

RewriteRule ^(.*)$ http://127.0.0.1:${port}/\$1 [P,L,QSA]
HTACCESS
}

write_landing_htaccess() {
  cat > "${LANDING_PAGE_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes +FollowSymLinks
DirectoryIndex client/landing-page/out/index.html

<IfModule mod_rewrite.c>
RewriteEngine On

RewriteRule ^_next/(.*)$ client/landing-page/out/_next/$1 [L,NC,QSA]

RewriteCond %{DOCUMENT_ROOT}/client/landing-page/out%{REQUEST_URI} -f
RewriteRule ^(.*)$ client/landing-page/out/$1 [L,QSA]

RewriteCond %{DOCUMENT_ROOT}/client/landing-page/out%{REQUEST_URI}/index.html -f
RewriteRule ^(.+?)/?$ client/landing-page/out/$1/index.html [L,QSA]

RewriteCond %{DOCUMENT_ROOT}/client/landing-page/out%{REQUEST_URI}.html -f
RewriteRule ^(.+)$ client/landing-page/out/$1.html [L,QSA]

RewriteRule ^ client/landing-page/out/index.html [L]
</IfModule>

AddType text/javascript .js
AddType text/css .css
AddType text/html .html
HTACCESS
}

write_sports_course_htaccess() {
  cat > "${SPORTS_COURSE_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes +FollowSymLinks
DirectoryIndex client/sports-course/dist/index.html

<IfModule mod_rewrite.c>
RewriteEngine On

RewriteRule ^assets/(.*)$ client/sports-course/dist/assets/$1 [L,NC,QSA]

RewriteCond %{DOCUMENT_ROOT}/client/sports-course/dist%{REQUEST_URI} -f
RewriteRule ^(.*)$ client/sports-course/dist/$1 [L,QSA]

RewriteCond %{DOCUMENT_ROOT}/client/sports-course/dist%{REQUEST_URI} -d
RewriteRule ^(.*)$ client/sports-course/dist/$1 [L,QSA]

RewriteRule ^ client/sports-course/dist/index.html [L]
</IfModule>

AddType text/javascript .js
AddType text/css .css
AddType text/html .html
HTACCESS
}

write_backend_env() {
  cat > "${BACKEND_ROOT}/server/.env" <<ENV
NODE_ENV=production
PORT=${BACKEND_PORT}
API_URL=${BACKEND_URL}
REQUEST_BODY_LIMIT=1mb
TRUST_PROXY=true
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COMPLEXITY=500

CLIENT_ORIGINS=${CLIENT_ORIGINS}

ADMIN_URL=${SUPER_ADMIN_URL}
EMPLOYEE_URL=${CLUB_URL}
SUPERVISOR_URL=${TEAM_URL}
CUSTOMER_URL=${PLYER_URL}

SECRET_JWT=${SECRET_JWT}
MAX_FAILED_LOGIN_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15

DB_PRO_USERNAME=${DB_PRO_USERNAME}
DB_PRO_PASSWORD=${DB_PRO_PASSWORD}
DB_PRO_DATABASE=${DB_PRO_DATABASE}

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=${SMTP_SECURE}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
ERROR_MAIL_TO=${ERROR_MAIL_TO}
MAIL_FROM_NAME=${MAIL_FROM_NAME}
MAIL_FROM_EMAIL=${MAIL_FROM_EMAIL}
MAIL_DEFAULT_TO_NAME=${MAIL_DEFAULT_TO_NAME}
MAIL_DEFAULT_TO_EMAIL=${MAIL_DEFAULT_TO_EMAIL}
BREVO_API_KEY=${BREVO_API_KEY}
ENV
}

write_next_env() {
  local app_dir="$1"
  cat > "${app_dir}/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}
NEXT_PUBLIC_UPLOAD_URL=${BACKEND_URL}
NEXT_PUBLIC_PRINT_URL=https://print.omkooora.com
ENV
}

write_team_env() {
  local app_dir="$1"
  cat > "${app_dir}/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}
NEXT_PUBLIC_UPLOAD_URL=${BACKEND_URL}
NEXT_PUBLIC_PRINT_URL=https://print.omkooora.com
NEXT_PUBLIC_THAWANI_API=${NEXT_PUBLIC_THAWANI_API}
NEXT_PUBLIC_THAWANI_SECRET_KEY=${NEXT_PUBLIC_THAWANI_SECRET_KEY}
NEXT_PUBLIC_THAWANI_PUBLISHABLE_KEY=${NEXT_PUBLIC_THAWANI_PUBLISHABLE_KEY}
NEXT_PUBLIC_API_PAYMENT_SUCESS=${NEXT_PUBLIC_API_PAYMENT_SUCESS}
NEXT_PUBLIC_API_PAYMENT_CANCEL=${NEXT_PUBLIC_API_PAYMENT_CANCEL}
ENV
}

write_landing_env() {
  cat > "${LANDING_PAGE_ROOT}/client/landing-page/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
ENV
}

write_sports_course_env() {
  cat > "${SPORTS_COURSE_ROOT}/client/sports-course/.env.production" <<ENV
VITE_API_URL=${BACKEND_URL}
ENV
}

write_pm2_file() {
  mkdir -p "$PM2_DIR"
  cat > "$PM2_FILE" <<PM2
module.exports = {
  apps: [
    {
      name: "omkoora-backend",
      cwd: "${BACKEND_ROOT}/server",
      script: "./scripts/start-production.mjs",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: "${BACKEND_PORT}",
      },
    },
    {
      name: "omkoora-club",
      cwd: "${CLUB_ROOT}/client/club",
      script: "node_modules/next/dist/bin/next",
      args: "start -p ${CLUB_PORT}",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "omkoora-team",
      cwd: "${TEAM_ROOT}/client/team",
      script: "node_modules/next/dist/bin/next",
      args: "start -p ${TEAM_PORT}",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "omkoora-plyer",
      cwd: "${PLYER_ROOT}/client/plyer",
      script: "node_modules/next/dist/bin/next",
      args: "start -p ${PLYER_PORT}",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "omkoora-super-admin",
      cwd: "${SUPER_ADMIN_ROOT}/client/super-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p ${SUPER_ADMIN_PORT}",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
PM2
}

build_next_app() {
  local app_dir="$1"
  local pm2_name="$2"

  cd "$app_dir"
  npm ci
  npm run build
  npm prune --omit=dev
  pm2 reload "$PM2_FILE" --only "$pm2_name" --env production || pm2 start "$PM2_FILE" --only "$pm2_name" --env production
}

build_static_app() {
  local app_dir="$1"

  cd "$app_dir"
  npm ci
  npm run build
}

# ================================
# 3) CLEAN OLD FILES
# ================================
clean_public_html "$BACKEND_ROOT"
clean_public_html "$CLUB_ROOT"
clean_public_html "$TEAM_ROOT"
clean_public_html "$PLYER_ROOT"
clean_public_html "$SUPER_ADMIN_ROOT"
clean_public_html "$SPORTS_COURSE_ROOT"
clean_public_html "$LANDING_PAGE_ROOT"

# ================================
# 4) SAFE DIRECTORY
# ================================
add_safe_directory "$BACKEND_ROOT"
add_safe_directory "$CLUB_ROOT"
add_safe_directory "$TEAM_ROOT"
add_safe_directory "$PLYER_ROOT"
add_safe_directory "$SUPER_ADMIN_ROOT"
add_safe_directory "$SPORTS_COURSE_ROOT"
add_safe_directory "$LANDING_PAGE_ROOT"

# ================================
# 5) SPARSE CHECKOUTS
# ================================
sparse_checkout "$BACKEND_ROOT" "server/"
sparse_checkout "$CLUB_ROOT" "client/club/"
sparse_checkout "$TEAM_ROOT" "client/team/"
sparse_checkout "$PLYER_ROOT" "client/plyer/"
sparse_checkout "$SUPER_ADMIN_ROOT" "client/super-admin/"
sparse_checkout "$SPORTS_COURSE_ROOT" "client/sports-course/"
sparse_checkout "$LANDING_PAGE_ROOT" "client/landing-page/"

# ================================
# 6) ENV FILES
# ================================
write_backend_env
write_next_env "${CLUB_ROOT}/client/club"
write_team_env "${TEAM_ROOT}/client/team"
write_next_env "${PLYER_ROOT}/client/plyer"
write_next_env "${SUPER_ADMIN_ROOT}/client/super-admin"
write_landing_env
write_sports_course_env
write_pm2_file

# ================================
# 7) HTACCESS FILES
# ================================
write_proxy_htaccess "$BACKEND_ROOT" "$BACKEND_PORT"
write_proxy_htaccess "$CLUB_ROOT" "$CLUB_PORT"
write_proxy_htaccess "$TEAM_ROOT" "$TEAM_PORT"
write_proxy_htaccess "$PLYER_ROOT" "$PLYER_PORT"
write_proxy_htaccess "$SUPER_ADMIN_ROOT" "$SUPER_ADMIN_PORT"
write_landing_htaccess
write_sports_course_htaccess

# ================================
# 8) BUILD BACKEND
# ================================
cd "${BACKEND_ROOT}/server"
npm ci --include=dev
npm run db:migrate
pm2 reload "$PM2_FILE" --only omkoora-backend --env production || pm2 start "$PM2_FILE" --only omkoora-backend --env production

# ================================
# 9) BUILD NEXT SSR APPS
# ================================
build_next_app "${CLUB_ROOT}/client/club" "omkoora-club"
build_next_app "${TEAM_ROOT}/client/team" "omkoora-team"
build_next_app "${PLYER_ROOT}/client/plyer" "omkoora-plyer"
build_next_app "${SUPER_ADMIN_ROOT}/client/super-admin" "omkoora-super-admin"

# ================================
# 10) BUILD STATIC APPS
# ================================
build_static_app "${LANDING_PAGE_ROOT}/client/landing-page"
build_static_app "${SPORTS_COURSE_ROOT}/client/sports-course"

# ================================
# 11) PERMISSIONS
# ================================
fix_permissions "$BACKEND_ROOT"
fix_permissions "$CLUB_ROOT"
fix_permissions "$TEAM_ROOT"
fix_permissions "$PLYER_ROOT"
fix_permissions "$SUPER_ADMIN_ROOT"
fix_permissions "$SPORTS_COURSE_ROOT"
fix_permissions "$LANDING_PAGE_ROOT"
fix_permissions "$PM2_DIR"

pm2 save

echo "DEPLOY FINISHED"
echo "Backend:       ${BACKEND_URL}"
echo "Club:          ${CLUB_URL}"
echo "Team:          ${TEAM_URL}"
echo "Plyer:         ${PLYER_URL}"
echo "Super Admin:   ${SUPER_ADMIN_URL}"
echo "Landing Page:  ${LANDING_PAGE_URL}"
echo "Sports Course: ${SPORTS_COURSE_URL}"

