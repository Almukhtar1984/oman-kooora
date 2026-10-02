export default (db, types) => {
    return db.define('request', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        content: {
            type: types.STRING(500),
            allowNull: false
        },
        type: {
            type: types.ENUM,
            values: ["complaint", "request", "proposal"],
            allowNull: true
        },
        note: {
            type: types.STRING(255),
            allowNull: true
        },
        // Human-friendly reference the member quotes when following up, e.g.
        // "REQ-1A2B3C4D". Generated on create; unique but nullable for old rows.
        reference_number: {
            type: types.STRING(32),
            allowNull: true,
            unique: true
        },
        // The admin's written reply and when it was sent.
        admin_reply: {
            type: types.TEXT,
            allowNull: true
        },
        replied_at: {
            type: types.DATE,
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting", "done"],
            defaultValue: "waiting"
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};