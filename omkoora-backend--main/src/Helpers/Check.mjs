import {User } from "../Models/index.mjs";
import {ApolloError, AuthenticationError} from "apollo-server-express";
import sequelize from "sequelize";

const {Op} = sequelize;

export const isExistUser = async (id) => {
    try {
        if (!id) return false

        const user = await User.findByPk(id)

        if (user) return user
        else return false
    } catch (error) {
        return new ApolloError(error)
    }
}

export const alreadyExistUser = async (email) => {
    try {
        const user = await User.findOne({
            where: {
                email
            }
        })

        if (user) {
            if (user.email === email) return {"message": "email already exists", "code": "EMAIL_ALREADY_EXIST"}
        }
        else return false
    } catch (error) {
        return new ApolloError(error)
    }
}

export const sameUserAgent = (tokenAgent, userAgent) => {
    try {
        if (!userAgent || !tokenAgent || userAgent === "" || tokenAgent === "") return true

        // Only compare browser + OS for stability in production (version/source can vary)
        const currentAgent = `${userAgent.browser}: ${userAgent.os}`

        // Check if the stored token agent starts with the same browser+OS prefix
        if (!tokenAgent.startsWith(currentAgent)) return null
        else return true
    } catch (error) {
        return true // fail open to avoid locking out valid users
    }
}
