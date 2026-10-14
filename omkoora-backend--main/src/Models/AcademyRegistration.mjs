export default (db, types) => {
    // تسجيل لاعب في أكاديمية — "الطلب الذي يصل للأكاديمية" من التطبيق.
    // الدفع عند الاستلام فقط الآن: payment_status يدوي، لا بوّابة دفع.
    return db.define('academyregistration', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        full_name: {
            type: types.STRING(150),
            allowNull: false
        },
        phone: {
            type: types.STRING(30),
            allowNull: false
        },
        // تاريخ ميلاد الطفل (أو اتركه واملأ age) — كلاهما اختياري.
        child_birth_date: {
            type: types.DATEONLY,
            allowNull: true
        },
        age: {
            type: types.INTEGER,
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ['waiting', 'accepted', 'rejected'],
            defaultValue: 'waiting',
            allowNull: false
        },
        // الدفع عند الاستلام: تتبّع يدوي فقط.
        payment_status: {
            type: types.ENUM,
            values: ['unpaid', 'paid'],
            defaultValue: 'unpaid',
            allowNull: false
        },
        note: {
            type: types.STRING(500),
            allowNull: true
        }
    }, {
        tableName: 'academy_registrations',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
