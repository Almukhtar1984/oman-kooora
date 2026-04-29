export default (db, types) => {
    return db.define('actionLogs', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        id_player: {
            type: types.UUID,
          
        },
        level: {
            type: types.ENUM,
            values: ['1', '2', '3', '4'],
            defaultValue: 4,
            // 1 -> super admin
            // 2 -> admin club
            // 3 -> admin team
            // 4 -> user
        },
        action_name: {
            type: types.STRING,
            allowNull: false
        },
        success:{
            type: types.STRING,
        },
        entity_type: {
            type: types.STRING,
        },
        entity_id: {
            type: types.UUID,
        },
        action_type: {
            type: types.ENUM(
                'Create',
                'Update',
                'Delete',
                
            ),
        },
        action_variables: {
            type: types.STRING,
        },
      
       
        
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};