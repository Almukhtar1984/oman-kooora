// A purchase request placed from the public app against one store. The buyer is
// NOT a system account — only their contact details are captured. Payment is
// cash-on-delivery only for now (no online payment gateway yet).
// id_store is added via the association in Models/index.mjs. Line items live in
// the order_items table (OrderItem).
export default (db, types) => {
    return db.define('order', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        full_name: {
            type: types.STRING(255),
            allowNull: false
        },
        phone: {
            type: types.STRING(30),
            allowNull: false
        },
        address: {
            type: types.STRING(500),
            allowNull: true
        },
        note: {
            type: types.STRING(500),
            allowNull: true
        },
        // Order total, computed server-side from the line items at creation.
        total: {
            type: types.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: types.ENUM,
            values: ['waiting', 'accepted', 'rejected', 'delivered'],
            defaultValue: 'waiting'
        },
        // Cash on delivery is the only method for now. The enum leaves room for
        // an online option later without a breaking migration.
        payment_method: {
            type: types.ENUM,
            values: ['cash_on_delivery'],
            defaultValue: 'cash_on_delivery'
        },
        payment_status: {
            type: types.ENUM,
            values: ['unpaid', 'paid'],
            defaultValue: 'unpaid'
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true,
        // 'order' is a reserved word in MySQL — pin the real table name.
        tableName: 'orders'
    });
};
