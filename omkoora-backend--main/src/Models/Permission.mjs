export default (db, types) => {
    return db.define('permission', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        teams: {
            type: types.STRING(25),
            allowNull: true
        },
        members: {
            type: types.STRING(25),
            allowNull: true
        },
        technicals: {
            type: types.STRING(25),
            allowNull: true
        },
        players: {
            type: types.STRING(25),
            allowNull: true
        },
        transfer_players: {
            type: types.STRING(25),
            allowNull: true
        },
        loan_players: {
            type: types.STRING(25),
            allowNull: true
        },
        assembly: {
            type: types.STRING(25),
            allowNull: true
        },
        inbox: {
            type: types.STRING(25),
            allowNull: true
        },
        outbox: {
            type: types.STRING(25),
            allowNull: true
        },
        meeting: {
            type: types.STRING(25),
            allowNull: true
        },
        blogs: {
            type: types.STRING(25),
            allowNull: true
        },
        forms: {
            type: types.STRING(25),
            allowNull: true
        },
        permissions: {
            type: types.STRING(25),
            allowNull: true
        },
        complaints: {
            type: types.STRING(25),
            allowNull: true
        },
        expenses: {
            type: types.STRING(25),
            allowNull: true
        },
        leagues: {
            type: types.STRING(25),
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