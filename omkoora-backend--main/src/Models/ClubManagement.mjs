export default (db, types) => {
    return db.define('club_management', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        role: {
            type: types.ENUM,
            values: ['1', '2'],
            defaultValue: 1,
            // 1 -> admin
            // 2 -> supervisor
        },
        membership_date: {
            type: types.DATEONLY,
            allowNull: true
        },
        membership_date_end: {
            type: types.DATEONLY,
            allowNull: true
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};