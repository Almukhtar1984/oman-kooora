import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Transfer, Players, Team, Club, TechnicalApparatus, RequestPayment, RequestFlowEvent} from '../../Models/index.mjs';
import { normalizeAmount, PAYMENT_WAITING } from "../../Helpers/clubFees.mjs";
import { CreateDirectNotification } from "../../Helpers/Notification.mjs";
import DB from '../../Config/DBContact.mjs';
import {CreateNotificationTeam, CreateNotificationClub} from "../../Helpers/index.mjs";
import {removeReceivingTeamParticipations, removeReceivingTeamParticipationsTechnical} from "../../Helpers/LoanReturn.mjs";
import { initialTransferStatus, transferTransition, resolveDestinationTeam } from "../../Helpers/transferFlow.mjs";
import { callerClubId, callerTeamId, clubOfTeam } from "../../Helpers/clubScope.mjs";
import { openFlow, flowFor, advanceFlow, withdrawFlow } from "../../Helpers/requestFlowRunner.mjs";
import { openingStage, isDone, CLUB_PROCESSING, REJECTED_FINAL } from "../../Helpers/requestFlow.mjs";

const SUPER_ADMIN_ROLE = "1";
const CLUB_ADMIN_ROLE = "2";
const TEAM_ADMIN_ROLE = "3";

// The club id a team belongs to (null if unknown). Used to route a move through
// the from-club then the to-club.
const clubIdOfTeam = async (idTeam) => {
    if (!idTeam) return null;
    const t = await Team.findByPk(idTeam, { attributes: ["id", "id_club"] });
    return t?.id_club || null;
};

/**
 * Refuse a cancel / return / delete / re-date from anyone outside the transfer.
 *
 * Only an id reaches these mutations, so whoever holds a transfer's UUID could
 * otherwise send another club's loaned player home. The super-admin may act on
 * any transfer; a club on one its club sends or receives; a team on one its
 * team sends or receives. Nobody else — a league admin, a player's account.
 *
 * A club's side is read from the stored id_club_* and from the teams' clubs,
 * the same match the club's loans page lists by (allPlayersClubLoaned), so every
 * row a club sees it can still act on — older rows never had id_club_* filled.
 *
 * @throws {ApolloError} TRANSFER_NOT_YOURS
 */
const assertTransferParty = async (context, transfer) => {
    const role = context?.user?.role;
    if (role === SUPER_ADMIN_ROLE) return;

    if (role === TEAM_ADMIN_ROLE) {
        const myTeam = await callerTeamId(context);
        if (myTeam && [transfer.id_team_from, transfer.id_team_to].includes(myTeam)) return;
    } else if (role === CLUB_ADMIN_ROLE) {
        const mine = await callerClubId(context);
        if (mine) {
            const [clubFrom, clubTo] = await Promise.all([
                clubOfTeam(transfer.id_team_from),
                clubOfTeam(transfer.id_team_to),
            ]);
            if ([transfer.id_club_from, transfer.id_club_to, clubFrom, clubTo].includes(mine)) return;
        }
    }

    throw new ApolloError("هذا الانتقال أو الإعارة لا يخصّ ناديك أو فريقك", "TRANSFER_NOT_YOURS");
};


dotenv.config();


const {Op, col} = sequelize;

/**
 * رسوم النادي المُرسِل على انتقالٍ أو إعارة إلى نادٍ آخر — «النادي هذا يأخذ رسوم
 * والنادي الآخر يأخذ رسوم… في بعض الأحيان بدون رسوم» (العميل). يسدّدها فريقه
 * المُرسِل، ولا يُعتمد الطلب نهائياً قبل أن يعتمد إيصالها (requestOutcomes.mjs).
 *
 * يكتب قراره في خطّ الطلب — برسومٍ أو بلا رسوم — ويخبر الفريق بما عليه.
 */
