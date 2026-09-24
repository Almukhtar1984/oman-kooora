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
            values: ['1', '2', '3', '4', '5'],
            defaultValue: 3,
            // 1 -> super admin
            // 2 -> admin club
            // 3 -> admin team
            // 4 -> league admin
            // 5 -> match official (sees only their assigned match)
        },
        activation: {
            type: types.BOOLEAN,
            defaultValue: true
        },
        email_verify: {
            type: types.BOOLEAN,
            defaultValue: false
        },
        // Firebase Cloud Messaging device token, so the server can push a
        // notification to this user even while the app is closed. Set via the
        // saveFcmToken mutation after the client obtains it from FCM.
        fcm_token: {
            type: types.STRING(512),
            allowNull: true
        },
        fcm_platform: {
            type: types.STRING(20),
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
    