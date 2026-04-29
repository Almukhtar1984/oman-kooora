export default (db, types) => {
    return db.define('senctions', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        /*
        id_player: {
            type: types.UUID,
            allowNull: false,
       
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            collate: 'utf8_bin',
        
           
        },*/
        status: {
            type: types.ENUM,
            values: ["active", "inactive"],
            defaultValue: "active"
        },
        date_from: {
            type: types.DATE,
            allowNull: false
        },
        date_to: {
            type: types.DATE,
            allowNull: false
        },
        note: {
            type: types.STRING(500),
            allowNull: true
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};