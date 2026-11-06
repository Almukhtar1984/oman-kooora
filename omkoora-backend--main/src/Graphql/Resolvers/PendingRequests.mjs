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

// دور النادي في الانتقال: المُرسِل في مرحلته، والمستقبِل في مرحلته، ثم المطالبة
// والاعتماد عنده هو (والسداد نفسه يُستثنى أدناه). كان العدّاد يعدّ كل انتقال معلّق
// للناديين معاً، فيطارد المُرسِل بطلبٍ وافق عليه وهو الآن عند الآخر.
const transferTurn = (idClub) => ({
    [Op.or]: [
        { status: "waiting_club_from", id_club_from: idClub },
        { status: { [Op.in]: ["waiting_club_to", "waiting_payment"] }, id_club_to: idClub },
        { status: "waiting", [Op.or]: [{ id_club_from: idClub }, { id_club_to: idClub }] },
    ],
});

// ما ينتظر قرار النادي، مجموعةً مجموعة: السجلّ وشرطه. العدّاد يعدّ منه، والصفحة
// تسأل عن سجلاته بالشرط نفسه — فما تفتح عليه هو ما عدّه، لا أكثر ولا أقل.
const pendingScopes = async (idClub) => {
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

    return {
        players: teamIds.length ? { model: Players, where: { ...byTeam, ...except(paused.player) } } : null,
        technicals: teamIds.length ? { model: TechnicalApparatus, where: byTeam } : null,
        members: teamIds.length ? { model: Members, where: byTeam } : null,
        transfers: {
            model: Transfer,
            where: { transition_type: "transition", ...transferTurn(idClub), ...except(paused.transfer) },
        },
        loans: {
            model: Transfer,
            where: { transition_type: "loan", ...transferTurn(idClub), ...except(paused.transfer) },
        },
        releases: {
            model: PlayerRelease,
            where: { id_club: idClub, status: "waiting", ...except(paused.player_release) },
        },
        // A receipt the team sent and the club has not looked at yet.
        payments: { model: RequestPayment, where: { id_club: idClub, status: "submitted" } },
        news: { model: Blog, where: { id_club: idClub, status: "waiting" } },
        // تسجيل فريقٍ ينتظر النادي: يطالب برسومه أو يعتمده.
        teams: {
            model: RequestFlow,
            where: { id_club: idClub, request_type: "team_registration", stage: { [Op.in]: [CLUB_PROCESSING, PAID_REVIEW] } },
        },
    };
};

export const resolvers = {
    Query: {
        clubPendingRequests: async (obj, args, context) => {
            try {
                const idClub = await callerClubId(context);
                if (!idClub) return { total: 0, groups: [] };

                const scopes = await pendingScopes(idClub);
                const keys = Object.keys(scopes);
                // Counted in parallel: this runs behind a badge on every page.
                const totals = await Promise.all(keys.map((key) => (
                    scopes[key] ? scopes[key].model.count({ where: scopes[key].where }) : 0
                )));

                return summarizePending(Object.fromEntries(keys.map((key, index) => [key, totals[index]])));
            } catch (error) {
                logger.error(`PendingRequests.clubPendingRequests: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        clubPendingIds: async (obj, { key }, context) => {
            try {
                const idClub = await callerClubId(context);
                if (!idClub) return [];

                const scope = (await pendingScopes(idClub))[key];
                if (!scope) return [];

                const rows = await scope.model.findAll({ where: scope.where, attributes: ["id"], raw: true });
                return rows.map((row) => row.id);
            } catch (error) {
                logger.error(`PendingRequests.clubPendingIds: ${error?.message || error}`);
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