const chargeSendingFee = async ({ transfer, fee, flow, id_user }) => {
    const isLoan = transfer.transition_type === "loan"
    const amount = normalizeAmount(fee)
    const onRoad = flow && !isDone(flow.stage)

    if (amount && transfer.id_club_from && transfer.id_team_from) {
        await RequestPayment.create({
            fee_type: isLoan ? "loan" : "transfer",
            amount,
            entity_type: "transfer",
            entity_id: transfer.id,
            status: PAYMENT_WAITING,
            note: `رسوم النادي المُرسِل — ${isLoan ? "إعارة لاعب" : "انتقال لاعب"}`,
            id_club: transfer.id_club_from,
            id_team: transfer.id_team_from,
            id_requested_by: id_user,
        })
        if (onRoad) {
            await RequestFlowEvent.create({
                id_flow: flow.id, stage: flow.stage, actor: "club", id_user,
                note: `وافق النادي المُرسِل وطالب فريقه برسومه: ${amount} ر.ع`,
            })
        }
        void CreateDirectNotification({
            id_team: transfer.id_team_from,
            body: `${isLoan ? "إعارة" : "انتقال"} لاعبك: مطلوب سداد رسوم ناديك ${amount} ر.ع — من «المدفوعات»`,
        })
    } else if (onRoad) {
        await RequestFlowEvent.create({
            id_flow: flow.id, stage: flow.stage, actor: "club", id_user,
            note: "وافق النادي المُرسِل بلا رسوم",
        })
    }
};

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
                // انتقالٌ أو إعارة طلبٌ له طريقه؛ وعودة اللاعب من إعارته انقضاءُ مدة.
                const isRequest = ["transition", "loan"].includes(content.transition_type || "transition");

                // The backend owns the initial stage — the client's status is ignored.
                const status = initialTransferStatus({ callerIsClub, sameClub, isRequest });

                const transfer = await Transfer.create({
                    ...content,
                    id_club_from: idClubFrom,
                    id_club_to: idClubTo,
                    status,
                });

                if (status === "accepted") {
                    // A club returned a loan → it is done at once.
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

                // مسار الطلب — للانتقال والإعارة وحدهما. والعودة من إعارة ليست
                // طلباً بل انقضاء مدة، فلا خطّ لها.
                //
                // وإعارة النادي الداخلية كانت تولد معتمدة واللاعب ينتقل فوراً، فلا
                // يراها مسار الطلبات أصلاً — «سوّينا إعارة… مفروض يمرّ على مسار
                // الطلبات، أين راح؟» (العميل). الآن تبدأ «مقبولةً مبدئياً» وتمرّ
                // بالرسوم والاعتماد كغيرها.
                if (isRequest) {
                    const agreed = status === "waiting_payment";
                    const opened = await openFlow({
                        request_type: transfer.transition_type === "loan" ? "loan" : "transfer",
                        entity_type: "transfer",
                        entity_id: transfer.id,
                        // النادي المستقبِل هو الذي يستكمل ويطالب ويعتمد؛
                        // وسلسلة الناديين تمضي كما هي داخل المراجعة المبدئية.
                        id_club: idClubTo,
                        // والفريق المستقبِل هو الذي يسدّد: «الفريق باء يستعير… يدفع».
                        id_team: content.id_team_to || null,
                        stage: openingStage({ byClub: agreed }),
                        actor: callerIsClub ? "club" : "team",
                        id_user: context?.user?.id || null,
                    })

                    // النادي الذي يُخرج لاعبه بنفسه إلى نادٍ آخر وافق بإنشائه الطلب، فلا
                    // «موافقة» بعدها يسمّي عندها رسومه: يسمّيها هنا، أو يمضي بلا رسوم.
                    if (callerIsClub && !sameClub && idClubFrom && (await callerClubId(context)) === idClubFrom) {
                        await chargeSendingFee({
                            transfer, fee: content.fee, id_user: context?.user?.id || null,
                            flow: opened || await flowFor("transfer", transfer.id, { withEvents: false }),
                        })
                    }
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
                // The receiving club names the team; a pick from anyone else is
                // ignored rather than trusted (team names repeat across clubs).
                const idTeamTo = resolveDestinationTeam({
                    storedTeamId: transfer.id_team_to,
                    requestedTeamId: content.id_team_to || null,
                    requestedTeamClubId: content.id_team_to ? await clubOfTeam(content.id_team_to) : null,
                    destinationClubId: transfer.id_club_to || null,
                    callerClubId: await callerClubId(context),
                });

                // اتفق الناديان: ما بقي — الرسوم والاعتماد — على مسار الطلب، لا هنا.
                if (transfer.status === "waiting_payment") {
                    throw new ApolloError(
                        "اتفق الناديان على هذا الطلب — رسومه واعتماده النهائي من مسار الطلبات",
                        "TRANSFER_ON_ROAD"
                    );
                }

                // Advance the approval chain from the current stage.
                const sameClub = !!transfer.id_club_from && transfer.id_club_from === transfer.id_club_to
                const decision = content.status // "accepted" (approve this stage) | "rejected"
                const next = transferTransition(transfer.status, decision, sameClub)

                // A player cannot land nowhere: the receiving club names the team
                // when it agrees, and the final approval moves him there.
                if (next.agreed && !idTeamTo) {
                    throw new ApolloError(
                        "اختر الفريق الذي سينضم إليه اللاعب في ناديك قبل الموافقة على الطلب",
                        "TRANSFER_TEAM_REQUIRED"
                    );
                }

                const isRequest = ["transition", "loan"].includes(transfer.transition_type)
                const flow = isRequest ? await flowFor("transfer", transfer.id, { withEvents: false }) : null
                const onRoad = flow && !isDone(flow.stage)
                const id_user = context?.user?.id || null

                const result = await Transfer.update({ status: next.status, id_team_to: idTeamTo }, { where: { id } })

                if (result[0] === 1) {
                    if (next.agreed) {
                        // الناديان اتفقا — واللاعب لا ينتقل بعد: يمرّ الطلب بالرسوم
                        // ثم الاعتماد النهائي، وعنده ينتقل (requestOutcomes.mjs).
                        if (onRoad) {
                            const moved = await advanceFlow({ flow, to: CLUB_PROCESSING, by: "club", id_user })
                            if (!moved.ok) logger.error(`Transfer.updateTransfer: road ${moved.code}`)
                        } else if (isRequest) {
                            // طلبٌ قُدّم قبل أن يوجد الخط: يُفتح له مساره الآن.
                            await openFlow({
                                request_type: isLoan ? "loan" : "transfer",
                                entity_type: "transfer",
                                entity_id: transfer.id,
                                id_club: transfer.id_club_to || null,
                                id_team: idTeamTo,
                                stage: CLUB_PROCESSING,
                                actor: "club",
                                id_user,
                            })
                        }
                    } else if (next.status === "waiting_club_to") {
                        // The own club approved → it's now the destination club's turn.
                        if (transfer.id_club_to) await CreateNotificationClub("player", "update", transfer.id_club_to, "", subjectId)

                        // والنادي المُرسِل يأخذ رسومه إن شاء.
                        await chargeSendingFee({ transfer, fee: content.fee, flow, id_user })
                    } else if (next.status === "rejected") {
                        if (onRoad) {
                            // الطريق يُغلق الطلب ويُبقي اللاعب في فريقه ويُخبر الطرفين.
                            const closed = await advanceFlow({
                                flow, to: REJECTED_FINAL, by: "club",
                                reason: content.note || "رُفض الطلب", id_user,
                            })
                            if (!closed.ok) logger.error(`Transfer.updateTransfer: road ${closed.code}`)
                        } else {
                            // Rejected anywhere → the player stays active in the current team.
                            await Subject.update({ status: "accepted" }, { where: { id: subjectId } })
                            if (isLoan) {
                                await CreateNotificationTeam("loan", "rejected", transfer.id_team_from, subjectId, subjectType)
                            }
                        }
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                // Keep our own refusals (and their codes) readable by the client
                // instead of burying them in a second ApolloError.
                if (error instanceof ApolloError) throw error
                logger.error(`Transfer.updateTransfer: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        deleteTransfer: async (obj, {id}, context, info) =>  {
            try {
                const transfer = await Transfer.findByPk(id)
                if (!transfer) {
                    return { status: false }
                }
                await assertTransferParty(context, transfer)

                await withdrawFlow({
                    entity_type: "transfer", entity_id: id,
                    by: (await callerClubId(context)) ? "club" : "team",
                    id_user: context?.user?.id || null,
                })
                const team = await Transfer.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error
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
                await assertTransferParty(context, transfer);

                // A loan still on the road is a request being withdrawn: close its
                // road first, so the player is active again and its unpaid
                // charges are withdrawn — not left as a debt on the team.
                await withdrawFlow({
                    entity_type: "transfer", entity_id: transfer.id,
                    by: (await callerClubId(context)) ? "club" : "team",
                    id_user: context?.user?.id || null,
                });

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
                // Keep a refusal's code (TRANSFER_NOT_YOURS) readable by the client.
                if (error instanceof ApolloError) throw error;
                throw new ApolloError(error.message || 'An error occurred while processing the request');
            }
        },
        updateLoan: async (obj, { id, date_start, date_end }, context, info) => {
            try {
                const transfer = await Transfer.findByPk(id);
                if (!transfer) {
                    return { status: false };
                }
                await assertTransferParty(context, transfer);

                const [updated] = await Transfer.update(
                    { date_start, date_end }, // Fields to update
                    { where: { id } } // Update condition
                );
        
                return {
                    status: updated === 1 // Check if exactly one record was updated
                };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                // Log error or handle it as needed
                throw new ApolloError(error.message || "Failed to update loan");
            }
        },
        

    }
}
