// One line of an order. product_name + price are snapshotted at purchase time so
// the owner still sees what was ordered even if the product is later edited or
// removed. id_order / id_product are added via associations in Models/index.mjs.
export default (db, types) => {
    return db.define('orderItem', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        product_name: {
            type: types.STRING(255),
            allowNull: false
        },
        price: {
            type: types.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        quantity: {
            type: types.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: false,
        tableName: 'order_items'
    });
};
