import jwt from 'jsonwebtoken';
import { User } from '../Models/index.mjs';
import dotenv from 'dotenv'
import {serializeUser} from "../Helpers/index.mjs";
import { getAppKeyFromOrigin } from "../Config/runtime.mjs";
dotenv.config();

const SECRET = process.env.SECRET_JWT

export const AuthMiddleware = async (req, res, next) => {
    // Extract Authorization Header
    const authHeader = req.get("Authorization");

    if (!authHeader) {
        req.isAuth = false;
        return next();
    }

    // Accept both "Bearer <token>" and raw token headers for older clients.
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();

    if (!token || token === "") {
        req.isAuth = false;
        return next();
    }

    // Verify the extracted token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, SECRET);
    } catch (err) {
        req.isAuth = false;
        return next();
    }

    // If decoded token is null then set authentication of the request false
    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }

    // Reject a token that was issued for a different frontend. Tokens minted
    // before the per-app split have no `aud` and are accepted until they
    // expire on their own.
    if (decodedToken.aud) {
        const appKey = getAppKeyFromOrigin(req.header('Origin'));
        if (decodedToken.aud !== appKey) {
            req.isAuth = false;
            return next();
        }
    }

    // If the user has valid token then Find the user by decoded token's id
    let authUser = await User.findByPk(decodedToken.id);
    if (!authUser) {
        req.isAuth = false;
        return next();
    }

    const user = serializeUser(authUser)

    req.isAuth = true;
    req.user = user;
    return next();
}
