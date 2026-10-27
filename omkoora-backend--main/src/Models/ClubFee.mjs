// سعر خدمة واحد في قائمة أسعار النادي (تسجيل لاعب، انتقال، إعارة، تسجيل فريق).
export default (db, types) => {
    return db.define('clubFee', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        fee_type: {
            type: types.ENUM,
            values: ["player_registration", "transfer", "loan", "team_registration"],
            allowNull: false
        },
        amount: {
            type: types.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        // A club that does not charge for something switches it off instead of
        // pricing it at zero, so "free" and "not set yet" stay distinguishable.
        active: {
            type: types.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, {
        tableName: 'club_fees',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
