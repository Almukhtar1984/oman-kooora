// A single payment made by a member — the club/team keeps a running ledger of
// what each member has paid, independent of the general صادر/وارد expenses.
export default (db, types) => {
    return db.define('member_payment', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        amount: {
            type: types.DOUBLE,
            allowNull: false
        },
        note: {
            type: types.STRING(500),
            allowNull: true
        },
        payment_date: {
            type: types.DATEONLY,
            allowNull: true
        },
        // How the payment was collected. Kept as a plain string (not an ENUM)
        // so new channels can be added without a schema migration.
        method: {
            type: types.STRING(20),
            allowNull: true
        },
        // Settlement state: "paid" | "pending" | "unpaid". Plain string for the
        // same reason — the GraphQL PaymentStatus enum documents the values.
        status: {
            type: types.STRING(20),
            allowNull: true
        },
        // Stored receipt (filename under /uploads or an absolute URL).
        receipt_url: {
            type: types.STRING(255),
            allowNull: true
        },
        // Provider / bank-transfer reference (e.g. a Thawani transaction id).
        transaction_number: {
            type: types.STRING(100),
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
