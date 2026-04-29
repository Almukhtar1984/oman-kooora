export default (db, types) => {
    return db.define('stadium', {
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
            allowNull: false
        },
        type: {
            type: types.ENUM,
            values: ['natural', 'artificial'],
            defaultValue: "artificial",
        },
        sport: {
            type: types.ENUM,
            values: ['كرة القدم', 'كرة سلة', 'بادل', 'كرة طائرة'],
            defaultValue: "كرة القدم",
        },
        attachments: {
            type: types.STRING(255),
            allowNull: false
        },
        rent: {
            type: types.DOUBLE,
            allowNull: false
        },
        images: {
            type: types.STRING(255),
            allowNull: true
        },
        mohafada: {
            type: types.ENUM,
            values: [ "ظفار",
                "مسندم",
                "البريمي",
                "الداخلية",
                "شمال الباطنة",
                "جنوب الباطنة",
                "شمال الشرقية",
                "جنوب الشرقية",
                "الظاهرة",
                "الوسطى",
                "مسقط"]
        },
        wiliya: {
            type: types.ENUM,
            values: [
                "شليم وجزر الحلانيات",
                "مقشن",
                "طاقة",
                "ثمريت",
                "صلالة",
                "رخيوت",
                "ضلكوت",
                "المزيونة",
                "مرباط",
                "خصب",
                "بخا",
                "دباء",
                "مدحاء",
                "محضة",
                "البريمي",
                "السنينة",
                "بهلا",
                "سمائل",
                "أدم",
                "إزكي",
                "منح",
                "بديد",
                "الحمراء",
                "نزوى",
                "لوى",
                "السويق",
                "صحم",
                "شناص",
                "صحار",
                "الخابورة",
                "نخل",
                "بركاء",
                "الرستاق",
                "العوابي",
                "المصنعة",
                "وادي المعاول",
                "إبراء",
                "المضيبي",
                "بدية",
                "القابل",
                "وادي بني خالد",
                "دماء والطائيين",
                "صور",
                "الكامل والوافي",
                "جعلان بني بو حسن",
                "جعلان بني بو علي",
                "مصيرة",
                "عبري",
                "ينقل",
                "ضنك",
                "هيما",
                "الدقم",
                "محوت",
                "الجازر",
                "العامرات",
                "السيب",
                "بوشر",
                "مسقط",
                "مطرح",
                "قريات"
            ]
        },
        start_time: {
            type: types.TIME,
            allowNull: false,
            defaultValue: "08:00:00" // Default to 8:00 AM
        },
        end_time: {
            type: types.TIME,
            allowNull: false,
            defaultValue: "20:00:00" // Default to 8:00 PM
        }
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};
