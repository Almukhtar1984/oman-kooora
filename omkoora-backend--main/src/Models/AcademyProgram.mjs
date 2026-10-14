export default (db, types) => {
    // برنامج/تدريب/فئة عمرية داخل أكاديمية (مثل باقة تدريبية). بسيط عمدًا:
    // الأوقات نص حرّ (schedule) لا جدول منفصل.
    return db.define('academyprogram', {
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
        // الفئة العمرية (مثال: "تحت 10 سنوات").
        age_category: {
            type: types.STRING(100),
            allowNull: true
        },
        // أوقات التدريب كنص (مثال: "السبت والإثنين 4–6 مساءً").
        schedule: {
            type: types.STRING(500),
            allowNull: true
        },
        about: {
            type: types.STRING(500),
            allowNull: true
        },
        price: {
            type: types.DOUBLE,
            allowNull: true
        }
    }, {
        tableName: 'academy_programs',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
