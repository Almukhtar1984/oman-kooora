#!/usr/bin/env bash
set -e

# ==========================================================
# FULL OMKOORA PROJECT DEPLOY - SOUFTECH STANDARD VERSION
# ==========================================================

# عدل هذه القيم فقط قبل التشغيل
USER_NAME="user"
WEB_GROUP="www-data"
REPO="git@github.com:Almukhtar1984/oman-kooora.git"
BRANCH="main"

SECRET_JWT="CHANGE_ME_LONG_RANDOM_SECRET"
DB_PRO_USERNAME="CHANGE_ME_DB_USER"
DB_PRO_PASSWORD="CHANGE_ME_DB_PASSWORD"
DB_PRO_DATABASE="CHANGE_ME_DB_NAME"

BACKEND_DOMAIN="omkoora-backend.souftech.com"
CLUB_DOMAIN="omkoora-club.souftech.com"
TEAM_DOMAIN="omkoora-team.souftech.com"
PLYER_DOMAIN="omkoora-plyer.souftech.com"
SUPER_ADMIN_DOMAIN="omkoora-super-admin.souftech.com"
SPORTS_COURSE_DOMAIN="omkoora-sports-course.souftech.com"
LANDING_PAGE_DOMAIN="omkoora-landing-page.souftech.com"

BACKEND_ROOT="/home/${USER_NAME}/web/${BACKEND_DOMAIN}/public_html"
CLUB_ROOT="/home/${USER_NAME}/web/${CLUB_DOMAIN}/public_html"
TEAM_ROOT="/home/${USER_NAME}/web/${TEAM_DOMAIN}/public_html"
PLYER_ROOT="/home/${USER_NAME}/web/${PLYER_DOMAIN}/public_html"
SUPER_ADMIN_ROOT="/home/${USER_NAME}/web/${SUPER_ADMIN_DOMAIN}/public_html"
SPORTS_COURSE_ROOT="/home/${USER_NAME}/web/${SPORTS_COURSE_DOMAIN}/public_html"
LANDING_PAGE_ROOT="/home/${USER_NAME}/web/${LANDING_PAGE_DOMAIN}/public_html"

BACKEND_URL="https://${BACKEND_DOMAIN}"
CLIENT_ORIGINS="https://${CLUB_DOMAIN},https://${TEAM_DOMAIN},https://${PLYER_DOMAIN},https://${SUPER_ADMIN_DOMAIN},https://${SPORTS_COURSE_DOMAIN},https://${LANDING_PAGE_DOMAIN}"

