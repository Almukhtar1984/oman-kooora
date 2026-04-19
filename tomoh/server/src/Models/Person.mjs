export default (db, types) => {
    return db.define('person', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        personal_picture: {
            type: types.STRING(100),
            allowNull: true
        },
        first_name: {
            type: types.STRING(20),
            allowNull: false
        },
        second_name: {
            type: types.STRING(20),
            allowNull: false
        },
        third_name: {
            type: types.STRING(20),
            allowNull: false
        },
        tribe: {
            type: types.STRING(20),
            allowNull: false
        },
        phone: {
            type: types.STRING(15),
            allowNull: false
        },
        card_number: {
            type: types.STRING(50),
            allowNull: false
        },
        date_birth: {
            type: types.STRING(15),
            allowNull: false
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};