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
import {buildGraphqlValidationRules} from "./Graphql/ValidationRules.mjs";
import {AuthMiddleware} from "./Middlewares/index.mjs"
import {graphqlSensitiveRateLimit} from "./Middlewares/GraphqlRateLimit.mjs"
import {privateUploadFileMiddleware} from "./Middlewares/PrivateFiles.mjs"
import {publicUploadImageMiddleware} from "./Middlewares/PublicImages.mjs"
import logger from "./Config/logger.mjs"
import {socketServer} from "./Socket/index.mjs"

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const httpServer = createServer(app);
const isProduction = process.env.NODE_ENV === 'production';

if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}

let socket = null;

const defaultWhitelist = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3006",
    "http://localhost:3008",
    "http://localhost:3010",
    "http://localhost:3012"
];

(async function () {
    let whitelist = process.env.CLIENT_ORIGINS
        ? process.env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
        : defaultWhitelist;

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

    app.get('/images/:filename', publicUploadImageMiddleware())
    app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_BODY_LIMIT || "1mb" }));
    app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT || "1mb" }));
    app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

    app.use(AuthMiddleware)
    app.get("/files/:filename", privateUploadFileMiddleware())
    app.use("/graphql", graphqlSensitiveRateLimit())

    const apolloServer = new ApolloServer({
        schema: Schema,
        tracing: false,
        playground: !isProduction,
        introspection: !isProduction,
        debug: !isProduction,
        csrfPrevention: true,
        allowBatchedHttpRequests: false,
        validationRules: buildGraphqlValidationRules(),
        plugins: [
            isProduction
                ? ApolloServerPluginLandingPageDisabled()
                : ApolloServerPluginLandingPageGraphQLPlayground({ settings: { 'request.credentials': 'include' } }),
        ],
        persistedQueries: false,
        context: ({ req, res }) => {
            let {user, isAuth } = req;

            if (whitelist.indexOf(req.header('Origin')) !== -1) {
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

    apolloServer.applyMiddleware({ app, path: apolloServer.graphqlPath, cors: false });

    try {
        await DB.authenticate();
        logger.info("Database connection established");
    } catch (error) {
        logger.error("Unable to connect to the database");
    }

    try {
        socket = new socketServer(httpServer)
        await socket.connection()
    }  catch (error) {
        logger.error("Socket server initialization failed");
    }

    // set port, listen for requests
    const PORT = process.env.PORT;

    // Start Server here
    httpServer.listen(PORT,() => {
        logger.info(`Server is running on http://localhost:${PORT}${apolloServer.graphqlPath}`)
    });
})();

export {socket}