# ==========================================================
# 1) CLEAN OLD FILES
# ==========================================================
rm -rf "${BACKEND_ROOT}"/* "${BACKEND_ROOT}"/.[!.]* "${BACKEND_ROOT}"/..?* 2>/dev/null || true
rm -rf "${CLUB_ROOT}"/* "${CLUB_ROOT}"/.[!.]* "${CLUB_ROOT}"/..?* 2>/dev/null || true
rm -rf "${TEAM_ROOT}"/* "${TEAM_ROOT}"/.[!.]* "${TEAM_ROOT}"/..?* 2>/dev/null || true
rm -rf "${PLYER_ROOT}"/* "${PLYER_ROOT}"/.[!.]* "${PLYER_ROOT}"/..?* 2>/dev/null || true
rm -rf "${SUPER_ADMIN_ROOT}"/* "${SUPER_ADMIN_ROOT}"/.[!.]* "${SUPER_ADMIN_ROOT}"/..?* 2>/dev/null || true
rm -rf "${SPORTS_COURSE_ROOT}"/* "${SPORTS_COURSE_ROOT}"/.[!.]* "${SPORTS_COURSE_ROOT}"/..?* 2>/dev/null || true
rm -rf "${LANDING_PAGE_ROOT}"/* "${LANDING_PAGE_ROOT}"/.[!.]* "${LANDING_PAGE_ROOT}"/..?* 2>/dev/null || true

# ==========================================================
# 2) SAFE DIRECTORY
# ==========================================================
git config --global --add safe.directory "${BACKEND_ROOT}" || true
git config --global --add safe.directory "${CLUB_ROOT}" || true
git config --global --add safe.directory "${TEAM_ROOT}" || true
git config --global --add safe.directory "${PLYER_ROOT}" || true
git config --global --add safe.directory "${SUPER_ADMIN_ROOT}" || true
git config --global --add safe.directory "${SPORTS_COURSE_ROOT}" || true
git config --global --add safe.directory "${LANDING_PAGE_ROOT}" || true

if [ ! -f ~/.ssh/id_ed25519.pub ]; then
  ssh-keygen -t ed25519 -C "ymouawia10@gmail.com"
  cat ~/.ssh/id_ed25519.pub
  echo "انسخ المفتاح أعلاه وأضفه في GitHub SSH Keys ثم شغل السكربت مرة ثانية."
  exit 1
fi

# ==========================================================
# 3) SPARSE CHECKOUTS
# ==========================================================
cd "${BACKEND_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "server/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

cd "${CLUB_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "client/club/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

cd "${TEAM_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "client/team/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

cd "${PLYER_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "client/plyer/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

cd "${SUPER_ADMIN_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "client/super-admin/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

cd "${SPORTS_COURSE_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "client/sports-course/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

cd "${LANDING_PAGE_ROOT}"
rm -rf .git
git init
git remote add origin "${REPO}"
git config core.sparseCheckout true
echo "client/landing-page/" > .git/info/sparse-checkout
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"

# ==========================================================
# 4) ENV FILES
# ==========================================================
cat > "${BACKEND_ROOT}/server/.env" <<ENV
NODE_ENV=production
PORT=7001
API_URL=${BACKEND_URL}
REQUEST_BODY_LIMIT=1mb
TRUST_PROXY=true
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COMPLEXITY=500
CLIENT_ORIGINS=${CLIENT_ORIGINS}
ADMIN_URL=https://${SUPER_ADMIN_DOMAIN}
EMPLOYEE_URL=https://${CLUB_DOMAIN}
SUPERVISOR_URL=https://${TEAM_DOMAIN}
CUSTOMER_URL=https://${PLYER_DOMAIN}
SECRET_JWT=${SECRET_JWT}
MAX_FAILED_LOGIN_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
DB_PRO_USERNAME=${DB_PRO_USERNAME}
DB_PRO_PASSWORD=${DB_PRO_PASSWORD}
DB_PRO_DATABASE=${DB_PRO_DATABASE}
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
ERROR_MAIL_TO=
MAIL_FROM_NAME=Omkoora
MAIL_FROM_EMAIL=
MAIL_DEFAULT_TO_NAME=Recipient
MAIL_DEFAULT_TO_EMAIL=
BREVO_API_KEY=
ENV

cat > "${CLUB_ROOT}/client/club/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}
NEXT_PUBLIC_UPLOAD_URL=${BACKEND_URL}
NEXT_PUBLIC_PRINT_URL=https://print.omkooora.com
ENV

cat > "${TEAM_ROOT}/client/team/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}
NEXT_PUBLIC_UPLOAD_URL=${BACKEND_URL}
NEXT_PUBLIC_PRINT_URL=https://print.omkooora.com
NEXT_PUBLIC_THAWANI_API=
NEXT_PUBLIC_THAWANI_SECRET_KEY=
NEXT_PUBLIC_THAWANI_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_PAYMENT_SUCESS=https://${TEAM_DOMAIN}/payment/success
NEXT_PUBLIC_API_PAYMENT_CANCEL=https://${TEAM_DOMAIN}/payment/cancel
ENV

cat > "${PLYER_ROOT}/client/plyer/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}
NEXT_PUBLIC_UPLOAD_URL=${BACKEND_URL}
ENV

cat > "${SUPER_ADMIN_ROOT}/client/super-admin/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}
NEXT_PUBLIC_UPLOAD_URL=${BACKEND_URL}
ENV

cat > "${SPORTS_COURSE_ROOT}/client/sports-course/.env.production" <<ENV
VITE_API_URL=${BACKEND_URL}
ENV

cat > "${LANDING_PAGE_ROOT}/client/landing-page/.env.production" <<ENV
NEXT_PUBLIC_API_URL=${BACKEND_URL}
ENV

# ==========================================================
# 5) PERMISSIONS
# ==========================================================
for DIR in "${BACKEND_ROOT}" "${CLUB_ROOT}" "${TEAM_ROOT}" "${PLYER_ROOT}" "${SUPER_ADMIN_ROOT}" "${SPORTS_COURSE_ROOT}" "${LANDING_PAGE_ROOT}"; do
  chown -R "${USER_NAME}:${WEB_GROUP}" "${DIR}" || true
  find "${DIR}" -type d -exec chmod 775 {} \;
  find "${DIR}" -type f -exec chmod 664 {} \;
  chmod -R g+s "${DIR}"
done

# ==========================================================
# 6) NODE BACKEND - SERVER
# ==========================================================
cd "${BACKEND_ROOT}/server"
npm ci --include=dev
npm run db:migrate

# ==========================================================
# 7) NEXT FRONTENDS - PM2 REQUIRED
# ==========================================================
mkdir -p "/home/${USER_NAME}/web/pm2"
cat > "/home/${USER_NAME}/web/pm2/ecosystem.omkoora.cjs" <<PM2
module.exports = {
  apps: [
    { name: "omkoora-backend", cwd: "${BACKEND_ROOT}/server", script: "./scripts/start-production.mjs", env: { NODE_ENV: "production", PORT: "7001" } },
    { name: "omkoora-club", cwd: "${CLUB_ROOT}/client/club", script: "node_modules/next/dist/bin/next", args: "start -p 3001", env: { NODE_ENV: "production" } },
    { name: "omkoora-team", cwd: "${TEAM_ROOT}/client/team", script: "node_modules/next/dist/bin/next", args: "start -p 3008", env: { NODE_ENV: "production" } },
    { name: "omkoora-plyer", cwd: "${PLYER_ROOT}/client/plyer", script: "node_modules/next/dist/bin/next", args: "start -p 30010", env: { NODE_ENV: "production" } },
    { name: "omkoora-super-admin", cwd: "${SUPER_ADMIN_ROOT}/client/super-admin", script: "node_modules/next/dist/bin/next", args: "start -p 3006", env: { NODE_ENV: "production" } }
  ]
};
PM2

cd "${CLUB_ROOT}/client/club"
npm ci
npm run build

cd "${TEAM_ROOT}/client/team"
npm ci
npm run build

cd "${PLYER_ROOT}/client/plyer"
npm ci
npm run build

cd "${SUPER_ADMIN_ROOT}/client/super-admin"
npm ci
npm run build

pm2 reload "/home/${USER_NAME}/web/pm2/ecosystem.omkoora.cjs" || pm2 start "/home/${USER_NAME}/web/pm2/ecosystem.omkoora.cjs"
pm2 save

# ==========================================================
# 8) STATIC FRONTENDS
# ==========================================================
cd "${LANDING_PAGE_ROOT}/client/landing-page"
npm ci
npm run build

cd "${SPORTS_COURSE_ROOT}/client/sports-course"
npm ci
npm run build

# ==========================================================
# 9) APACHE CONFIG - PROXY APPS
# ==========================================================
cat > "${BACKEND_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes
RewriteEngine On
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^(.*)$ ws://127.0.0.1:7001/$1 [P,L]
RewriteRule ^(.*)$ http://127.0.0.1:7001/$1 [P,L,QSA]
HTACCESS

cat > "${CLUB_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L,QSA]
HTACCESS

cat > "${TEAM_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3008/$1 [P,L,QSA]
HTACCESS

cat > "${PLYER_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:30010/$1 [P,L,QSA]
HTACCESS

cat > "${SUPER_ADMIN_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3006/$1 [P,L,QSA]
HTACCESS

# ==========================================================
# 10) APACHE CONFIG - STATIC APPS
# ==========================================================
cat > "${LANDING_PAGE_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes +FollowSymLinks
DirectoryIndex client/landing-page/out/index.html
RewriteEngine On
RewriteRule ^_next/(.*)$ client/landing-page/out/_next/$1 [L,NC,QSA]
RewriteCond %{DOCUMENT_ROOT}/client/landing-page/out%{REQUEST_URI} -f
RewriteRule ^(.*)$ client/landing-page/out/$1 [L,QSA]
RewriteCond %{DOCUMENT_ROOT}/client/landing-page/out%{REQUEST_URI}/index.html -f
RewriteRule ^(.+?)/?$ client/landing-page/out/$1/index.html [L,QSA]
RewriteCond %{DOCUMENT_ROOT}/client/landing-page/out%{REQUEST_URI}.html -f
RewriteRule ^(.+)$ client/landing-page/out/$1.html [L,QSA]
RewriteRule ^ client/landing-page/out/index.html [L]
AddType text/javascript .js
AddType text/css .css
AddType text/html .html
HTACCESS

cat > "${SPORTS_COURSE_ROOT}/.htaccess" <<'HTACCESS'
Options -Indexes +FollowSymLinks
DirectoryIndex client/sports-course/dist/index.html
RewriteEngine On
RewriteRule ^assets/(.*)$ client/sports-course/dist/assets/$1 [L,NC,QSA]
RewriteCond %{DOCUMENT_ROOT}/client/sports-course/dist%{REQUEST_URI} -f
RewriteRule ^(.*)$ client/sports-course/dist/$1 [L,QSA]
RewriteRule ^ client/sports-course/dist/index.html [L]
AddType text/javascript .js
AddType text/css .css
AddType text/html .html
HTACCESS

# ==========================================================
# DONE
# ==========================================================
echo "DEPLOY FINISHED"
echo "Backend: https://${BACKEND_DOMAIN}"
echo "Club: https://${CLUB_DOMAIN}"
echo "Team: https://${TEAM_DOMAIN}"
echo "Plyer: https://${PLYER_DOMAIN}"
echo "Super Admin: https://${SUPER_ADMIN_DOMAIN}"
echo "Landing Page: https://${LANDING_PAGE_DOMAIN}"
echo "Sports Course: https://${SPORTS_COURSE_DOMAIN}"

