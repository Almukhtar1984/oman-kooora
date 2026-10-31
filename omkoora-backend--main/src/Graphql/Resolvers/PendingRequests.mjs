import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';

import logger from "../../Config/logger.mjs";
import {
    Blog, Members, Players, PlayerRelease, Request, RequestFlow, RequestPayment, Team, TechnicalApparatus, Transfer,
} from '../../Models/index.mjs';
import { callerClubId, callerTeamId } from "../../Helpers/clubScope.mjs";
import { PAYMENT_WAITING } from "../../Helpers/clubFees.mjs";
import { liveCharges, summarizePending, summarizeTeamPending } from "../../Helpers/pendingRequests.mjs";
import {
    AWAITING_PAYMENT, CANCELLED, CLUB_PROCESSING, PAID_REVIEW, REJECTED_FINAL, REJECTED_INITIAL,
} from "../../Helpers/requestFlow.mjs";

const { Op } = sequelize;

// A registration the club has not decided yet, whichever stage it sits at.
const UNDECIDED = ["waiting", "waiting_club"];
const TRANSFER_UNDECIDED = ["waiting", "waiting_club_from", "waiting_club_to"];

// انتقالٌ اتفق عليه الناديان ينتظر النادي المستقبِل: يطالب بالرسوم أو يُعفي،
// ثم يعتمد — هو عمله، فيُعدّ له وحده (والسداد نفسه يُستثنى أدناه).
const transferTurn = (idClub) => ({
    [Op.or]: [
        { status: { [Op.in]: TRANSFER_UNDECIDED }, [Op.or]: [{ id_club_from: idClub }, { id_club_to: idClub }] },
        { status: "waiting_payment", id_club_to: idClub },
    ],
});

export const resolvers = {
    Query: {
        clubPendingRequests: async (obj, args, context) => {
            try {
                const idClub = await callerClubId(context);
                if (!idClub) return { total: 0, groups: [] };

                const teams = await Team.findAll({ where: { id_club: idClub }, attributes: ["id"] });
                const teamIds = teams.map((team) => team.id);
                const byTeam = { id_team: { [Op.in]: teamIds }, status: { [Op.in]: UNDECIDED } };

                // طلبٌ ينتظر سداد الفريق ليس في ملعب النادي.
                //
                // الحالة القديمة تبقى «بانتظار النادي» لأن الشاشات القائمة تقرأها،
                // فكان العدّاد الأحمر يحسب هذه الطلبات ويطارد النادي بعمل ليس عمله.
                // المرحلة تعرف دور مَن هو، فتُستثنى بها.
                const paused = { player: [], transfer: [], player_release: [] };
                const waitingOnTeam = await RequestFlow.findAll({
                    where: { id_club: idClub, stage: AWAITING_PAYMENT },
                    attributes: ["entity_type", "entity_id"],
                });
                waitingOnTeam.forEach((flow) => paused[flow.entity_type]?.push(flow.entity_id));
                const except = (ids) => (ids.length ? { id: { [Op.notIn]: ids } } : {});

                // Counted in parallel: this runs behind a badge on every page.
                const [players, technicals, members, transfers, loans, releases, payments, news, teamRegistrations] = await Promise.all([
                    teamIds.length ? Players.count({ where: { ...byTeam, ...except(paused.player) } }) : 0,
                    teamIds.length ? TechnicalApparatus.count({ where: byTeam }) : 0,
                    teamIds.length ? Members.count({ where: byTeam }) : 0,
                    Transfer.count({
                        where: { transition_type: "transition", ...transferTurn(idClub), ...except(paused.transfer) },
                    }),
                    Transfer.count({
                        where: { transition_type: "loan", ...transferTurn(idClub), ...except(paused.transfer) },
                    }),
                    PlayerRelease.count({
                        where: { id_club: idClub, status: "waiting", ...except(paused.player_release) },
                    }),
                    // A receipt the team sent and the club has not looked at yet.
                    RequestPayment.count({ where: { id_club: idClub, status: "submitted" } }),
                    Blog.count({ where: { id_club: idClub, status: "waiting" } }),
                    // تسجيل فريقٍ ينتظر النادي: يطالب برسومه أو يعتمده.
                    RequestFlow.count({
                        where: { id_club: idClub, request_type: "team_registration", stage: { [Op.in]: [CLUB_PROCESSING, PAID_REVIEW] } },
                    }),
                ]);

                return summarizePending({
                    players, technicals, members, transfers, loans, releases, payments, news, teams: teamRegistrations,
                });
            } catch (error) {
                logger.error(`PendingRequests.clubPendingRequests: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        // ما ينتظر الفريق: ما يسدّده، وما أعاده النادي، وما ينتظر ردّه من لاعبيه.
        teamPendingRequests: async (obj, args, context) => {
            try {
                const idTeam = await callerTeamId(context);
                if (!idTeam) return { total: 0, groups: [] };

                // وما أعاده النادي يشمل الانتقال والإعارة اللذين قدّمهما الفريق
                // لنادٍ آخر — خطّهما باسم المستقبِل، والتعديل عند من قدّم.
                const outgoing = await Transfer.findAll({ where: { id_team_from: idTeam }, attributes: ["id"] });
                const mine = outgoing.length
                    ? { [Op.or]: [
                        { id_team: idTeam },
                        { entity_type: "transfer", entity_id: { [Op.in]: outgoing.map((row) => row.id) } },
                    ] }
                    : { id_team: idTeam };

                const [charges, returned, playerRequests] = await Promise.all([
                    RequestPayment.findAll({
                        where: { id_team: idTeam, status: PAYMENT_WAITING },
                        attributes: ["id", "entity_type", "entity_id"],
                    }),
                    RequestFlow.count({ where: { ...mine, stage: REJECTED_INITIAL } }),
                    Request.count({
                        where: { status: "waiting" },
                        include: { model: Players, as: "player", required: true, attributes: [], where: { id_team: idTeam } },
                    }),
                ]);

                const entityIds = charges.map((payment) => payment.entity_id).filter(Boolean);
                const closed = entityIds.length
                    ? await RequestFlow.findAll({
                        where: { entity_id: { [Op.in]: entityIds }, stage: { [Op.in]: [REJECTED_FINAL, CANCELLED] } },
                        attributes: ["entity_type", "entity_id"],
                    })
                    : [];

                return summarizeTeamPending({ payments: liveCharges(charges, closed).length, returned, playerRequests });
            } catch (error) {
                logger.error(`PendingRequests.teamPendingRequests: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};
