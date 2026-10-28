// خطّ التتبّع نفسه: كل مرحلة دخلها الطلب، ومتى، وبِيَد مَن، ولماذا رُفض.
//
// Append-only. A rejection that was later fixed still happened, and the team
// asked for this line precisely because the single status badge kept erasing
// what came before it. Nothing here is updated or deleted.
export default (db, types) => {
    return db.define('requestFlowEvent', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        stage: {
            type: types.ENUM,
            values: [
                'draft', 'submitted', 'rejected_initial', 'club_processing',
                'awaiting_payment', 'paid_review', 'approved', 'rejected_final', 'cancelled'
            ],
            allowNull: false
        },
        // السبب عند الرفض، أو بيان الإجراء عند غيره.
        note: {
            type: types.STRING(255),
            allowNull: true
        },
        actor: {
            type: types.ENUM,
            values: ['team', 'club', 'system'],
            defaultValue: 'system'
        },
        id_user: {
            type: types.UUID,
            allowNull: true
        },
        // بالمللي ثانية، لا بالثانية: خطوتان في الثانية الواحدة — والنادي يبتّ
        // ثم يسدّد الفريق فوراً — تتساويان في DATETIME العادي فيختلّ ترتيب
        // الخط. وخطُّ تتبّعٍ مبعثر أسوأ من لا خط.
        createdAt: {
            type: types.DATE(3),
            allowNull: false
        },
        updatedAt: {
            type: types.DATE(3),
            allowNull: false
        },
    }, {
        tableName: 'request_flow_events',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: false,
        paranoid: false
    });
};
