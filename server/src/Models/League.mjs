export default (db, types) => {
    return db.define('league', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: types.STRING(500),
            allowNull: false
        },
        numberTeams: {
            type: types.INTEGER,
            allowNull: false
        },
        numberGroups: {
            type: types.INTEGER,
            allowNull: false
        },
        description: {
            type: types.STRING(1000),
            allowNull: false
        },
        startDate: {
            type: types.STRING(15),
            allowNull: true
        },
        expiryDate: {
            type: types.STRING(15),
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