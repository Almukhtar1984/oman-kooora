// مسار طلب واحد: أين يقف، ولمن الدور، وأي دفعة تسدّده.
//
// One row per request — a registration, a transfer, a loan or a resignation.
// The request's own record keeps its old `status` column untouched, because
// sixty screens read it; the stage here is the truth, and that column is
// mirrored from it.
export default (db, types) => {
    return db.define('requestFlow', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        request_type: {
            type: types.ENUM,
            values: ['player_registration', 'transfer', 'loan', 'player_release'],
            allowNull: false
        },
        // الطلب الذي يتتبّعه هذا المسار: نوع السجل ومعرّفه.
        entity_type: {
            type: types.STRING(32),
            allowNull: false
        },
        entity_id: {
            type: types.UUID,
            allowNull: false
        },
        stage: {
            type: types.ENUM,
            values: [
                'draft', 'submitted', 'rejected_initial', 'club_processing',
                'awaiting_payment', 'paid_review', 'approved', 'rejected_final', 'cancelled'
            ],
            defaultValue: 'submitted'
        },
        // آخر سبب رفض — يُعرض مع المرحلة، وتاريخه كله في الأحداث.
        reason: {
            type: types.STRING(255),
            allowNull: true
        },
        // الدفعة التي رُفعت لهذا الطلب، إن طولب برسوم.
        id_payment: {
            type: types.UUID,
            allowNull: true
        },
    }, {
        tableName: 'request_flows',
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true,
        indexes: [
            // طلب واحد، مسار واحد.
            { unique: true, fields: ['entity_type', 'entity_id'] }
        ]
    });
};
