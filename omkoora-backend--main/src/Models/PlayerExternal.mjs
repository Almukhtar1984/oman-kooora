export default (db, types) => {
    return db.define('PlayerExternal', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        
        date: {
            type: types.DATEONLY,
            allowNull: true,
            defaultValue: null
        }

    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};