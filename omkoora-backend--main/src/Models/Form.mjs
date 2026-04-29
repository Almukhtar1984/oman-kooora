export default (db, types) => {
    return db.define('form', {
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
        file: {
            type: types.STRING(50),
            allowNull: false
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};