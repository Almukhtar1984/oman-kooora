import jwt from 'jsonwebtoken';
import { User } from '../Models/index.mjs';
import {serializeUser} from "../Helpers/index.mjs";
import dotenv from 'dotenv'
dotenv.config();

const SECRET = process.env.SECRET_JWT

export const AuthMiddlewareSocket = async (auth) => {

    // Extract Authorization Header
    const authSocket = auth;

    if (!authSocket) {
        return {isAuth: false};
    }


    // Accept both "Bearer <token>" and raw token values from socket clients.
    const token = authSocket.startsWith("Bearer ")
        ? authSocket.slice(7).trim()
        : authSocket.trim();

    if (!token || token === "") {
        return {isAuth: false};
    }

    // Verify the extracted token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, SECRET);
    } catch (err) {
        return {isAuth: false};
    }

    // If decoded token is null then set authentication of the request false
    if (!decodedToken) {
        return {isAuth: false};
    }

    // If the user has valid token then Find the user by decoded token's id
    let authUser = await User.findByPk(decodedToken.id);
    if (!authUser) {
        return {isAuth: false};
    }

    const user = serializeUser(authUser)

    //await AuthTrace.create({token : token, user_name: decodedToken.user_name, action: "Token Checked" })

    return {
        isAuth: true,
        user: authUser
    };
}
