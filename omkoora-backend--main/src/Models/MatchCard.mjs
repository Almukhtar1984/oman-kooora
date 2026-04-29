export default (db, types) => {
    return db.define('match_card', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        type: {
            type: types.ENUM,
            values: ['red', 'yellow']
        },
        date: {
            type: types.STRING(20),
            allowNull: false
        },
        player: {
            type: types.STRING(36),
            allowNull: false,
            defaultValue: ""
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};