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

// Map every known origin to a stable per-app key so each frontend gets its own
// refresh cookie + JWT audience. Adding a new app requires one entry here.
const appOrigins = {
    club: [
        'https://club.omkooora.com',
        'https://omkoora-club.souftech.com',
        'https://clubv2.smsoma.com',
        'https://omkoora-club-production.up.railway.app',
        'http://localhost:3001',
        'http://localhost:3050',
    ],
    team: [
        'https://team.omkooora.com',
        'https://omkoora-team.souftech.com',
        'http://localhost:3002',
        'http://localhost:3053',
    ],
    admin: [
        'https://super-admin.omkooora.com',
        'https://omkoora-super-admin.souftech.com',
        'http://localhost:3000',
        'http://localhost:3006',
        'http://localhost:3052',
    ],
    player: [
        'https://player.omkooora.com',
        'https://omkoora-plyer.souftech.com',
        'http://localhost:3003',
        'http://localhost:3054',
    ],
    league: [
        'https://league.omkooora.com',
    ],
    print: [
        'https://print.omkooora.com',
    ],
    landing: [
        'https://omkooora.com',
        'https://news.omkooora.com',
        'https://omkoora-landing-page.souftech.com',
    ],
};

const originToApp = new Map();
for (const [app, origins] of Object.entries(appOrigins)) {
    for (const origin of origins) {
        originToApp.set(origin, app);
    }
}

// Used when no Origin header is present (curl, GraphQL Playground, server-to-server).
// Issuing under a dedicated key keeps these sessions from colliding with real apps.
const FALLBACK_APP_KEY = 'default';

export const ALL_APP_KEYS = [...Object.keys(appOrigins), FALLBACK_APP_KEY];

export const getAppKeyFromOrigin = (origin) => {
    if (!origin) return FALLBACK_APP_KEY;
    return originToApp.get(origin) || FALLBACK_APP_KEY;
};

export const refreshCookieName = (appKey) => `__tomoh_${appKey || FALLBACK_APP_KEY}`;

// Legacy cookie kept so we can clear it on the user's next visit and avoid
// a stale shared session lingering after the per-app split is deployed.
export const LEGACY_REFRESH_COOKIE = '__tomoh';

// Defaults are intentionally generous: the client wants users to stay signed
// in across reloads and long breaks. The frontend schedules a proactive
// refresh well before access-token expiry, so an explicit logout still
// propagates within seconds (server-side cookie clear + client-side wipe).
export const ACCESS_TOKEN_HOURS = Number(process.env.ACCESS_TOKEN_HOURS || 24 * 7);

export const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 90);

export const refreshCookieOptions = {
    maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE_MS || 3600000 * 24 * REFRESH_TOKEN_DAYS),
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
