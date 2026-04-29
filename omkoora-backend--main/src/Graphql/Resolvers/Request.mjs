import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Request, Players, Team,Person} from '../../Models/index.mjs';


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        request: async (obj, {id}, context, info) =>  {
            try {
                return await Request.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allRequests: async (obj, {idPlayer, type}, context, info) =>  {
            try {
                return await Request.findAll({
                    where: {
                        id_player: idPlayer,
                        type
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        
        allRequestsTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Request.findAll({
                    include: {
                        model: Players,
                        as: "player",
                        required: true,
                        right: true,
                        where: {
                            id_team: idTeam
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        authexternal: async (obj, {CardNumber,phoneNumber}, context, info) =>  {

            try {

                // Step 1: Find the person using cardNumber and phoneNumber
                const person = await Person.findOne({
                    where: {
                        card_number: CardNumber,
                        phone: phoneNumber
                    }
                });
        
                if (!person) {
                    throw new Error('Person not found');
                }
        
                // Step 2: Find the player using the person's ID
                const player = await Players.findOne({
                    where: {
                        id_person: person.id
                    }
                });
        
                if (!player) {
                    throw new Error('Player not found');
                }
        
                return player;
            } catch (error) {
                throw new Error(error.message);
            }
        }
    },

    Request: {
        player: async ({id_player}, {id}, context, info) =>  {
            try {
                return await Players.findByPk(id_player)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },
    

    Mutation: {
        createRequest: async (obj, {content}, context, info) =>  {
            try {
                return await Request.create(content)
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateRequest: async (obj, {id, content}, context, info) =>  {
            try {
                let result = await Request.update(content, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteRequest: async (obj, {id}, context, info) =>  {
            try {
                const team = await Request.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        createRequestExternal: async (obj, { content }, context, info) => {
 
            try {
              // Step 1: Find the player by `id_person`
              const player = await Players.findOne({
                where: {
                  id_person: content.id_person,
                },
              });
      
              if (!player) {
                throw new ApolloError("يرجى منك اضافت الشكوى في المتصة المخصصة لحسابك , حسابك ليس حساب لاعب");
              }
      
              // Step 2: Set the player ID in the request content
              const requestData = {
                ...content,      // Copy other content fields
                id_player: player.id,  // Assign player.id to id_player
              };
      
              // Step 3: Create the request
              const newRequest = await Request.create(requestData);
      
              return newRequest;
            } catch (error) {
              // Log error (you can use logger.error here if needed)
              throw new ApolloError(error.message);
            }
          },
    }
}
