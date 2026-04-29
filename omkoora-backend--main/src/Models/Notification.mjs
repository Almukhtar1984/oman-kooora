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
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};