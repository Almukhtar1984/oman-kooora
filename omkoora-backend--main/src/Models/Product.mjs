// A product belongs to one store. Kept simple on purpose — no stock/warehouse
// management. `quantity` is an optional free display hint (e.g. units on hand);
// it is NOT decremented on order and never blocks checkout.
// id_store is added via the association in Models/index.mjs.
export default (db, types) => {
    return db.define('product', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: types.STRING(255),
            allowNull: false
        },
        about: {
            type: types.STRING(500),
            allowNull: true
        },
        price: {
            type: types.DOUBLE,
            allowNull: false,
            defaultValue: 0
        },
        // Optional, simple display-only quantity hint. No inventory logic.
        quantity: {
            type: types.INTEGER,
            allowNull: true
        },
        // Comma-separated filenames (same convention as stadium.images).
        images: {
            type: types.STRING(255),
            allowNull: true
        },
        // Hide a product from the public app without deleting it.
        is_available: {
            type: types.BOOLEAN,
            defaultValue: true
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
