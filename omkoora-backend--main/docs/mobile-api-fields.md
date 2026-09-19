# توثيق حقول واجهة الموبايل (GraphQL API)

مرجع للمطوّرة: ما هو **موجود الآن** في الـAPI مقابل ما يُطلب، بأمثلة جاهزة.
الحالة: ✅ موجود/جاهز · 🆕 أُضيف حديثًا · 🔜 قيد التنفيذ (يحتاج تعديل قاعدة بيانات).

نقطة النهاية: `POST https://api.omkooora.com/graphql` (المصادقة عبر ترويسة `authorization: Bearer <token>`).

---

## 1) تسجيل الدخول (موجود) ✅
اللاعب/الشخص يسجّل الدخول برقم الهاتف + الرقم المدني:
```graphql
mutation {
  authenticatePortalPerson(phone: "9XXXXXXX", card_number: "10XXXXXXX") { token }
}
```
تسجيل دخول مستخدمي النظام (نادٍ/فريق) بالبريد:
```graphql
mutation ($content: loginInfo) { authenticateUser(content: $content) { token } }
```

## 2) الإشعارات (موجود) ✅
```graphql
query { allNotificationClub(idClub: "…") { id body isRead createdAt } }
query { allNotificationTeam(idTeam: "…") { id body isRead createdAt } }
```

## 3) اللاعبون (Players)
```graphql
query ($id: ID) {
  player(id: $id) {
    id type status class player_center
    person { first_name second_name third_name tribe phone card_number date_birth personal_picture }  # ✅ card_number
    team { id name logo category club { id name logo } }   # ✅ club داخل team
    club { id name logo }                                  # ✅ club مباشرة
    transfers_count      # 🆕 عدد الانتقالات
    loans_count          # 🆕 عدد الإعارات
    competitions_count   # 🆕 عدد المسابقات المشارك فيها
  }
}
```
قوائم اللاعبين الجاهزة: `allPlayers(idTeam)`, `allPlayersClub(idClub)`, `allPlayersAcceptedExternal(limit, offset)`.

## 4) الفرق (Teams) ✅
```graphql
query { allTeam(idClub: "…") { id name logo category club { id name logo } } }
```
> `category` نوعها `Int` (1/2/3…). تسمية الفئة العربية (براعم/ناشئين/…) تُعرَض من جهة التطبيق.

## 5) المسابقات (Competitions / League)
```graphql
query {
  allLeaguesExternal {
    id name startDate expiryDate
    status          # 🆕 upcoming | live | finished
    status_label    # 🆕 قادمة | جارية | منتهية
    organizer_name  # 🆕 الجهة المنظمة (اسم النادي/المنشئ)
    clubs_count     # 🆕 عدد الأندية المشاركة
    clubs { id name logo }   # 🆕 قائمة الأندية المشاركة
    best_player {   # 🆕 أفضل هدّاف في البطولة (يُحسب من أهداف المباريات)
      goals team_name
      player { id person { first_name second_name } }
    }
    participatingTeams { id team { id name } }
    matchs { id firstTeamGoal secondTeamGoal }
  }
}
```
بطاقات المسابقة (صفراء/حمراء) — **موجود** ✅:
```graphql
query { getCardsByLeague(leagueId: "…") { … } }
query { getCardsByLeagueGroupedByMatchType(leagueId: "…") { … } }
```

## 6) المباريات (Matches) ✅ (عبر League/Match)
```graphql
query {
  Match {
    id date type matchState manOfMatch
    firstTeamGoal secondTeamGoal          # ✅ النتيجة
    firstTeamScorersMatch { … }           # ✅ هدافو الفريق الأول
    secondTeamScorersMatch { … }          # ✅ هدافو الفريق الثاني
    firstTeamCards { … } secondTeamCards { … }  # ✅ البطاقات
    firstTeam { id } secondTeam { id }
  }
}
```
> 🆕 `venue` (الملعب) و`minute` (الدقيقة المباشرة) أُضيفا كعمودين على المباراة (يحتاجان الـmigration أدناه). يُضبطان عبر `contentMatch`/تحديث المباراة ويُقرآن من `getMatch`/قوائم المباريات.
> `manOfMatch` حاليًا نصّي (String) — يمكن ترقيته لنوع Player لاحقًا.

## 7) الإحصائيات العامة
إحصاء المنصّة (سوبر أدمن) — **موجود** ✅ ويغطّي أغلب العدّادات والتوزيعات:
```graphql
query { platformStatistics { clubs teams players members technicals boardManagement assembly stadiums leagues loans transfers totalPeople
  activities { name count } ageCategories { name count } clubsByGovernorate { name count } usersByRole { name count } } }
```
إحصاء نادٍ واحد — **موجود** ✅: `clubStatistics(idClub)`.

