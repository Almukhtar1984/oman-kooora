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
            values: ["accepted", "rejected", "waiting"],
            defaultValue: "waiting"
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