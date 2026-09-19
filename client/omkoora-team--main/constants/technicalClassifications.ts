// Canonical technical-staff roles (الصفة/التصنيف) shown on ID cards and in the
// staff management screens. This is the UNION of the values both the club and
// team apps used before, plus the roles the clubs asked for (أخصائي علاج، إداري)
// — kept as-is so existing rows still match a Select option.
export const TECHNICAL_CLASSIFICATIONS: string[] = [
    "مدرب",
    "مساعد مدرب",
    "مدرب حراس",
    "مدرب اللياقة",
    "مدير الفريق",
    "أخصائي علاج طبيعي",
    "طبي",
    "مسؤول مهمات",
    "اعلامي",
    "اداري",
];
