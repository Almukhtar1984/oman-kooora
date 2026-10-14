// A store is a standalone unit owned by a dedicated store-owner account
// (users.role = '8'). Deliberately simple — no inventory/warehouse system:
// just a storefront (name, logo, contact, location) that lists products.
// id_user (the owner) is added via the association in Models/index.mjs.
export default (db, types) => {
    return db.define('store', {
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
        // Single brand logo (one stored filename).
        logo: {
            type: types.STRING(255),
            allowNull: true
        },
        // Storefront gallery — comma-separated filenames (same convention as stadium.images).
        images: {
            type: types.STRING(255),
            allowNull: true
        },
        phone: {
            type: types.STRING(30),
            allowNull: true
        },
        whatsapp: {
            type: types.STRING(30),
            allowNull: true
        },
        // Location kept as free text (display only) — intentionally not an enum
        // so the stores module stays decoupled from the stadium location lists.
        mohafada: {
            type: types.STRING(100),
            allowNull: true
        },
        wiliya: {
            type: types.STRING(100),
            allowNull: true
        },
        // Store can be switched off without deleting it (hidden from the public app).
        is_active: {
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
