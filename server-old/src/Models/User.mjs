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
            defaultValue: 4,
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
        },
        failed_login_attempts: {
            type: types.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0
        },
        locked_until: {
            type: types.DATE,
            allowNull: true
        },
        last_failed_login_at: {
            type: types.DATE,
            allowNull: true
        },
        refresh_token_version: {
            type: types.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0
        },
        refresh_token_id: {
            type: types.STRING(100),
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
