import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, ClubManagement, Members, Person, Team, User,} from '../../Models/index.mjs';
import {assertSuperAdmin} from "../../Helpers/Authorization.mjs";
import {saveImageUpload} from "../../Helpers/Upload.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        club: async (obj, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allClub: async (obj, {}, context, info) =>  {
            try {
                return await Club.findAll()
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Club: {
        admin: async ({id}, {}, context, info) =>  {
            try {
                return await User.findOne({
                    include: {
                        model: Person,
                        as: "person",
                        required: true,
                        right: true,
                        include: {
                            model: ClubManagement,
                            as: "club_management",
                            required: true,
                            right: true,
                            where: {
                                id_club: id
                            }
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        teams: async ({id}, {}, context, info) =>  {
            try {
                return await Team.findAll({
                    where: {
                        id_club: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createClub: async (obj, {content}, context, info) =>  {
            try {
                assertSuperAdmin(context);

                let club = await Club.create({
                    name:           content.name,
                    governorate:    content.governorate,
                    phone:          content.phone
                })
                let imgUniqName = "";

                if (club && content.logo) {
                    imgUniqName = await saveImageUpload(content.logo);
                    await Club.update({logo: imgUniqName}, { where: { id: club.id } })
                }

                return {
                    ...club.dataValues,
                    logo: imgUniqName
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        updateClub: async (obj, {id, content}, context, info) =>  {
            try {
                assertSuperAdmin(context);

                let result = null;

                if (content.account_status !== null && content.account_status !== undefined) {
                    result = await Club.update({
                        name:           content.name,
                        governorate:    content.governorate,
                        phone:          content.phone,
                        account_status: content.account_status
                    }, { where: { id } })
                } else {
                    result = await Club.update({
                        name:           content.name,
                        governorate:    content.governorate,
                        phone:          content.phone
                    }, { where: { id } })
                }

                if (content && "logo" in content && content.logo) {
                    const imgUniqName = await saveImageUpload(content.logo);
                    await Club.update({logo: imgUniqName}, { where: { id } })
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("Unable to create club")
                throw new ApolloError(error)
            }
        },

        deleteClub: async (obj, {id}, context, info) =>  {
            try {
                assertSuperAdmin(context);

                const club = await Club.destroy({ where: { id } })

                return {
                    status: club === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },
    }
}
