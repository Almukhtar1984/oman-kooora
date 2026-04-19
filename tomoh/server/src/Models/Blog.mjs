export default (db, types) => {
    return db.define('blog', {
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
        short_description: {
            type: types.STRING(255),
            allowNull: false
        },
        description: {
            type: types.STRING(1000),
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting"],
            defaultValue: "waiting"
        },
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};