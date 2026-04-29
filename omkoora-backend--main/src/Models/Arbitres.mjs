
export default (db, types) => {
    return db.define('arbitres' , {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        Arbitre1: {
            type: types.STRING(500),
            allowNull: false,
            defaultValue: ""
        },
        Arbitre2: {
            type: types.STRING(500),
            allowNull: false,
            defaultValue: ""
        },
        Arbitre3: {
            type: types.STRING(500),
            allowNull: false,
            defaultValue: ""
        },
        Arbitre4: {
            type: types.STRING(500),
            allowNull: false,
            defaultValue: ""
        },
        /*id_match: {
            type: types.UUID,
            allowNull: false,
            references: {
                model: 'matches',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            collate: 'utf8_bin'
        },*/
        
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};