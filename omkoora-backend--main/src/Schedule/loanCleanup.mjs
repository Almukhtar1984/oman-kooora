import { Transfer, Players } from '../Models/index.mjs';
import { Op } from 'sequelize';
import { CreateNotificationTeam } from '../Helpers/index.mjs';

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
            if (player) {
                // Send the player back to the team that originally owned them.
                await player.update({ id_team: loan.id_team_from });

                // Notify both the original and the borrowing team.
                await CreateNotificationTeam("loan", "returned", loan.id_team_from, loan.id_player);
                await CreateNotificationTeam("loan", "returned", loan.id_team_to, loan.id_player);
            }

            // Soft delete the finished loan record.
            await loan.destroy();
        }

        console.log(`Returned ${expiredLoans.length} expired loan(s) to their original teams.`);
    } catch (error) {
        console.error("Error returning expired loans", error);
    }
}
