export default (db, types) => {
    return db.define('members', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        occupation: {
            type: types.STRING(50),
            allowNull: false
        },
        classification: {
            type: types.STRING(50),
            allowNull: false
        },
        membership_date: {
            type: types.DATE,
            allowNull: false
        },
        membership_date_end: {
            type: types.DATE,
            allowNull: true
        },
        paid: {
            type: types.BOOLEAN,
            defaultValue: false
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting", "waiting_club"],
            defaultValue: "waiting"
        },
        note: {
            type: types.STRING(255),
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