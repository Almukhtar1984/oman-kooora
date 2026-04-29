export default (db, types) => {
    return db.define('meeting', {
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
        names_attending: {
            type: types.STRING(255),
            allowNull: false
        },
        description: {
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