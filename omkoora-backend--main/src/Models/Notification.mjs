export default (db, types) => {
    return db.define('notification', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        body: {
            type: types.STRING,
            allowNull: false
        },

        isRead: {
            type: types.BOOLEAN,
            defaultValue: false
        },

        // The person this notification is about, when it concerns one specific
        // member (a player/technical-staff loan or transfer, a sanction, …).
        // Best-effort and nullable — team-wide notifications leave it null. The
        // member portal reads its feed by this column. Plain column (no FK) so a
        // player/member/technical id all map to one person uniformly.
        id_person: {
            type: types.UUID,
            allowNull: true
        },
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};