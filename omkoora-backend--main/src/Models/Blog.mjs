export default (db, types) => {
    return db.define('blog', {
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
        short_description: {
            type: types.STRING(255),
            allowNull: false
        },
        description: {
            type: types.STRING(1000),
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting"],
            defaultValue: "waiting"
        },
        // Mobile app fields.
        category: {
            type: types.STRING(50),
            allowNull: true
        },
        author_name: {
            type: types.STRING(100),
            allowNull: true
        },
        views_count: {
            type: types.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};