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
> 🔜 `venue` (الملعب) و`minute` (الدقيقة المباشرة) و`subMinute`: تحتاج أعمدة جديدة — قيد التنفيذ في مرحلة لاحقة.
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

## 8) قوائم عامة جاهزة ✅
- كل الأندية: `allClub { id name logo }`
- كل الأعضاء: `allMembers(idTeam)` · لكل نادٍ: `allMembersClub(idClub)`
- الأجهزة الفنية: `allTechnicalApparatus(idTeam)` · لكل نادٍ: `allTechnicalApparatusClub(idClub)`
- مجالس الإدارة: `allClubManagement(idClub)`
- الحجوزات: `allReservations(idStadium)` · الفعاليات: `allEvents(idTeam)`

---

## قيد التنفيذ (مراحل لاحقة) 🔜
تحتاج تعديلات قاعدة بيانات أو استعلامات تجميعية جديدة:
- **الأخبار (Blog):** `category`, `category_label`, `author_name`, `views_count` (+ عدّاد مشاهدات). `time_ago` يُشتق من `createdAt`.
- **المباريات:** `venue`, `minute`, `subMinute`, وترقية `manOfMatch`/`best_player` لنوع Player.
- **استعلامات تجميعية باسم مخصّص:** `statsTeamsWithPlayerCount`, `statsPlayersByAgeCategory`, `statsTransfersByTeam`, `allEventsGlobal`, `allBookings`, `globalSearch` — وأنواعها المساعدة (`TeamWithCount`, `PlayersByAge`, `TeamTransfersStats`, `Loan`, `GlobalSearchResult`).
- **اختياري:** `MatchStats`, `Substitution`.

> ملاحظة تسمية: الحقول الجديدة أُنشئت بأسماء `snake_case` كما طُلبت (transfers_count, status_label, clubs_count …) لتتطابق مع أكواد التطبيق مباشرة.
