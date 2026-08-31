import { ApolloError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import { Members, Players, Person, MemberPayment } from '../../Models/index.mjs';

const sumAmount = (payments) => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

export const resolvers = {
    Query: {
        // Every member of the team, each with the payments they have made and
        // the running total — so the "حسابات الأعضاء" tab can list name, phone
        // and amount paid in one shot.
        memberAccountsTeam: async (obj, { idTeam }, context, info) => {
            try {
                const members = await Members.findAll({
                    where: { id_team: idTeam },
                    include: [{ model: Person, as: "person" }]
                });

                const accounts = await Promise.all(members.map(async (member) => {
                    const payments = await MemberPayment.findAll({
                        where: { id_member: member.id },
                        order: [['createdAt', 'DESC']]
                    });
                    return { member, totalPaid: sumAmount(payments), payments };
                }));

                return accounts;
            } catch (error) {
                logger.error("");
                throw new ApolloError(error);
            }
        },

        // Same ledger shape but for the team's players.
        playerAccountsTeam: async (obj, { idTeam }, context, info) => {
            try {
                const players = await Players.findAll({
                    where: { id_team: idTeam },
                    include: [{ model: Person, as: "person" }]
                });

                return await Promise.all(players.map(async (player) => {
                    const payments = await MemberPayment.findAll({
                        where: { id_player: player.id },
                        order: [['createdAt', 'DESC']]
                    });
                    return { player, totalPaid: sumAmount(payments), payments };
                }));
            } catch (error) {
                logger.error("");
                throw new ApolloError(error);
            }
        },

        // A single player's own ledger — the player portal ("مصروفاتي").
        playerPayments: async (obj, { idPlayer }, context, info) => {
            try {
                const player = await Players.findByPk(idPlayer);
                const payments = await MemberPayment.findAll({
                    where: { id_player: idPlayer },
                    order: [['createdAt', 'DESC']]
                });
                return { player, totalPaid: sumAmount(payments), payments };
            } catch (error) {
                logger.error("");
                throw new ApolloError(error);
            }
        }
    },

    Mutation: {
        createMemberPayment: async (obj, { content }, context, info) => {
            try {
                return await MemberPayment.create(content);
            } catch (error) {
                logger.error("");
                throw new ApolloError(error);
            }
        },

        deleteMemberPayment: async (obj, { id }, context, info) => {
            try {
                const deleted = await MemberPayment.destroy({ where: { id } });
                return { status: deleted === 1 };
            } catch (error) {
                logger.error("");
                throw new ApolloError(error);
            }
        }
    }
};
