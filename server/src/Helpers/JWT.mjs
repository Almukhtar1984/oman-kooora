import jwt from 'jsonwebtoken';
import lodash from 'lodash';
import dotenv from 'dotenv'
import {AuthenticationError} from "apollo-server-express";
dotenv.config();

const SECRET_JWT = process.env.SECRET_JWT
const { pick } = lodash;
const { sign, verify } = jwt;

export const AuthToken = async (payload, expires) => {
    const expiresIn = expires || 1
    let token = await jwt.sign(payload, SECRET_JWT, {
        expiresIn: 3600*expiresIn
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

export const RefreshToken = async (payload, expires = 7) => {
    let useragent = `${payload.useragent.browser}: ${payload.useragent.version}, ${payload.useragent.platform}: ${payload.useragent.os}, ${payload.useragent.source}`

    return await sign({...payload, useragent}, SECRET_JWT, {
        expiresIn: 3600*24*expires
    });
}
