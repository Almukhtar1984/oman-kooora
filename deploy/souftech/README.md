# Souftech Hestia Deploy Notes

هذه الخطة تعتمد على الملفات الجديدة فقط:

- `client/club`
- `client/team`
- `client/plyer`
- `client/super-admin`
- `client/landing-page`
- `client/sports-course`
- `server`

ولا تعتمد على النسخ القديمة:

- `client/omkoora-club--main`
- `client/omkoora-team--main`
- `omkoora-backend--main`

## Domain Mapping

| Domain | Project path | Type | Build/Run | Access file |
| --- | --- | --- | --- | --- |
| `omkoora-backend.souftech.com` | `server` | Node Apollo/Express | PM2 port `7001` | `htaccess/omkoora-backend.souftech.com.htaccess` |
| `omkoora-club.souftech.com` | `client/club` | Next.js SSR | PM2 port `3001` | `htaccess/omkoora-club.souftech.com.htaccess` |
| `omkoora-team.souftech.com` | `client/team` | Next.js SSR | PM2 port `3008` | `htaccess/omkoora-team.souftech.com.htaccess` |
| `omkoora-plyer.souftech.com` | `client/plyer` | Next.js SSR | PM2 port `30010` | `htaccess/omkoora-plyer.souftech.com.htaccess` |
| `omkoora-super-admin.souftech.com` | `client/super-admin` | Next.js SSR | PM2 port `3006` | `htaccess/omkoora-super-admin.souftech.com.htaccess` |
| `omkoora-landing-page.souftech.com` | `client/landing-page` | Next.js static export | Apache static from `out` | `htaccess/omkoora-landing-page.souftech.com.htaccess` |
| `omkoora-sports-course.souftech.com` | `client/sports-course` | Vite static SPA | Apache static from `dist` | `htaccess/omkoora-sports-course.souftech.com.htaccess` |

## Important Hestia Note

Next.js SSR and the backend cannot be served by a normal static `.htaccess` alone. They must run as Node processes with PM2, then Apache/Hestia proxies the domain to the local port.

The proxy `.htaccess` files require Apache modules:

- `mod_rewrite`
- `mod_proxy`
- `mod_proxy_http`
- `mod_proxy_wstunnel`

If `[P]` proxy rules are disabled in your Hestia/Apache setup, use a Hestia/Nginx proxy template instead and point each domain to the same local port listed above.

## Sparse Checkout Paths

Use these paths when pulling from GitHub:

```bash
client/club/
client/team/
client/plyer/
client/super-admin/
client/landing-page/
client/sports-course/
server/
```

Example for one domain:

```bash
cd /home/user/web/omkoora-club.souftech.com/public_html
rm -rf .git
git init
git remote add origin git@github.com:USERNAME/REPO.git
git config core.sparseCheckout true
echo "client/club/" > .git/info/sparse-checkout
git fetch origin main
git checkout main
```

Repeat with the correct project path for each domain.

## Backend Deploy

```bash
cd /home/user/web/omkoora-backend.souftech.com/public_html/server
npm ci --include=dev
cp .env.example .env
# edit .env using env/backend.production.example
npm run db:migrate
pm2 start /home/user/web/pm2/ecosystem.souftech.cjs --only omkoora-backend --env production
pm2 save
```

Backend production env must include:

```env
NODE_ENV=production
PORT=7001
API_URL=https://omkoora-backend.souftech.com
TRUST_PROXY=true
CLIENT_ORIGINS=https://omkoora-club.souftech.com,https://omkoora-team.souftech.com,https://omkoora-plyer.souftech.com,https://omkoora-super-admin.souftech.com,https://omkoora-sports-course.souftech.com,https://omkoora-landing-page.souftech.com
```

## Next.js SSR Frontends

Use this for:

- `client/club`
- `client/team`
- `client/plyer`
- `client/super-admin`

Example:

```bash
cd /home/user/web/omkoora-club.souftech.com/public_html/client/club
cp .env.example .env.production
# edit .env.production using env/frontend-next.production.example
npm ci
npm run build
pm2 start /home/user/web/pm2/ecosystem.souftech.cjs --only omkoora-club --env production
pm2 save
```

## Static Frontends

Landing page:

```bash
cd /home/user/web/omkoora-landing-page.souftech.com/public_html/client/landing-page
cp .env.example .env.production
npm ci
npm run build
```

Sports course:

```bash
cd /home/user/web/omkoora-sports-course.souftech.com/public_html/client/sports-course
cp .env.example .env.production
npm ci
npm run build
```

Then copy the matching `.htaccess` file from `deploy/souftech/htaccess` into the domain `public_html/.htaccess`.

