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
deploy/sql/2026-09-18_blog_match_mobile_fields.sql
```
يضيف: `blogs.category`, `blogs.author_name`, `blogs.views_count`, `matches.venue`, `matches.minute`.

## اختياري (مرحلة لاحقة) 🔜
- **المباريات:** `subMinute`.
- `manOfMatch` مخزَّن حاليًا كـ**اسم نصّي حرّ** (مثل "حسين أحمد") وليس مُعرِّف لاعب، لذا لم يُرقَّ لنوع Player (الربط بالاسم غير موثوق). لترقيته لاحقًا يلزم تخزين `id` اللاعب عند اختياره في تطبيق الفريق.
- **اختياري:** `MatchStats` (استحواذ/تسديدات…)، `Substitution` — يحتاجان جدولين جديدين + واجهة إدخال؛ مؤجَّلان حتى تُطلب فعلاً (وإلا سيعودان فارغين دائمًا).

> كل ما سبق هذا القسم **جاهز الآن** ويعمل بعد تنفيذ الـmigration.

---

## 9) طلبات جديدة: صفحة النادي وحجز الملاعب — الحالة والخطة 📋
> قاعدة عامة: أي حقل جديد يحتاج **مصدر بيانات**. إن لم تكن هناك شاشة إدخال في
> تطبيق النادي/الفريق، سيرجع الحقل فارغًا دائمًا مهما أضفناه في الـAPI.

### صفحة النادي (Club Details)
| الحقل | الحالة | ما يلزم |
| --- | --- | --- |
| `achievements` | 🔴 لا يوجد | جدول جديد `club_achievements` (title, subtitle, is_video) + شاشة إدخال في تطبيق النادي |
| `star_players` | 🟠 جزئيًا | اللاعبون موجودون، و`player_center` يصلح `position_label`. **رقم القميص غير مخزَّن** ولا توجد علامة "نجم" → إمّا عمودان جديدان (`number`, `is_star`) بإدخال يدوي، أو اشتقاق النجوم من الهدّافين (`ScorerMatch`) بدون رقم قميص |
| `founded_year` | 🟠 عمود جديد | `clubs.founded_year` + حقل في شاشة بيانات النادي |
| `affiliated_team_label` | 🟠 يحتاج تعريف | يمكن اشتقاقه من فرق النادي، لكن ما القاعدة؟ (الفريق الأول؟ أول نشاط؟) أو عمود جديد يُدخَل يدويًا |
| `president_name` | 🟠 يحتاج قرار | `club_managements.role` حاليًا `1=مدير` و`2=مشرف` فقط، لا يوجد دور "رئيس". إمّا نعتبر مدير النادي (role=1) هو الرئيس، أو نضيف دورًا/عمودًا |
| `head_coach_name` | 🟢 مشتق جاهز | من الجهاز الفني (`occupation = "مدرب أول"`) لفرق النادي — ينفَّذ بدون تغيير قاعدة بيانات |

### حجز الملاعب (Stadiums / Reservations)
| الحقل | الحالة | ما يلزم |
| --- | --- | --- |
| `duration_minutes` | 🟢 مشتق جاهز | من `booking_start` و`booking_end` |
| `full_name` (input + type) | 🟠 عمود جديد | `reservations.full_name` + إضافته في `contentReservations` والـresolver |
| `total_price` | 🟠 يحتاج تأكيد | حسابه = `stadiums.rent` × عدد الساعات (هل `rent` سعر الساعة؟) أو تخزينه وقت الحجز |
| `payment_method` / `payment_status` | 🟠 عمودان جديدان | لا توجد بوابة دفع؛ القيم ستكون يدوية (cash افتراضيًا + pending/paid) — يلزم تحديد من يغيّرها |
| `availableTimeSlots` → `[TimeSlot]` | 🟢 قابل للتنفيذ | تغيير شكل الإرجاع آمن (لا يستخدمه أي تطبيق ويب). `is_available` يُحسب من الحجوزات، `price` من `rent`، والمدة حاليًا ساعة ثابتة |
| `rating` / `reviews_count` | 🔴 لا يوجد | جدول تقييمات `stadium_reviews` + شاشة تقييم في تطبيق الموبايل، وإلا القيم صفر دائمًا |
| `badge_label` / `features_label` / `min_booking_minutes` | 🟠 أعمدة جديدة | على `stadiums` + إدخال في تطبيق النادي (`min_booking_minutes` حاليًا ثابت 60 دقيقة في مولّد الأوقات) |

**المقترح للتنفيذ بالترتيب:** (1) المشتقّات بلا قاعدة بيانات — `head_coach_name`, `duration_minutes`, `TimeSlot`. (2) أعمدة بسيطة بـmigration واحد — `full_name`, `founded_year`, `number`, `badge_label`, `features_label`, `min_booking_minutes`, حقول الدفع. (3) الجداول الجديدة + شاشات الإدخال — الإنجازات والتقييمات.

## اختبار آلي للتأكّد أن الـAPI يُرجع بيانات 🧪
سكربت يفحص وجود الحقول الجديدة في المخطّط ويؤكّد رجوع بيانات فعلية (بدون أخطاء):
```
/opt/homebrew/opt/node@20/bin/node scripts/mobile-api-smoke.mjs
# أو ضد الإنتاج:
API=https://api.omkooora.com/graphql node scripts/mobile-api-smoke.mjs
```
يغطّي: حقول Blog/Match/League/Player الجديدة، `incrementBlogViews`، إجماليات `FetchAllData.GeneralStat`، وتجميعات الموبايل والبحث العام. آخر تشغيل محلّي: **19/19 ✅**.

> ملاحظة تسمية: الحقول الجديدة أُنشئت بأسماء `snake_case` كما طُلبت (transfers_count, status_label, clubs_count …) لتتطابق مع أكواد التطبيق مباشرة.
