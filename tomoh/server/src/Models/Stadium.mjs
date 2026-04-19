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
        }
    },{
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        paranoid: true
    });
};

/*
حجوزات الملاعب للفريق
 - - - - - - - - - - - - - _
١-اضافه الصور 5 صور
٢- نبذه عن الملعب
٣-نوع العشب ( الطبيعي - الصناعي)
 ٤- المرفقات ( حمام - مصلى - غرفه تغير ملابس - شرب الماء)
٥-أيجار الملعب
٦- التوقيت الحجز من ساعه إلى ساعه
*/


/*
عمليه حجز للمتابعين
-----------------
يظهر البيانات الملعب حسب أختبار  المحافظه والمنطقه
يقوم حجز الملعب حسب التوقيت الفاضي غير محجوز

عند حجز إدخال رقم الهاتف فقط يحجز مره واحد في نفس اليوم
*/