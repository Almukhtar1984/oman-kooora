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

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

let socket = null;

(async function () {
    try {
        const PORT = process.env.PORT || 8000;

        // Start Server here immediately to avoid 502 errors during long startup tasks
        httpServer.listen(PORT, "0.0.0.0", () => {
            console.info(`Server is starting and listening on port ${PORT}`);
        });

        let whitelist = [
            "https://player.omkooora.com",
            "https://team.omkooora.com",
            "https://club.omkooora.com",
            "https://super-admin.omkooora.com",
            "https://omkooora.com",
            "https://print.omkooora.com",
            "https://league.omkooora.com",
            
            "https://news.omkooora.com",
            "http://localhost:3000",
            'http://localhost:3001',
            'http://localhost:3006',

            'https://clubv2.smsoma.com',
            'https://omkoora-club-production.up.railway.app',
            'https://reservation-accommodations-theatre-text.trycloudflare.com',
            'https://holds-dive-seventh-teaching.trycloudflare.com'

            
            
        ]

        let corsOptionsDelegate = function (req, callback) {
            let corsOptions;

            if (whitelist.indexOf(req.header('Origin')) !== -1) {
                corsOptions = {origin: req.header('Origin'), credentials: true}
            } else {
                corsOptions = { origin: false, credentials: false }
            }

            callback(null, corsOptions)
        }

        // Middlewares
        app.use( cors(corsOptionsDelegate) );
        
        app.use(cookieParser())
        app.use(expressUserAgent());

        app.use('/images', express.static(path.join(__dirname, '../uploads')), (req, res) => {
            // Fallback: If image not found locally, redirect to production
            res.redirect(`https://api.omkooora.com/images${req.url}`);
        });
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(helmet({ contentSecurityPolicy: (process.env.NODE_ENV === 'production') ? undefined : false }));

        app.use(AuthMiddleware)

        
        const apolloServer = new ApolloServer({
            schema: Schema,
            tracing: false,
            playground: true,
            introspection: true,
            debug: true,
            csrfPrevention: true,
            allowBatchedHttpRequests: false,
            // validationRules: [
            //     depthLimit(5)
            // ],
            plugins: [
                //process.env.NODE_ENV === 'production'
                    //? ApolloServerPluginLandingPageDisabled()
                    //: ApolloServerPluginLandingPageGraphQLPlayground({ settings: { 'request.credentials': 'include' } }),
                    ApolloServerPluginLandingPageGraphQLPlayground({ settings: { 'request.credentials': 'include' } }),
                    LoggingPlugin
            ],
            persistedQueries: false,
            context: ({ req, res }) => {
                let {user, isAuth } = req;

                logger.info(`DEBUG: Request Origin: ${req.header('Origin')}`);
                logger.info(`DEBUG: Request Cookies: ${JSON.stringify(req.cookies)}`);

                if (whitelist.indexOf(req.header('Origin')) !== -1) {
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    if (res.getHeader('access-control-allow-origin') === '*') {
                        res.setHeader('access-control-allow-origin', req.header('Origin'));
                    }
                }
                let refreshToken = req.cookies["__tomoh"];

                return { res, req, user, isAuth, refreshToken };
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
            const socket = initializeSocketServer(httpServer);
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