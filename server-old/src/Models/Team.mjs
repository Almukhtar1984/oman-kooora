export default (db, types) => {
    return db.define('team', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: types.STRING(255),
            allowNull: false
        },
        logo: {
            type: types.STRING(255),
            allowNull: true
        },
        phone: {
            type: types.STRING(255),
            allowNull: false
        },
        manager_name: {
            type: types.STRING(100),
            allowNull: false
        },
        activities: {
            type: types.STRING(100),
            allowNull: false
        },
        account_status: {
            type: types.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        code: {
            type: types.STRING(100),
            allowNull: false
        },
        category: {
            type: types.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
        enableAddPlayer: {
            type: types.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};