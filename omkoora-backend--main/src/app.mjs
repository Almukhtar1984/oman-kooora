// Import all dependencies
import express from 'express';
import cors from "cors";
import {createServer} from "http";
import path from "path";
import { promises as fsPromises } from "fs";
import sharp from "sharp";
import {fileURLToPath} from 'url';
import cookieParser from "cookie-parser";
import { express as expressUserAgent } from 'express-useragent';
import helmet from "helmet";
import dotenv from 'dotenv'
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPluginLandingPageDisabled,
    ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core';

import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs"

import DB from './Config/DBContact.mjs';
import Schema from "./Graphql/index.mjs"
import {AuthMiddleware } from "./Middlewares/index.mjs"
import logger from "./Config/logger.mjs"
import {initializeSocketServer} from "./Socket/index.mjs"
import './Schedule/index.mjs'; // Add this line to include the cron job
import LoggingPlugin from './ApolloPlugin/LoggingPlugin.mjs'
import { buildLoaders } from './Helpers/loaders.mjs'
import {
    corsOptionsDelegate,
    isAllowedOrigin,
    isProduction,
    shouldEnableGraphqlTools,
    shouldLogRequestContext,
    getAppKeyFromOrigin,
    refreshCookieName,
    LEGACY_REFRESH_COOKIE,
} from './Config/runtime.mjs';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const httpServer = createServer(app);

let socket = null;

