// See Members.mjs for the rationale — MySQL refuses empty / invalid strings
// on DATE columns, so coerce them to null at the model setter.
const sanitizeDate = (value) => {
    if (value === null || value === undefined) return null;
    if (value === "") return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "" || /^invalid/i.test(trimmed)) return null;
        const parsed = new Date(trimmed);
        return isNaN(parsed.getTime()) ? null : trimmed;
    }
    return value;
};

export default (db, types) => {
    return db.define('club_management', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        role: {
            type: types.ENUM,
            values: ['1', '2'],
            defaultValue: 1,
            // 1 -> admin
            // 2 -> supervisor
        },
        membership_date: {
            type: types.DATEONLY,
            allowNull: true,
            set(value) { this.setDataValue('membership_date', sanitizeDate(value)); }
        },
        membership_date_end: {
            type: types.DATEONLY,
            allowNull: true,
            set(value) { this.setDataValue('membership_date_end', sanitizeDate(value)); }
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};