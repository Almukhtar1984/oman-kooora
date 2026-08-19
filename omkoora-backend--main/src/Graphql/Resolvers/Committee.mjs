import { ApolloError, AuthenticationError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import { Committee, CommitteeMember, Club, ClubManagement } from '../../Models/index.mjs';

// Resolve the club a request may write to: a club admin (role "2") is always
// scoped to their own club; a super-admin (role "1") may pass any idClub.
async function resolveClubId(context, idClub) {
    const { user } = context;
    if (user && user.role === "2") {
        const cm = await ClubManagement.findOne({ where: { id_person: user.id_person } });
        if (cm) return cm.id_club;
    }
    return idClub;
}

export const resolvers = {
    Query: {
        allCommittees: async (obj, { idClub }, context, info) => {
            try {
                const targetClub = await resolveClubId(context, idClub);
                if (!targetClub) return [];
                return await Committee.findAll({
                    where: { id_club: targetClub },
                    order: [['createdAt', 'ASC']],
                });
            } catch (error) {
                logger.error("Error fetching committees: " + error.message);
                throw new ApolloError(error);
            }
        },
        committee: async (obj, { id }, context, info) => {
            try {
                return await Committee.findByPk(id);
            } catch (error) {
                logger.error("Error fetching committee: " + error.message);
                throw new ApolloError(error);
            }
        },
    },

    Committee: {
        members: async ({ id }) => {
            try {
                return await CommitteeMember.findAll({ where: { id_committee: id }, order: [['name', 'ASC']] });
            } catch (error) {
                logger.error("Error fetching committee members: " + error.message);
                return [];
            }
        },
        membersCount: async ({ id }) => {
            try {
                return await CommitteeMember.count({ where: { id_committee: id } });
            } catch (error) {
                return 0;
            }
        },
        club: async ({ id_club }) => {
            try {
                return id_club ? await Club.findByPk(id_club) : null;
            } catch (error) {
                return null;
            }
        },
    },

    CommitteeMember: {
        committee: async ({ id_committee }) => {
            try {
                return id_committee ? await Committee.findByPk(id_committee) : null;
            } catch (error) {
                return null;
            }
        },
    },

    Mutation: {
        createCommittee: async (obj, { idClub, name }, context, info) => {
            try {
                const { user, isAuth } = context;
                if (!isAuth || !user) return new AuthenticationError("Authentication required");
                const targetClub = await resolveClubId(context, idClub);
                if (!targetClub) throw new ApolloError("لم يتم تحديد النادي", "NO_CLUB");
                return await Committee.create({ name, id_club: targetClub });
            } catch (error) {
                logger.error("Error creating committee: " + error.message);
                throw new ApolloError(error);
            }
        },
        updateCommittee: async (obj, { id, name }, context, info) => {
            try {
                const result = await Committee.update({ name }, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error("Error updating committee: " + error.message);
                throw new ApolloError(error);
            }
        },
        deleteCommittee: async (obj, { id }, context, info) => {
            try {
                // remove members first (defensive; FK cascade also covers this)
                await CommitteeMember.destroy({ where: { id_committee: id } });
                const result = await Committee.destroy({ where: { id } });
                return { status: result === 1 };
            } catch (error) {
                logger.error("Error deleting committee: " + error.message);
                throw new ApolloError(error);
            }
        },

        createCommitteeMember: async (obj, { idCommittee, name, phone }, context, info) => {
            try {
                const { user, isAuth } = context;
                if (!isAuth || !user) return new AuthenticationError("Authentication required");
                return await CommitteeMember.create({ name, phone: phone || null, id_committee: idCommittee });
            } catch (error) {
                logger.error("Error creating committee member: " + error.message);
                throw new ApolloError(error);
            }
        },
        updateCommitteeMember: async (obj, { id, name, phone, idCommittee }, context, info) => {
            try {
                const payload = {};
                if (name !== undefined) payload.name = name;
                if (phone !== undefined) payload.phone = phone || null;
                if (idCommittee !== undefined) payload.id_committee = idCommittee;
                const result = await CommitteeMember.update(payload, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error("Error updating committee member: " + error.message);
                throw new ApolloError(error);
            }
        },
        deleteCommitteeMember: async (obj, { id }, context, info) => {
            try {
                const result = await CommitteeMember.destroy({ where: { id } });
                return { status: result === 1 };
            } catch (error) {
                logger.error("Error deleting committee member: " + error.message);
                throw new ApolloError(error);
            }
        },
    },
};
