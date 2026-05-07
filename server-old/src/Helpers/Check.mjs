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
        if (!userAgent || !tokenAgent || userAgent === "" || tokenAgent === "") return null

        let useragent = `${userAgent.browser}: ${userAgent.version}, ${userAgent.platform}: ${userAgent.os}, ${userAgent.source}`

        if (useragent !== tokenAgent) return null
        else return true
    } catch (error) {
        return new ApolloError(error)
    }
}