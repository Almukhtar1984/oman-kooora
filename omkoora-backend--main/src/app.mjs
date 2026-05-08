// Import all dependencies
import express from 'express';
import cors from "cors";
import {createServer} from "http";
import path from "path";
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

        app.use('/images', express.static(path.join(__dirname, '../uploads')), (req, res) => {
            // Fallback: If image not found locally, redirect to production
            res.redirect(`https://api.omkooora.com/images${req.url}`);
        });
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

                if (shouldLogRequestContext) {
                    logger.info(`Request origin: ${origin || 'none'}, hasRefreshCookie: ${Boolean(req.cookies?.__tomoh)}`);
                }

                if (origin && isAllowedOrigin(origin)) {
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    if (res.getHeader('access-control-allow-origin') === '*') {
                        res.setHeader('access-control-allow-origin', origin);
                    }
                }
                let refreshToken = req.cookies["__tomoh"];

                // Per-request DataLoaders. Field resolvers should call
                // context.loaders.<name>.load(id) instead of Model.findByPk
                // to batch lookups across all rows in the same response.
                const loaders = buildLoaders();

                return { res, req, user, isAuth, refreshToken, loaders };
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
