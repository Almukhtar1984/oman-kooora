import { DataTypes } from 'sequelize';
export default (db, types) => {
    return db.define('participating_player_match' , {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        starter: {
            type: types.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        sub: {
            type: types.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
        },
        id_participating_player: {
            type: types.UUID,
            allowNull: false,
            references: {
                model: 'participating_players',
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