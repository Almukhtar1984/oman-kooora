import { ApolloError } from 'apollo-server-express';

import { Op } from 'sequelize';
import { Notification,Team ,User,Person} from '../../Models/index.mjs';

export const resolvers = {
    Query: {
        allNotificationClub: async (obj, { idClub }, context, info) => {
            try {
                return await Notification.findAll({
                    where: {
                        id_club: idClub,
                    },
                    order: [['createdAt', 'DESC']],
                    limit: 10
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
        allNotificationTeam: async (obj, { idTeam }, context, info) => {
            try {
                return await Notification.findAll({
                    where: {
                        id_team: idTeam,
                    },
                    order: [['createdAt', 'DESC']],
                    limit: 10
                });
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },

        
    },

    Mutation: {
        markNotificationsAsRead: async (obj, { idClub, idTeam }, context, info) => {
            try {
                const where = {};
                if (idClub) where.id_club = idClub;
                if (idTeam) where.id_team = idTeam;

                await Notification.update(
                    { isRead: true },
                    { where: { ...where, isRead: false } }
                );
                return true;
            } catch (error) {
                throw new ApolloError(error.message);
            }
        },
    }
};
