
import { Sanction, Players } from '../Models/index.mjs'; // Adjust the path to your models
import { Op } from 'sequelize';

// Function to check and clean up expired sanctions
export async function cleanUp() {
    try {
        // Find all sanctions where date_to is in the past and not soft deleted
        const expiredSanctions = await Sanction.findAll({
            where: {
                date_to: { [Op.lt]: new Date() },
                deletedAt: null
            },
            paranoid: false
        });

        for (const sanction of expiredSanctions) {
            // Update player's status to accepted
            let player = await Players.findByPk(sanction.id_player);
            if (player) {
                await player.update({ status: "accepted" });
            }

            // Soft delete the sanction
            await sanction.destroy();
        }

        console.log(`Cleaned up ${expiredSanctions.length} expired sanctions.`);
    } catch (error) {
        console.error("Error cleaning up expired sanctions", error);
    }
}

