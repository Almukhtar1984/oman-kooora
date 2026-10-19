export default (db, types) => {
    return db.define('transfer', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        status: {
            type: types.ENUM,
            // Multi-stage approval chain: team → own club → destination club.
            //   waiting_club_from → waiting_club_to → accepted / rejected.
            // "waiting" is kept for backward compatibility with older rows.
            values: ["accepted", "rejected", "waiting", "waiting_club_from", "waiting_club_to"],
            defaultValue: "waiting_club_from"
        },
        type: {
            type: types.ENUM,
            values: ["internal", "external"],
            defaultValue: "internal"
        },
        transition_type: {
            type: types.ENUM,
            values: ["transition", "loan", "returning"],
            defaultValue: "transition"
        },
        date_end: {
            type: types.DATEONLY,
            allowNull: true
        },
        date_start: {
            type: types.DATEONLY,
            allowNull: true
        },
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};