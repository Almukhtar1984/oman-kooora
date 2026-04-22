export default (db, types) => {
    return db.define('comment', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        content: {
            type: types.STRING(255),
            allowNull: false
        },
        note: {
            type: types.STRING(500),
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