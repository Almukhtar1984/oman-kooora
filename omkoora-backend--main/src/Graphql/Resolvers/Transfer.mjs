import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Transfer, Players, Team, Club, TechnicalApparatus} from '../../Models/index.mjs';
import DB from '../../Config/DBContact.mjs';
import {CreateNotificationTeam, CreateNotificationClub} from "../../Helpers/index.mjs";
import {removeReceivingTeamParticipations, removeReceivingTeamParticipationsTechnical} from "../../Helpers/LoanReturn.mjs";
import {initialTransferStatus, transferTransition} from "../../Helpers/transferFlow.mjs";

const CLUB_ADMIN_ROLE = "2";

// The club id a team belongs to (null if unknown). Used to route a move through
// the from-club then the to-club.
const clubIdOfTeam = async (idTeam) => {
    if (!idTeam) return null;
    const t = await Team.findByPk(idTeam, { attributes: ["id", "id_club"] });
    return t?.id_club || null;
};


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        transfer: async (obj, {id}, context, info) =>  {
            try {
                return await Transfer.findByPk(id)
            } catch (error) {
                logger.error(`Transfer.transfer: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allTransfer: async (obj, {idClub}, context, info) =>  {
            try {
                return await Transfer.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error(`Transfer.allTransfer: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allTransferTeam: async (obj, {idTeam, transitionType}, context, info) =>  {
            if (!idTeam) return []   // team-scoped: no team → no rows (avoids the undefined-where crash)
            try {
                return await Transfer.findAll({
                    where: {
                        [Op.or]: [
                            {id_team_to: idTeam},
                            {id_team_from: idTeam}
                        ],
                        transition_type: {
                            [Op.in]: transitionType
                        }
                    }
                })
            } catch (error) {
                logger.error(`Transfer.allTransferTeam: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allTransferClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Transfer.findAll({
                    where: {
                        [Op.or]: [
                            {id_club_to: idClub},
                            {"$team.id_club$": idClub}
                        ]
                    },
                    include: {
                        model: Team,
                        as: "team",
                        required: true,
                        right: true,
                        on: {
                            [Op.or]: [
                                {id: {[Op.eq]: col("id_team_from")}},
                                {id: {[Op.eq]: col("id_team_to")}}
                            ]
                        }
                    }
                })
            } catch (error) {
                logger.error(`Transfer.allTransferClub: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
    },

    Transfer: {
        team_from: async ({id_team_from}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team_from)
            } catch (error) {
                logger.error(`Transfer.team_from: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        team_to: async ({id_team_to}, {id}, context, info) =>  {
            try {
                return await Team.findByPk(id_team_to)
            } catch (error) {
                logger.error(`Transfer.team_to: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        club_to: async ({id_club_to}, {id}, context, info) =>  {
            try {
                return await Club.findByPk(id_club_to)
            } catch (error) {
                logger.error(`Transfer.club_to: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        club_from: async ({id_club_from}, {}, context, info) =>  {
            try {
                return id_club_from ? await Club.findByPk(id_club_from) : null
            } catch (error) {
                logger.error(`Transfer.club_from: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        player: async ({id_player}, {id}, context, info) =>  {
            try {
                return await Players.findByPk(id_player)
            } catch (error) {
                logger.error(`Transfer.player: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        technicalApparatus: async ({id_technical_apparatus}, {}, context, info) =>  {
            try {
                return id_technical_apparatus ? await TechnicalApparatus.findByPk(id_technical_apparatus) : null
            } catch (error) {
                logger.error(`Transfer.technicalApparatus: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        }
    },

    Mutation: {
        createTransfer: async (obj, {content}, context, info) =>  {
            try {
                const isLoan = content.transition_type === "loan"
                const isTech = !content.id_player && !!content.id_technical_apparatus
                const Subject = isTech ? TechnicalApparatus : Players
                const subjectId = isTech ? content.id_technical_apparatus : content.id_player
                const subjectType = isTech ? "technical" : "player"

                // Route the move through the clubs: derive the from-club (player's
                // own club) and the to-club (destination team's club) so the chain
                // is enforced regardless of what the client sends.
                const idClubFrom = await clubIdOfTeam(content.id_team_from);
                const idClubTo = (await clubIdOfTeam(content.id_team_to)) || content.id_club_to || null;
                const sameClub = !!idClubFrom && idClubFrom === idClubTo;
                const callerIsClub = context?.user?.role === CLUB_ADMIN_ROLE;

                // The backend owns the initial stage — the client's status is ignored.
                const status = initialTransferStatus({ callerIsClub, sameClub });

                const transfer = await Transfer.create({
                    ...content,
                    id_club_from: idClubFrom,
                    id_club_to: idClubTo,
                    // A move has a date. The transfer form never sent one, so
                    // every card printed an empty column (which the @date
                    // directive used to render as 1970-01-01). The request date
                    // is the honest answer when nobody typed one.
                    date_start: content.date_start || new Date(),
                    status,
                });

                if (status === "accepted") {
                    // A club created an internal move → it is already final.
                    await Subject.update({ status: "accepted", id_team: content.id_team_to }, { where: { id: subjectId } })
                } else if (subjectId) {
                    // In flight → mark the subject pending its club(s)' review.
                    await Subject.update({ status: "waiting_club" }, { where: { id: subjectId } })
                }

                // Notify whoever's turn it is now.
                if (status === "waiting_club_from" && idClubFrom) {
                    await CreateNotificationClub("player", "create", idClubFrom, "", subjectId)
                } else if (status === "waiting_club_to" && idClubTo) {
                    await CreateNotificationClub("player", "create", idClubTo, "", subjectId)
                }
                // Keep the legacy loan-request team notification when a team is targeted.
                if (isLoan && status !== "accepted" && content.id_team_to) {
                    await CreateNotificationTeam("loan", "request", content.id_team_to, subjectId, subjectType)
                }

                return transfer
            } catch (error) {
                // logger.error(`Transfer.createTransfer: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        updateTransfer: async (obj, {id, content}, context, info) =>  {
            try {
                const transfer = await Transfer.findByPk(id)
                if (!transfer) {
                    return { status: false }
                }

                const isLoan = transfer.transition_type === "loan"
                const isTech = !transfer.id_player && !!transfer.id_technical_apparatus
                const Subject = isTech ? TechnicalApparatus : Players
                const subjectType = isTech ? "technical" : "player"
                const subjectId = isTech
                    ? (content.id_technical_apparatus || transfer.id_technical_apparatus)
                    : (content.id_player || transfer.id_player)
                const idTeamTo = content.id_team_to || transfer.id_team_to

                // Advance the approval chain from the current stage.
                const sameClub = !!transfer.id_club_from && transfer.id_club_from === transfer.id_club_to
                const decision = content.status // "accepted" (approve this stage) | "rejected"
                const next = transferTransition(transfer.status, decision, sameClub)

                const result = await Transfer.update({ status: next.status, id_team_to: idTeamTo }, { where: { id } })

                if (result[0] === 1) {
                    if (next.finalize) {
                        // Final approval → the player actually moves to the destination team.
                        await Subject.update({ status: "accepted", id_team: idTeamTo }, { where: { id: subjectId } })
                        if (isLoan) {
                            await CreateNotificationTeam("loan", "accepted", transfer.id_team_from, subjectId, subjectType)
                        }
                    } else if (next.status === "waiting_club_to") {
                        // The own club approved → it's now the destination club's turn.
                        if (transfer.id_club_to) await CreateNotificationClub("player", "update", transfer.id_club_to, "", subjectId)
                    } else if (next.status === "rejected") {
                        // Rejected anywhere → the player stays active in the current team.
                        await Subject.update({ status: "accepted" }, { where: { id: subjectId } })
                        if (isLoan) {
                            await CreateNotificationTeam("loan", "rejected", transfer.id_team_from, subjectId, subjectType)
                        }
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                // logger.error(`Transfer.updateTransfer: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        deleteTransfer: async (obj, {id}, context, info) =>  {
            try {
                const team = await Transfer.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                // logger.error(`Transfer.deleteTransfer: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },
        BackToOldTeamTransfer: async (obj, { id }, context, info) => {
            try {
                // The loans page lists finished loans too — loanCleanup soft-deletes
                // a loan as soon as date_end passes — and its إلغاء action sends that
                // row's id. A paranoid findByPk cannot see it, so cancelling any
                // ended loan failed with "Transfer ... not found". Read it with
                // paranoid:false and make every step below idempotent instead.
                const transfer = await Transfer.findByPk(id, { paranoid: false });
                if (!transfer) {
                    throw new ApolloError(`Transfer with ID ${id} not found`);
                }

                // Return the loan atomically: restore the player's team, drop
                // his league enrolment(s) with the RECEIVING team, then
                // soft-delete the transfer. If any step fails nothing commits.
                await DB.transaction(async (t) => {
                    // Works for a player or a technical-staff member.
                    const isTech = !transfer.id_player && !!transfer.id_technical_apparatus;
                    const Subject = isTech ? TechnicalApparatus : Players;
                    const subjectId = isTech ? transfer.id_technical_apparatus : transfer.id_player;

                    // 1) Restore the member's team to the old (lending) team. One
                    //    the cleanup already sent back is left where it is: an
                    //    UPDATE that changes nothing reports 0 affected rows, which
                    //    must not read as a failure.
                    const subject = await Subject.findByPk(subjectId, { transaction: t });
                    if (!subject) {
                        throw new ApolloError(`Failed to update team for subject ID ${subjectId}`);
                    }

                    if (subject.id_team !== transfer.id_team_from) {
                        await Subject.update(
                            { id_team: transfer.id_team_from },
                            { where: { id: subjectId }, transaction: t }
                        );
                    }

                    // 2) Remove the league squad enrolment(s) with the RECEIVING
                    //    team only — original-team enrolments stay intact.
                    if (isTech) {
                        await removeReceivingTeamParticipationsTechnical(subjectId, transfer.id_team_to, t);
                    } else {
                        await removeReceivingTeamParticipations(subjectId, transfer.id_team_to, t);
                    }

                    // 3) Soft-delete the transfer record, unless it is already closed.
                    if (!transfer.deletedAt) {
                        const removed = await Transfer.destroy({ where: { id }, transaction: t });
                        if (removed === 0) {
                            throw new ApolloError(`Failed to delete transfer with ID ${id}`);
                        }
                    }
                });

                return {
                    status: true
                };
            } catch (error) {
                logger.error(`Error in BackToOldTeamTransfer resolver: ${error.message}`);
                throw new ApolloError(error.message || 'An error occurred while processing the request');
            }
        },
        updateLoan: async (obj, { id, date_start, date_end }, context, info) => {
            try {
                const [updated] = await Transfer.update(
                    { date_start, date_end }, // Fields to update
                    { where: { id } } // Update condition
                );
        
                return {
                    status: updated === 1 // Check if exactly one record was updated
                };
            } catch (error) {
                // Log error or handle it as needed
                throw new ApolloError(error.message || "Failed to update loan");
            }
        },
        

    }
}
