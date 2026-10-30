import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';

import logger from "../../Config/logger.mjs";
import {
    Blog, Members, Players, PlayerRelease, RequestFlow, RequestPayment, Team, TechnicalApparatus, Transfer,
} from '../../Models/index.mjs';
import { callerClubId } from "../../Helpers/clubScope.mjs";
import { summarizePending } from "../../Helpers/pendingRequests.mjs";
import { AWAITING_PAYMENT } from "../../Helpers/requestFlow.mjs";

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
                const [players, technicals, members, transfers, loans, releases, payments, news] = await Promise.all([
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
                ]);

                return summarizePending({ players, technicals, members, transfers, loans, releases, payments, news });
            } catch (error) {
                logger.error(`PendingRequests.clubPendingRequests: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};
