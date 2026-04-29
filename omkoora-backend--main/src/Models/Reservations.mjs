export default (db, types) => {
    return db.define('reservations', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        phone: {
            type: types.STRING(15),
            allowNull: false
        },
        booking_date: {
            type: types.DATEONLY,
            allowNull: false
        },
        booking_start: {
            type: types.TIME,
            allowNull: false
        },
        booking_end: {
            type: types.TIME,
            allowNull: false
        },
        status: {
            type: types.ENUM,
            values: ['cancel', 'accepted','waiting'],
            defaultValue: 'waiting',  // Default to "مؤكد" if not specified
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
