export default (db, types) => {
    return db.define('expense', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        value: {
            type: types.DOUBLE,
            allowNull: false
        },
        note: {
            type: types.STRING(500),
            allowNull: false
        },
        attachment: {
            type: types.STRING(50),
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