import db from "../src/Config/DBContact.mjs";
import { Club, Team, Person, User, ClubManagement, Permission, Members, Players, Assembly } from "../src/Models/index.mjs";
import { hashPassword } from "../src/Helpers/Password.mjs";

const PW = "Test@12345";
const grant = "1,2,3,4,5,6,7,8,9,10";
let seq = 700000;
const mkPerson = (first, extra = {}) => Person.create({
  first_name: first, second_name: "تجريبي", third_name: "للمبرمج", tribe: "تجريبي",
  phone: `9${++seq}`, card_number: `TESTX-${seq}`, date_birth: "1995-01-01", ...extra,
});
const ensureUser = async (email, role, id_person) => {
  let u = await User.findOne({ where: { email } });
  if (u) { await User.update({ password: await hashPassword(PW), activation: true, email_verify: true }, { where: { id: u.id } }); return u; }
  return User.create({ email, password: await hashPassword(PW), role, activation: true, email_verify: true, id_person });
};

const run = async () => {
  await db.authenticate();

  // 1) نادٍ تجريبي معزول
  const [club] = await Club.findOrCreate({
    where: { name: "نادي تجريبي للمبرمج" },
    defaults: { name: "نادي تجريبي للمبرمج", governorate: "مسقط", mohafada: "مسقط", phone: "24000099" },
  });

  // 2) فريقان
  const mkTeam = async (name, activities, code) => (await Team.findOrCreate({
    where: { name }, defaults: { name, phone: "24000098", manager_name: "مدير تجريبي", activities, code, enableAddPlayer: true, id_club: club.id },
  }))[0];
  const teamA = await mkTeam("فريق تجريبي أ", "كرة القدم", "TX-A");
  const teamB = await mkTeam("فريق تجريبي ب", "كرة اليد", "TX-B");

  // 3) لاعبون + أعضاء (فقط إن كان الفريق فارغًا)
  if ((await Players.count({ where: { id_team: teamA.id } })) === 0) {
    const cls = ["firstDegree","secondDegree","rookies","young"];
    const st = ["accepted","accepted","waiting","rejected"];
    for (let i = 0; i < 6; i++) {
      const p = await mkPerson(`لاعب ${i+1}`);
      await Players.create({ activity: "كرة القدم", player_center: "وسط", job: "لاعب", type: "internal", class: cls[i%4], status: st[i%4], id_person: p.id, id_team: teamA.id });
    }
    for (let i = 0; i < 3; i++) {
      const p = await mkPerson(`عضو عمومية ${i+1}`);
      await Assembly.create({ first_name: p.first_name, second_name: p.second_name, third_name: p.third_name, tribe: p.tribe, date_birth: "1990-01-01", card_number: p.card_number, phone: p.phone, membership_number: `${1000+i}`, membership_date: "2025-01-01", subscription_date: "2025-01-01", gender: "male", type: "عامل", id_club: club.id });
    }
  }

  // 4) الحسابات (كلها بكلمة مرور معروفة)
  // سوبر آدمن (يرى المنصة كاملة)
  const superP = (await Person.findOne({ where: { card_number: "TESTX-SUPER" } })) || await mkPerson("مدير النظام", { card_number: "TESTX-SUPER" });
  await ensureUser("test.super@omkooora.com", "1", superP.id);

  // مدير نادٍ (تطبيق النادي)
  let clubP = await Person.findOne({ where: { card_number: "TESTX-CLUB" } });
  if (!clubP) { clubP = await mkPerson("مدير النادي", { card_number: "TESTX-CLUB" }); await ClubManagement.create({ role: "1", membership_date: "2025-01-01", id_person: clubP.id, id_club: club.id }); }
  const clubU = await ensureUser("test.club@omkooora.com", "2", clubP.id);
  await Permission.findOrCreate({ where: { id_user: clubU.id }, defaults: { teams: grant, members: grant, technicals: grant, players: grant, transfer_players: grant, loan_players: grant, assembly: grant, inbox: grant, outbox: grant, meeting: grant, blogs: grant, forms: grant, permissions: grant, complaints: grant, expenses: grant, leagues: grant, id_user: clubU.id } });

  // مدير فريق (تطبيق الفريق) — لفريق تجريبي أ
  let teamP = await Person.findOne({ where: { card_number: "TESTX-TEAM" } });
  if (!teamP) { teamP = await mkPerson("مدير الفريق", { card_number: "TESTX-TEAM" }); }
  await Members.findOrCreate({ where: { id_person: teamP.id, id_team: teamA.id }, defaults: { occupation: "مدير الفريق", classification: "manager", membership_date: "2025-01-01", id_person: teamP.id, id_team: teamA.id } });
  await ensureUser("test.team@omkooora.com", "3", teamP.id);

  console.log("\n================ حزمة الاختبار جاهزة ================");
  console.log("النادي التجريبي:", club.name, "| الفرق:", teamA.name + "، " + teamB.name);
  console.log("كلمة المرور للجميع:", PW);
  console.log("\n| الدور        | البريد                     | التطبيق              |");
  console.log("| سوبر آدمن     | test.super@omkooora.com    | super-admin.omkooora |");
  console.log("| مدير نادٍ      | test.club@omkooora.com     | club.omkooora        |");
  console.log("| مدير فريق      | test.team@omkooora.com     | team.omkooora        |");
  console.log("====================================================\n");
  await db.close();
};
run().catch(async (e) => { console.error("فشل:", e?.message || e); try { await db.close(); } catch {} process.exit(1); });
