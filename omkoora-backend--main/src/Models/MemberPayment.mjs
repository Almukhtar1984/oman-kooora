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
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
