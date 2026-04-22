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
import {AuthMiddleware} from "./Middlewares/index.mjs"
import logger from "./Config/logger.mjs"
import {socketServer} from "./Socket/index.mjs"

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const httpServer = createServer(app);

let socket = null;

const defaultWhitelist = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004"
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

    app.use('/images', express.static(path.join(__dirname, '../uploads')))
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
            process.env.NODE_ENV === 'production'
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

    apolloServer.applyMiddleware({ app, path: apolloServer.graphqlPath });

    try {
        await DB.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    try {
        socket = new socketServer(httpServer)
        await socket.connection()
    }  catch (error) {
        console.error('socket server error:', error);
    }

    // set port, listen for requests
    const PORT = process.env.PORT;

    // Start Server here
    httpServer.listen(PORT,() => {
        console.info(`Server is running is http://localhost:${PORT}${apolloServer.graphqlPath}`)
    });
})();

export {socket}
