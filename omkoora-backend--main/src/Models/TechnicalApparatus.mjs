// See Members.mjs for the rationale — guard against empty / invalid strings
// on DATE columns at the model layer.
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
    return db.define('technical_apparatus', {
        id: {
            type: types.UUID,
            defaultValue: types.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        occupation: {
            type: types.STRING(50),
            allowNull: false
        },
        classification: {
            type: types.STRING(50),
            allowNull: false
        },
        membership_date: {
            type: types.DATE,
            allowNull: false,
            set(value) { this.setDataValue('membership_date', sanitizeDate(value)); }
        },
        membership_date_end: {
            type: types.DATE,
            allowNull: true,
            set(value) { this.setDataValue('membership_date_end', sanitizeDate(value)); }
        },
        paid: {
            type: types.BOOLEAN,
            defaultValue: false
        },
        testimony_experience: {
            type: types.STRING(50),
            allowNull: false
        },
        status: {
            type: types.ENUM,
            values: ["accepted", "rejected", "waiting", "waiting_club"],
            defaultValue: "waiting"
        },
        note: {
            type: types.STRING(255),
            allowNull: true
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};