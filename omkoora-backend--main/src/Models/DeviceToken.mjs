// An FCM device token a member registered from the mobile app. Keyed to the
// person (not a dashboard User) because portal members sign in with phone +
// civil id and usually have no User row. One person may have several devices,
// so there is a row per token; `token` is unique so re-registering the same
// device updates in place instead of piling up duplicates.
export default (db, types) => {
    return db.define('device_token', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        id_person: {
            type: types.UUID,
            allowNull: false
        },
        token: {
            type: types.STRING(512),
            allowNull: false,
            unique: true
        },
        platform: {
            type: types.STRING(20),
            allowNull: true
        }
    }, {
        // Not paranoid: a soft-deleted row would keep the unique `token` taken,
        // so a re-registering device could not be re-inserted. Hard rows only.
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        paranoid: false
    });
};
