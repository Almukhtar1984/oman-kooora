// Sequelize hands string values straight through to MySQL when the column
// is a DATE — including ones JS Date() can't parse, like "" or "Invalid
// Date". MySQL then refuses with `ER_TRUNCATED_WRONG_VALUE: Incorrect
// datetime value: 'Invalid date'`. Guard at the column-setter level so
// every code path (form submits, scripts, future resolvers) gets the
// same normalization for free.
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
    return db.define('members', {
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