// دفعة واحدة مقابل طلب واحد — حتى لا يختلط ما دفعه الفريق على عدة طلبات.
export default (db, types) => {
    return db.define('requestPayment', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        fee_type: {
            type: types.ENUM,
            values: ["player_registration", "transfer", "loan", "team_registration"],
            allowNull: false
        },
        amount: {
            type: types.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        // What is being paid for: the kind of record and its id.
        entity_type: {
            type: types.STRING(32),
            allowNull: true
        },
        entity_id: {
            type: types.UUID,
            allowNull: true
        },
        status: {
            type: types.ENUM,
            values: ["waiting", "submitted", "accepted", "rejected"],
            defaultValue: "waiting"
        },
        // رقم التحويل الذي يقتبسه الفريق، والإيصال المرفوع صورةً.
        reference_number: {
            type: types.STRING(64),
            allowNull: true
        },
        receipt: {
            type: types.STRING(100),
            allowNull: true
        },
        // بيان الطلب الذي كتبه النادي عند المطالبة.
        note: {
            type: types.STRING(255),
            allowNull: true
        },
        // سبب قرار النادي على الإيصال. حقل منفصل عن البيان: لو كُتب الرفض
        // فوقه لضاع ما تدفع عنه الدفعة، وهو عين الخربطة التي نعالجها.
        decision_note: {
            type: types.STRING(255),
            allowNull: true
        },
        paid_at: {
            type: types.DATE,
            allowNull: true
        },
        decided_at: {
            type: types.DATE,
            allowNull: true
        },
        id_requested_by: {
            type: types.UUID,
            allowNull: true
        },
        id_decided_by: {
            type: types.UUID,
            allowNull: true
        },
    }, {
        tableName: 'request_payments',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