(async function () {
    try {
        const PORT = process.env.PORT || 8000;

        // Start Server here immediately to avoid 502 errors during long startup tasks
        httpServer.listen(PORT, "0.0.0.0", () => {
            console.info(`Server is starting and listening on port ${PORT}`);
        });

        // Middlewares
        app.use( cors(corsOptionsDelegate) );
        
        app.use(cookieParser())
        app.use(expressUserAgent());

        // Uploaded photos are stored raw — often multi-MB *progressive* JPEGs
        // (phone/WhatsApp defaults). @react-pdf/renderer (pdfkit) can only decode
        // *baseline* JPEGs, so the print app's player photos rendered blank while
        // small baseline logos rendered fine. When the print app requests a size
        // (?w=&h=) we transcode on the fly via sharp to a downscaled, EXIF-rotated
        // *baseline* JPEG and cache it on disk, so react-pdf always gets a photo it
        // can render (and the payload shrinks ~10x for large leagues). Requests
        // without ?w fall through to the untouched static serving below.
        const IMAGES_DIR = path.join(__dirname, '../uploads');
        const PRINT_CACHE = path.join(IMAGES_DIR, '.print-cache');
        const printResize = async (req, res, next) => {
            const w = parseInt(req.query.w, 10);
            if (!w) return next();
            const h = parseInt(req.query.h, 10) || null;
            let rel;
            try { rel = decodeURIComponent(req.path.replace(/^\/+/, '')); }
            catch { return next(); }
            if (!rel || rel.includes('/') || rel.includes('..')) return next();
            const ext = rel.split('.').pop().toUpperCase();
            if (!['JPEG', 'JPG', 'PNG'].includes(ext)) return next();
            const cachePath = path.join(PRINT_CACHE, `${w}x${h || 'auto'}-${rel}.jpg`);
            try {
                await fsPromises.access(cachePath);
            } catch {
                try {
                    await fsPromises.mkdir(PRINT_CACHE, { recursive: true });
                    await sharp(path.join(IMAGES_DIR, rel))
                        .rotate()
                        .resize(w, h, { fit: 'inside', withoutEnlargement: true })
                        // NB: do NOT enable mozjpeg — its preset turns on
                        // optimiseScans, which forces *progressive* output and
                        // defeats the whole purpose (react-pdf needs baseline).
                        .jpeg({ progressive: false, quality: 82 })
                        .toFile(cachePath);
                } catch {
                    return next(); // source missing / undecodable → static → 404
                }
            }
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
            res.type('jpeg');
            return res.sendFile(cachePath);
        };

        app.use(
            '/images',
            printResize,
            express.static(IMAGES_DIR, {
                maxAge: '30d',
                immutable: true,
                etag: true,
                lastModified: true,
                setHeaders: (res) => {
                    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
                },
            }),
            // Static miss (renamed / missing / case-mismatch): return 404. The old
            // handler redirected to the same absolute URL, causing an infinite
            // redirect loop that also blanked the card and hung the fetch.
            (req, res) => {
                res.status(404).end();
            },
        );
        app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });

        app.use(express.urlencoded({
            extended: true,
            limit: process.env.URLENCODED_BODY_LIMIT || '2mb',
        }));
        app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
        app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

        app.use(AuthMiddleware)

        
        const apolloServer = new ApolloServer({
            schema: Schema,
            tracing: false,
            playground: shouldEnableGraphqlTools,
            introspection: shouldEnableGraphqlTools,
            debug: !isProduction,
            formatError: (formattedError) => {
                // Log the full error server-side for diagnostics regardless of env.
                logger.error(`GraphQL error: ${formattedError.message}`);

                if (!isProduction) {
                    return formattedError;
                }

                // Client-safe errors carry an explicit, non-internal code:
                // auth failures (UNAUTHENTICATED), validation, and the app's own
                // coded ApolloErrors (e.g. LEAGUE_ENDED, EMAIL_REQUIRED).
                const code = formattedError.extensions?.code;
                if (code && code !== 'INTERNAL_SERVER_ERROR') {
                    return formattedError;
                }

                // Mask everything else. Most resolvers do `throw new ApolloError(error)`,
                // which would otherwise leak raw error messages / internals to clients.
                return {
                    message: 'Internal server error',
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                };
            },
            csrfPrevention: true,
            allowBatchedHttpRequests: false,
            // validationRules: [
            //     depthLimit(5)
            // ],
            plugins: [
                shouldEnableGraphqlTools
                    ? ApolloServerPluginLandingPageGraphQLPlayground({ settings: { 'request.credentials': 'include' } })
                    : ApolloServerPluginLandingPageDisabled(),
                LoggingPlugin
            ],
            persistedQueries: false,
            context: ({ req, res }) => {
                let {user, isAuth } = req;
                const origin = req.header('Origin');
                const appKey = getAppKeyFromOrigin(origin);
                const cookieName = refreshCookieName(appKey);

                if (shouldLogRequestContext) {
                    logger.info(`Request origin: ${origin || 'none'}, app: ${appKey}, hasRefreshCookie: ${Boolean(req.cookies?.[cookieName])}`);
                }

                if (origin && isAllowedOrigin(origin)) {
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    if (res.getHeader('access-control-allow-origin') === '*') {
                        res.setHeader('access-control-allow-origin', origin);
                    }
                }
                // Each app reads ONLY its own per-origin cookie. The legacy
                // shared cookie is intentionally ignored — honoring it would
                // recreate the cross-app SSO bug we just fixed for any
                // browser that still carries a pre-split __tomoh.
                let refreshToken = req.cookies[cookieName];

                // Per-request DataLoaders. Field resolvers should call
                // context.loaders.<name>.load(id) instead of Model.findByPk
                // to batch lookups across all rows in the same response.
                const loaders = buildLoaders();

                return { res, req, user, isAuth, refreshToken, loaders, appKey, origin };
            }
        });

        await apolloServer.start();

        app.use(graphqlUploadExpress({
            maxFileSize: 10000000, // 10 MB
            maxFiles: 10,
            maxFieldSize: 10000000 // 10 MB
        }));

        apolloServer.applyMiddleware({ app, path: apolloServer.graphqlPath });

        try {
            await DB.authenticate();
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            logger.error(`Database connection failed: ${error.message}`);
        }

        try {
            socket = initializeSocketServer(httpServer);
            await socket.connection();
        } catch (error) {
            console.error('socket server error:', error);
            logger.error(`Socket server error: ${error.message}`);
        }
        console.info(`Server initialization sequence completed.`);
    } catch (err) {
        console.error("FATAL ERROR DURING STARTUP:", err);
        if (logger) logger.error(`FATAL STARTUP ERROR: ${err.stack}`);
        process.exit(1);
    }
})();

export {socket}
