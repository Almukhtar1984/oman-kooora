export default (db, types) => {
    return db.define('assembly', {
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
        date_birth: {
            // nullable: imported membership registries often lack birth dates
            type: types.DATEONLY,
            allowNull: true
        },
        card_number: {
            // nullable: many imported members have no civil ID on file
            type: types.STRING(50),
            allowNull: true
        },
        // Club's own membership number (رقم العضوية) — preserved on import.
        membership_number: {
            type: types.STRING(50),
            allowNull: true
        },
        phone: {
            type: types.STRING(20),
            allowNull: true
        },
        nationalID: {
            type: types.STRING(100),
            allowNull: true
        },
        nationalIDBack: {
            type: types.STRING(100),
            allowNull: true
        },
        membership_date: {
            type: types.DATEONLY,
            allowNull: true
        },
        gender: {
            type: types.ENUM,
            values: ["male", "female"],
            defaultValue: "male"
        },
        type: {
            type: types.STRING(50),
            allowNull: true
        },
        subscription_date: {
            type: types.DATEONLY,
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