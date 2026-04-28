# PORT REGISTRY NOTE

> هذا المشروع موثق في السجل المركزي للمنافذ.

## السجل المركزي

**الملف:** `/Users/mw/Downloads/DEV_PORT_REGISTRY.md`

## منافذ هذا المشروع

| الخدمة | المنفذ الجديد | المنفذ القديم | ملاحظة |
|--------|:------------:|:------------:|--------|
| GraphQL Server | **7001** | 7001 | لا تغيير |
| client/club | **3050** | 3001 | تعارض مع transAllal dashboard! |
| client/sports-course | **3051** | 3004 | |
| client/super-admin | **3052** | 3006 | |
| client/team | **3053** | 3008 | |
| client/plyer | **3054** | 3010 | |
| client/landing-page | **3055** | 3012 | |
| client/print | **3056** | 3000 | تعارض مع transAllal backend! |

## تحديث package.json المطلوب

في `package.json` الجذر، عدّل scripts إلى:
```json
"dev:club":         "npm --prefix client/club run dev -- -p 3050",
"dev:sports-course":"npm --prefix client/sports-course run start -- --port 3051",
"dev:super-admin":  "npm --prefix client/super-admin run dev -- -p 3052",
"dev:team":         "npm --prefix client/team run dev -- -p 3053",
"dev:plyer":        "npm --prefix client/plyer run dev -- -p 3054",
"dev:landing-page": "npm --prefix client/landing-page run dev -- -p 3055",
"dev:print":        "npm --prefix client/print run start -- --port 3056"
```
