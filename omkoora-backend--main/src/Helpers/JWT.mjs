import jwt from 'jsonwebtoken';
import lodash from 'lodash';
import dotenv from 'dotenv'
import {AuthenticationError} from "apollo-server-express";
import { ACCESS_TOKEN_HOURS, REFRESH_TOKEN_DAYS } from "../Config/runtime.mjs";
dotenv.config();

const SECRET_JWT = process.env.SECRET_JWT
const { pick } = lodash;
const { sign, verify } = jwt;

// `appKey` is embedded as the JWT audience so AuthMiddleware can reject a
// token presented from a different frontend than the one it was issued for.
export const AuthToken = async (payload, expiresHours, appKey) => {
    const hours = expiresHours || ACCESS_TOKEN_HOURS
    const claims = appKey ? { ...payload, aud: appKey } : payload;
    let token = await jwt.sign(claims, SECRET_JWT, {
        expiresIn: Math.round(3600 * hours)
    });
    return `Bearer ${token}`;
};

export const VerifyToken = async (token) => {
    let decodedToken;
    try {
        decodedToken = await verify(token, SECRET_JWT);
    } catch (err) {
        return null
    }

    return decodedToken;
};

export const serializeUser = (user) => pick(user, [
    'id',
    'email',
    'role',
    'role',
    'activation',
    'email_verify',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'id_person'
]);

export const RefreshToken = async (payload, appKey) => {
    let useragent = `${payload.useragent.browser}: ${payload.useragent.version}, ${payload.useragent.platform}: ${payload.useragent.os}, ${payload.useragent.source}`
    const claims = appKey
        ? { ...payload, useragent, aud: appKey }
        : { ...payload, useragent };

    return await sign(claims, SECRET_JWT, {
        expiresIn: 3600 * 24 * REFRESH_TOKEN_DAYS
    });
}