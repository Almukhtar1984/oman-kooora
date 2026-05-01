import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const isProduction = NODE_ENV === 'production';

const splitList = (value = '') => value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const defaultAllowedOrigins = [
    'https://player.omkooora.com',
    'https://team.omkooora.com',
    'https://club.omkooora.com',
    'https://super-admin.omkooora.com',
    'https://omkooora.com',
    'https://print.omkooora.com',
    'https://league.omkooora.com',
    'https://news.omkooora.com',
    'https://omkoora-backend.souftech.com',
    'https://omkoora-club.souftech.com',
    'https://omkoora-team.souftech.com',
    'https://omkoora-plyer.souftech.com',
    'https://omkoora-super-admin.souftech.com',
    'https://omkoora-sports-course.souftech.com',
    'https://omkoora-landing-page.souftech.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3006',
    'http://localhost:7001',
    'https://clubv2.smsoma.com',
    'https://omkoora-club-production.up.railway.app',
    'https://reservation-accommodations-theatre-text.trycloudflare.com',
    'https://holds-dive-seventh-teaching.trycloudflare.com',
];

const envOrigins = [
    process.env.ADMIN_URL,
    process.env.EMPLOYEE_URL,
    process.env.SUPERVISOR_URL,
    process.env.CUSTOMER_URL,
    ...splitList(process.env.CORS_ORIGINS),
];

export const allowedOrigins = [...new Set([
    ...defaultAllowedOrigins,
    ...envOrigins.filter(Boolean),
])];

export const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);

export const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');

    if (isAllowedOrigin(origin)) {
        callback(null, {
            origin: origin || false,
            credentials: Boolean(origin),
        });
        return;
    }

    callback(null, {
        origin: false,
        credentials: false,
    });
};

export const refreshCookieOptions = {
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE_MS || 3600000 * 24 * 7),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
};

export const shouldSyncDb = process.env.DB_SYNC === 'true';

export const dbSyncOptions = {
    alter: process.env.DB_SYNC_ALTER === 'true',
    force: process.env.DB_SYNC_FORCE === 'true',
};

export const shouldLogRequestContext = process.env.LOG_REQUEST_CONTEXT === 'true';
export const shouldEnableActionLogging = process.env.ACTION_LOGGING_ENABLED !== 'false';

export const shouldEnableGraphqlTools =
    !isProduction || process.env.GRAPHQL_TOOLS === 'true';
