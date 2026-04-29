import { ApolloError } from 'apollo-server-express';

import { Op } from 'sequelize';
import { ActionLog,Team ,User,Person} from '../../Models/index.mjs';

export const resolvers = {
    Query: {
        ActionLog: async (obj, { id }, context, info) => {
            try {
                return await ActionLog.findByPk(id);
            } catch (error) {
                throw new ApolloError(error);
            }
        },

        allActionLogs: async (obj, args, context, info) => {
            
            try {
                return await ActionLog.findAll();
            } catch (error) {
                throw new ApolloError(error);
            }
        },
        allActionLogsClub: async (obj, { idClub }, context, info) => {
            try {
        
        
                const actionLogs = await ActionLog.findAll({
                    where: {
                        id_club: idClub,
                        level: {
                            [Op.ne]: 1
                        }
                    },
                    include: [
                        {
                            model: Team,
                            as: 'team'
                        },
                        {
                            model: User,
                            as: "user",
                            include: {
                                model: Person,
                                as: "person"
                            }
                        }
                    ]
                });
        
                // Check the length of the result;
        
                // Return the result
                return actionLogs;
        
            } catch (error) {
                throw new ApolloError(error);
            }
        }
        
    }
}