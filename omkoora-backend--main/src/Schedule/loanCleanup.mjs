import { Transfer, Players } from '../Models/index.mjs';
import { Op } from 'sequelize';
import DB from '../Config/DBContact.mjs';
import { CreateNotificationTeam } from '../Helpers/index.mjs';
import { removeReceivingTeamParticipations } from '../Helpers/LoanReturn.mjs';

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
            const player = await Players.findByPk(loan.id_player);

            // Return each loan atomically: restore the team, clear the league
            // enrolment with the RECEIVING team, then soft-delete the loan.
            await DB.transaction(async (t) => {
                if (player) {
                    // Send the player back to the team that originally owned them.
                    await player.update({ id_team: loan.id_team_from }, { transaction: t });

                    // Remove him from the receiving team's league squad only —
                    // his original-team enrolments are left untouched.
                    await removeReceivingTeamParticipations(loan.id_player, loan.id_team_to, t);
                }

                // Soft delete the finished loan record.
                await loan.destroy({ transaction: t });
            });

            // Notify both the original and the borrowing team once committed.
            if (player) {
                await CreateNotificationTeam("loan", "returned", loan.id_team_from, loan.id_player);
                await CreateNotificationTeam("loan", "returned", loan.id_team_to, loan.id_player);
            }
        }

        console.log(`Returned ${expiredLoans.length} expired loan(s) to their original teams.`);
    } catch (error) {
        console.error("Error returning expired loans", error);
    }
}
