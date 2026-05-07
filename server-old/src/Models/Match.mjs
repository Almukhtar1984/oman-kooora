export default (db, types) => {
    return db.define('match', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        date: {
            type: types.STRING(20),
            allowNull: false
        },
        type: {
            type: types.ENUM,
            values: ['groups', 'league-16', 'league-8', 'quarter-finals', 'semi-finals', 'final'],
            defaultValue: 'groups',
        },
        firstTeamGoal: {
            type: types.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        secondTeamGoal: {
            type: types.INTEGER,
            defaultValue: 0,
            allowNull: true
        },
        first_team: {
            type: types.UUID,
            allowNull: false,
        },
        second_team: {
            type: types.UUID,
            allowNull: true,
        },
        manOfMatch: {
            type: types.STRING(36),
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