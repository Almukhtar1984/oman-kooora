export default (db, types) => {
    // An academy is a standalone unit (مثل الملعب): owned by a dedicated
    // academy-owner account (role 7) via id_user. Nullable so a super-admin can
    // create the academy first and attach the owner later.
    return db.define('academy', {
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
        // الوصف/نبذة عن الأكاديمية.
        about: {
            type: types.STRING(1000),
            allowNull: true
        },
        // شعار واحد، + معرض صور (أسماء ملفات مفصولة بفواصل) على نمط الملعب.
        logo: {
            type: types.STRING(255),
            allowNull: true
        },
        images: {
            type: types.STRING(500),
            allowNull: true
        },
        phone: {
            type: types.STRING(30),
            allowNull: true
        },
        email: {
            type: types.STRING(100),
            allowNull: true
        },
        // عُماني: المحافظة والولاية. STRING (لا ENUM) ليبقى بسيطًا وغير مقيَّد؛
        // التطبيق يملأها من نفس قوائم الملعب.
        mohafada: {
            type: types.STRING(100),
            allowNull: true
        },
        wiliya: {
            type: types.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'academies',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