الإجماليات في `FetchAllData` — **أُضيفت** 🆕:
```graphql
query {
  FetchAllData {
    GeneralStat {
      totalTeams totalClubs totalVenues totalMatches totalTransfers
      totalLoans totalEvents totalBookings totalTechnicalStaff
      totalBoardMembers totalAgeCategories
      Members blogs acceptedPlayer leagues
    }
    clubs { id name logo }
  }
}
```

> ⚠️ عطل الإنتاج (19/09/2026) — **تم إصلاحه**: كانت شاشة الإحصائيات ترجع
> `ServerFailure(Failed to fetch all data, null)` لأن جدول `events` غير موجود على
> قاعدة الإنتاج (المزامنة التلقائية مُطفأة هناك)، فكان `Event.count()` داخل الإجماليات
> يُسقط استعلام `FetchAllData`/`SearchData` كاملاً. الآن أي عدّاد يفشل يُحتسب صفرًا
> ويُسجَّل في اللوج بدل إسقاط الاستعلام. يبقى مطلوبًا إنشاء الجدول لتعمل ميزة
> الفعاليات نفسها: `deploy/sql/2026-09-19_events_table.sql`.

## 8) تجميعات وقوائم عامة — أُضيفت 🆕
```graphql
query { statsTeamsWithPlayerCount { team { id name } clubName playersCount } }
query { statsPlayersByAgeCategory { ageCategory ageLabel playersCount clubsCount teamsCount } }
query { statsTransfersByTeam { team { id name } clubName transfersCount loansCount } }
query { allTechnicalStaff { id occupation person { first_name } team { name } } }
query { allBoardMembers { id role person { first_name } club { name } } }
query { allEventsGlobal(idTeam: null) { id } }   # idTeam اختياري
query { allBookings { id booking_date } }
query { globalSearch(query: "مسقط") {
  clubs { id name logo } teams { id name } players { id person { first_name card_number } } competitions { id name }
} }
```
قوائم موجودة أصلًا ✅: `allClub`, `allMembers(idTeam)`, `allMembersClub(idClub)`, `allTechnicalApparatus(idTeam)`, `allClubManagement(idClub)`, `allReservations(idStadium)`, `allEvents(idTeam)`.

---

## الأخبار (Blog) — أُضيفت 🆕 (تحتاج الـmigration أدناه)
```graphql
query { allBlogs {
  id subject short_description description status
  category         # news | competitions | players | clubs
  category_label   # أخبار | مسابقات | لاعبين | أندية
  author_name
  views_count
  time_ago         # منذ 3 ساعات / منذ يومين (يُشتق من createdAt)
  club { id name } team { id name }
} }
# عند فتح الخبر في التطبيق:
mutation { incrementBlogViews(id: "…") { status } }
```
> إدخال `category` و`author_name` متاح في `contentBlog` (إنشاء/تعديل الخبر).

## تشغيل الـmigration المطلوب 🛠️
الحقول الجديدة للأخبار والمباريات تحتاج أعمدة قاعدة بيانات. نفّذ مرّة واحدة على قاعدة الإنتاج:
```
deploy/sql/2026-09-18_blog_match_mobile_fields.sql   # الأخبار والمباريات
deploy/sql/2026-09-19_events_table.sql               # جدول الفعاليات (غير موجود على الإنتاج)
deploy/sql/2026-09-19_mobile_club_stadium_fields.sql # حقول صفحة النادي وحجز الملاعب
```
تضيف: `blogs.category`, `blogs.author_name`, `blogs.views_count`, `matches.venue`, `matches.minute`,
جدول `events`، و`clubs.founded_year`, `players.number`, `reservations.full_name`,
`stadia.badge_label`, `stadia.features_label`, `stadia.min_booking_minutes`.
كل الملفات آمنة لإعادة التشغيل (تتحقق من وجود العمود/الجدول أولًا).

## اختياري (مرحلة لاحقة) 🔜
- **المباريات:** `subMinute`.
- `manOfMatch` مخزَّن حاليًا كـ**اسم نصّي حرّ** (مثل "حسين أحمد") وليس مُعرِّف لاعب، لذا لم يُرقَّ لنوع Player (الربط بالاسم غير موثوق). لترقيته لاحقًا يلزم تخزين `id` اللاعب عند اختياره في تطبيق الفريق.
- **اختياري:** `MatchStats` (استحواذ/تسديدات…)، `Substitution` — يحتاجان جدولين جديدين + واجهة إدخال؛ مؤجَّلان حتى تُطلب فعلاً (وإلا سيعودان فارغين دائمًا).

> كل ما سبق هذا القسم **جاهز الآن** ويعمل بعد تنفيذ الـmigration.

---

