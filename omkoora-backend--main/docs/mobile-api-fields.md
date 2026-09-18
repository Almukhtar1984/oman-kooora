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
- **المباريات:** `subMinute`، وترقية `manOfMatch`/`best_player` لنوع Player.
- **اختياري:** `MatchStats` (استحواذ/تسديدات…)، `Substitution`.

> كل ما سبق هذا القسم **جاهز الآن** ويعمل بعد تنفيذ الـmigration.

> ملاحظة تسمية: الحقول الجديدة أُنشئت بأسماء `snake_case` كما طُلبت (transfers_count, status_label, clubs_count …) لتتطابق مع أكواد التطبيق مباشرة.
