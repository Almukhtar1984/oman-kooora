import { ApolloError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import { Members, Person, MemberPayment } from '../../Models/index.mjs';

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
                    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    return { member, totalPaid, payments };
                }));

                return accounts;
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