## 9) صفحة النادي وحجز الملاعب — أُضيفت 🆕
> قاعدة عامة: أي حقل يحتاج **مصدر بيانات**. الحقول المشتقّة تعمل فورًا، أمّا الحقول
> التي تُدخل يدويًا فستبقى فارغة حتى تُضاف شاشة إدخال في تطبيق النادي/الفريق.

### صفحة النادي
```graphql
query { allClub {
  id name logo
  founded_year           # يُدخل يدويًا (عمود جديد)
  president_name         # مشتق: مدير النادي (club_managements.role = 1)
  head_coach_name        # مشتق: المدرب الأول في فرق النادي
  affiliated_team_label  # مشتق: فريق الدرجة الأولى إن وُجد، وإلا أقدم فريق
  star_players { id name position_label number goals }   # مشتق: أعلى الهدّافين
} }
```
- **`star_players`**: يُرتَّب بعدد الأهداف (من `scorer_matches`) وبحدّ أقصى 5 لاعبين. إن لم تُسجَّل أهداف بعد، يرجع أحدث اللاعبين المعتمدين حتى لا يظهر القسم فارغًا.
- **`position_label`** = `player_center` (مهاجم / وسط / دفاع / حارس)، و**`number`** = رقم القميص (عمود جديد، يبقى فارغًا حتى يُدخل).
- **`president_name`**: لا يوجد دور "رئيس نادٍ" في النظام (الأدوار: 1 مدير، 2 مشرف)، لذا يُرجَع **مدير النادي**. لو أردتم رئيسًا منفصلًا فهو دور/عمود جديد.

### حجز الملاعب
```graphql
query { availableTimeSlots(idStadium: "…", booking_date: "2026-09-25") {
  label start_time end_time is_available price
} }

query { allReservations(idStadium: "…") {
  id full_name phone booking_date booking_start booking_end status
  duration_minutes   # مشتق من وقتي البداية والنهاية
  total_price        # مشتق: rent (سعر الساعة) × مدة الحجز
  stadium { id name rent badge_label features_label min_booking_minutes }
} }

mutation { createReservations(content: {
  full_name: "…", phone: "…", booking_date: "2026-09-25",
  booking_start: "10:00:00", booking_end: "12:00:00", id_stadium: "…"
}) { id full_name duration_minutes total_price } }
```
- **`availableTimeSlots` صار يرجع كائنات `TimeSlot` بدل نصوص**، ويرجع **كل** فترات اليوم مع `is_available` (المحجوزة تظهر معطّلة بدل اختفائها). الحجز الملغى (`status: cancel`) لا يحجز الفترة.
- **التسعير**: `stadiums.rent` = **سعر الساعة**؛ سعر الفترة = rent × (مدة الفترة ÷ 60)، و`total_price` = rent × ساعات الحجز.
- **`min_booking_minutes`** يحدّد طول الفترة (فارغ = 60 دقيقة)، و`badge_label`/`features_label` أعمدة جديدة تُدخل يدويًا.

### مؤجَّل — يحتاج قرارًا أو شاشة إدخال 🔜
| الطلب | سبب التأجيل |
| --- | --- |
| `achievements` (إنجازات النادي) | يحتاج جدولًا جديدًا + شاشة إدخال في تطبيق النادي، وإلا يرجع فارغًا دائمًا |
| `rating` / `reviews_count` للملعب | يحتاج جدول تقييمات + من يقيّم (مستخدمو الموبايل؟)، وإلا صفر دائمًا |
| `payment_method` / `payment_status` | لا توجد بوابة دفع؛ مؤجَّل حتى تتحدد آلية الدفع |
| شاشات إدخال للحقول اليدوية | `founded_year`, `number`, `badge_label`, `features_label`, `min_booking_minutes` — تعمل عبر الـAPI الآن، وتحتاج حقولًا في تطبيق النادي لاحقًا |


## اختبار آلي للتأكّد أن الـAPI يُرجع بيانات 🧪
سكربت يفحص وجود الحقول الجديدة في المخطّط ويؤكّد رجوع بيانات فعلية (بدون أخطاء):
```
/opt/homebrew/opt/node@20/bin/node scripts/mobile-api-smoke.mjs
# أو ضد الإنتاج:
API=https://api.omkooora.com/graphql node scripts/mobile-api-smoke.mjs
```
يغطّي: حقول Blog/Match/League/Player الجديدة، `incrementBlogViews`، إجماليات `FetchAllData.GeneralStat`، وتجميعات الموبايل والبحث العام. آخر تشغيل محلّي: **19/19 ✅**.

> ملاحظة تسمية: الحقول الجديدة أُنشئت بأسماء `snake_case` كما طُلبت (transfers_count, status_label, clubs_count …) لتتطابق مع أكواد التطبيق مباشرة.
