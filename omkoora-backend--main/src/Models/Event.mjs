export default (db, types) => {
    return db.define('event', {
         id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },

        id_team: {
            type: types.UUID, 
            allowNull: false
        },

        name: {
            type: types.STRING(255),
            allowNull: false
        },

        description: {
            type: types.TEXT,
            allowNull: true
        },

        date: {
            type: types.DATE,
            allowNull: false
        },

        images: {
            type: types.TEXT,
            allowNull: true,
            comment: "JSON array of image paths"
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
