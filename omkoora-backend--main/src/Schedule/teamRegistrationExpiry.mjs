import { Op } from "sequelize";
import { Team } from "../Models/index.mjs";
import { CreateDirectNotification } from "../Helpers/index.mjs";
import { omanToday } from "../Helpers/teamRegistration.mjs";
import { forgetTeamAccess } from "../Helpers/teamAccess.mjs";

// Stop every team whose registration period ended (the client, 2026-11-08).
//
// The accounts are already refused from the first minute after the last day —
// sign-in and every request compare the date themselves. This job makes the
// card say so: the team turns «متوقف», and the club is told which team stopped
// and how to renew it.
export async function cleanUp(today = omanToday()) {
    try {
        const ended = await Team.findAll({
            where: {
                account_status: true,
                registration_end: { [Op.ne]: null, [Op.lt]: today },
            },
        });

        for (const team of ended) {
            await team.update({ account_status: false });
            await CreateDirectNotification({
                id_club: team.id_club,
                body: `انتهت مدة تسجيل ${team.name} في \u2066${team.registration_end}\u2069 فتوقف حسابه — جدّد التسجيل وفعّله من صفحة الفرق.`,
            });
        }
        if (ended.length) forgetTeamAccess();

        console.log(`Stopped ${ended.length} team(s) whose registration period ended.`);
        return ended.length;
    } catch (error) {
        console.error("Error stopping teams whose registration ended", error);
        return 0;
    }
}
