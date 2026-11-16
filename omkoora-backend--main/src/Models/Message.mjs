export default (db, types) => {
    return db.define('message', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        subject: {
            type: types.STRING(255),
            allowNull: false
        },
        // MEDIUMTEXT: المحرّر يكتب HTML، والخطاب العادي تجاوز 500 حرف فرُفضت
        // الرسالة (اجتماع 2026-11-16).
        content: {
            type: types.TEXT('medium'),
            allowNull: false
        },
        priority: {
            type: types.ENUM,
            values: ["normal", "urgent", "very_urgent"],
            allowNull: true
        },
        logo: {
            type: types.STRING(50),
            allowNull: true
        },
        // status: {
        //     type: types.ENUM,
        //     values: ["accepted", "rejected", "waiting", "done"],
        //     defaultValue: "waiting"
        // }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};