export default (db, types) => {
    return db.define('message', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        subject: {
            type: types.STRING(255),
            allowNull: false
        },
        content: {
            type: types.STRING(500),
            allowNull: false
        },
        priority: {
            type: types.ENUM,
            values: ["normal", "urgent", "very_urgent"],
            allowNull: true
        },
        logo: {
            type: types.STRING(50),
            allowNull: true
        },
        // status: {
        //     type: types.ENUM,
        //     values: ["accepted", "rejected", "waiting", "done"],
        //     defaultValue: "waiting"
        // }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};