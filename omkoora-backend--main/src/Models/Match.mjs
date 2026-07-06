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
            allowNull: true,
            default : null
        },
        secondTeamGoal: {
            type: types.INTEGER,
            defaultValue: 0,
            allowNull: true,
            default : null
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
        
        matchState: {
            type: types.ENUM,
            values: ['before-start', 'playing', 'end'],
            defaultValue: 'before-start',
            allowNull: false
        },
        // Login code handed to the match official; they sign in with it and
        // see only this match. id_user links to that official's users row.
        code: {
            type: types.STRING(20),
            allowNull: true
        },
        // Free-text notes shown/printed with the match.
        note: {
            type: types.TEXT,
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