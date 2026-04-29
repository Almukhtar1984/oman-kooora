import {ApolloError} from "apollo-server-express";
import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        return new ApolloError(error)
    }
}

export const comparePassword = async (password, hash) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        return new ApolloError(error)
    }
}