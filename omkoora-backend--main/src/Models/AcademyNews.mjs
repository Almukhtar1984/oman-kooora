export default (db, types) => {
    // خبر/إعلان أكاديمية (مثل "فتح باب التسجيل"). يظهر في صفحة أخبار التطبيق.
    return db.define('academynews', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        title: {
            type: types.STRING(255),
            allowNull: false
        },
        body: {
            type: types.TEXT,
            allowNull: true
        },
        image: {
            type: types.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'academy_news',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
