export default (db, types) => {
    return db.define('request', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        content: {
            type: types.STRING(500),
            allowNull: false
        },
        type: {
            type: types.ENUM,
            values: ["complaint", "request", "proposal"],
            allowNull: true
        },
        note: {
            type: types.STRING(255),
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting", "done"],
            defaultValue: "waiting"
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};