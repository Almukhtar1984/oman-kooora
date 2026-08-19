export default (db, types) => {
    return db.define('committee_member', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: types.STRING(100),
            allowNull: false
        },
        phone: {
            type: types.STRING(20),
            allowNull: true
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
