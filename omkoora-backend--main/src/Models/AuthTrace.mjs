export default (db, types) => {
    return db.define('authTrace', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        /*
        id_user: {
            type: types.UUID,
            allowNull: false,
       
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            collate: 'utf8_bin'
        },*/
        action: {
            type: types.STRING,
            allowNull: false
        },
        arguments: {
            type: types.TEXT,
            allowNull: true
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true
    });
};
