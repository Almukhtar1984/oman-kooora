
import { Transfer, Players } from '../Models/index.mjs'; // Adjust the path to your models
import { Op } from 'sequelize';

// Function to check and clean up expired transfers
export async function cleanUp() {
    try {
        // Find all transfers where date_end is in the past and not soft deleted
        const expiredTransfers = await Transfer.findAll({
            where: {
                date_end: { [Op.lt]: new Date() },
                deletedAt: null
            },
            paranoid: false
        });

        for (const transfer of expiredTransfers) {
            // Update player's team based on the transfer details
            let player = await Players.findByPk(transfer.id_player);
            if (player) {
                await player.update({ id_team: transfer.id_team_to });
            }

            // Soft delete the transfer
            await transfer.destroy();
        }

        console.log(`Cleaned up ${expiredTransfers.length} expired transfers.`);
    } catch (error) {
        console.error("Error cleaning up expired transfers", error);
    }
}



