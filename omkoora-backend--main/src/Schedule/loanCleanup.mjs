import { Transfer, Players, TechnicalApparatus } from '../Models/index.mjs';
import { Op } from 'sequelize';
import DB from '../Config/DBContact.mjs';
import { CreateNotificationTeam } from '../Helpers/index.mjs';
import { removeReceivingTeamParticipations, removeReceivingTeamParticipationsTechnical } from '../Helpers/LoanReturn.mjs';

// Return loaned players to their original team once the loan period ends.
export async function cleanUp() {
    try {
        // Only accepted loans whose end date has already passed get returned.
        const expiredLoans = await Transfer.findAll({
            where: {
                transition_type: 'loan',
                status: 'accepted',
                date_end: { [Op.lt]: new Date() },
                deletedAt: null
            },
            paranoid: false
        });

        for (const loan of expiredLoans) {
            // A loan can be for a player or a technical-staff member.
            const isTech = !loan.id_player && !!loan.id_technical_apparatus;
            const Subject = isTech ? TechnicalApparatus : Players;
            const subjectType = isTech ? "technical" : "player";
            const subjectId = isTech ? loan.id_technical_apparatus : loan.id_player;
            const subject = await Subject.findByPk(subjectId);

            // Return each loan atomically: restore the team, clear the league
            // enrolment with the RECEIVING team, then soft-delete the loan.
            await DB.transaction(async (t) => {
                if (subject) {
                    // Send the member back to the team that originally owned them.
                    await subject.update({ id_team: loan.id_team_from }, { transaction: t });

                    // Remove them from the receiving team's league squad only —
                    // original-team enrolments are left untouched.
                    if (isTech) {
                        await removeReceivingTeamParticipationsTechnical(subjectId, loan.id_team_to, t);
                    } else {
                        await removeReceivingTeamParticipations(subjectId, loan.id_team_to, t);
                    }
                }

                // Soft delete the finished loan record.
                await loan.destroy({ transaction: t });
            });

            // Notify both the original and the borrowing team once committed.
            if (subject) {
                await CreateNotificationTeam("loan", "returned", loan.id_team_from, subjectId, subjectType);
                await CreateNotificationTeam("loan", "returned", loan.id_team_to, subjectId, subjectType);
            }
        }

        console.log(`Returned ${expiredLoans.length} expired loan(s) to their original teams.`);
    } catch (error) {
        console.error("Error returning expired loans", error);
    }
}
