export default (db, types) => {
    return db.define('club', {
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
        governorate: {
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
        account_status: {
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