// A player's resignation / release request ("استقالة — إخلاء طرف").
//
// The row is also the record the clubs asked to keep: who left, from which team
// and club, when it was asked for and when it was granted, and the letter that
// was submitted with it.
export default (db, types) => {
    return db.define('playerRelease', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        // Why the player is leaving, in the club's own words.
        reason: {
            type: types.TEXT,
            allowNull: true
        },
        // The resignation letter as uploaded (filename under /uploads).
        letter: {
            type: types.STRING(100),
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["waiting", "accepted", "rejected"],
            defaultValue: "waiting"
        },
        // The club's answer when it refuses — the team has to be able to read why.
        note: {
            type: types.STRING(255),
            allowNull: true
        },
        requested_at: {
            type: types.DATE,
            allowNull: true
        },
        decided_at: {
            type: types.DATE,
            allowNull: true
        },
        id_requested_by: {
            type: types.UUID,
            allowNull: true
        },
        id_decided_by: {
            type: types.UUID,
            allowNull: true
        },
    }, {
        tableName: 'player_releases',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
