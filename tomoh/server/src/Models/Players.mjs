export default (db, types) => {
    return db.define('player', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        activity: {
            type: types.STRING(50),
            allowNull: false
        },
        player_center: {
            type: types.STRING(50),
            allowNull: false
        },
        job: {
            type: types.STRING(15),
            allowNull: false
        },
        nationalID: {
            type: types.STRING(100),
            allowNull: true
        },
        nationalIDBack: {
            type: types.STRING(100),
            allowNull: true
        },
        parentApproval: {
            type: types.STRING(100),
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting", "waiting_club"],
            defaultValue: "waiting"
        },
        note: {
            type: types.STRING(255),
            allowNull: true
        },
        class: {
            type: types.ENUM,
            values: ["young", "rookies", "secondDegree", "firstDegree"],
            defaultValue: "firstDegree"
        },
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};

