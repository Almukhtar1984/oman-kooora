export default (db, types) => {
    return db.define('user', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        email: {
            type: types.STRING(100),
            allowNull: false,
            validate: {isEmail: true}
        },
        password: {
            type: types.STRING(255),
            allowNull: false
        },
        role: {
            type: types.ENUM,
            values: ['1', '2', '3', '4'],
            defaultValue: 3,
            // 1 -> super admin
            // 2 -> admin club
            // 3 -> admin team
            // 4 -> user
        },
        activation: {
            type: types.BOOLEAN,
            defaultValue: true
        },
        email_verify: {
            type: types.BOOLEAN,
            defaultValue: false
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
    