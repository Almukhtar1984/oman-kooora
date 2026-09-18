/**
 * Local demo seed — creates the minimum data needed to log into the team app
 * and see the الجهاز الفني (technical staff) cards with the "إضافة مرفقات" menu.
 *
 * Idempotent: safe to run more than once (keyed on the demo email / card numbers).
 *
 *   node scripts/seed-local-demo.mjs
 */
import db from "../src/Config/DBContact.mjs";
import {
    Club, Team, Person, Members, User, Permission, TechnicalApparatus,
} from "../src/Models/index.mjs";
import { hashPassword } from "../src/Helpers/Password.mjs";

const EMAIL = "demo@tomoh.local";
const PASSWORD = "Demo@1234";
const fullGrant = "1,2,3,4,5,6,7,8,9,10";

const run = async () => {
    await db.authenticate();
    // The running server already synced the schema (incl. the new
    // id_technical_apparatus column); we only insert rows here.

    const [club] = await Club.findOrCreate({
        where: { name: "نادي تموه التجريبي" },
        defaults: {
            name: "نادي تموه التجريبي", governorate: "مسقط", phone: "24000000",
        },
    });

    const [team] = await Team.findOrCreate({
        where: { name: "الفريق التجريبي" },
        defaults: {
            name: "الفريق التجريبي", phone: "24000001", manager_name: "مدير الفريق",
            activities: "كرة القدم", code: "DEMO-01", enableAddPlayer: true,
            id_club: club.id,
        },
    });

    // --- Admin person + login user + membership + full permissions ---
    const [adminPerson] = await Person.findOrCreate({
        where: { card_number: "DEMO-ADMIN-0001" },
        defaults: {
            first_name: "مدير", second_name: "الفريق", third_name: "التجريبي",
            tribe: "تموه", phone: "90000001", card_number: "DEMO-ADMIN-0001",
            date_birth: "1990-01-01",
        },
    });

    let user = await User.findOne({ where: { email: EMAIL } });
    if (!user) {
        user = await User.create({
            email: EMAIL,
            password: await hashPassword(PASSWORD),
            role: "3",
            activation: true,
            email_verify: true,
            id_person: adminPerson.id,
        });
    }

    await Members.findOrCreate({
        where: { id_person: adminPerson.id, id_team: team.id },
        defaults: {
            occupation: "مدير الفريق", classification: "manager",
            membership_date: "2026-01-01",
            id_person: adminPerson.id, id_team: team.id,
        },
    });

    await Permission.findOrCreate({
        where: { id_user: user.id },
        defaults: {
            teams: fullGrant, members: fullGrant, technicals: fullGrant,
            players: fullGrant, transfer_players: fullGrant, loan_players: fullGrant,
            assembly: fullGrant, inbox: fullGrant, outbox: fullGrant,
            meeting: fullGrant, blogs: fullGrant, forms: fullGrant,
            permissions: fullGrant, complaints: fullGrant, expenses: fullGrant,
            leagues: fullGrant, id_user: user.id,
        },
    });

    // --- A technical-staff member so الجهاز الفني cards render ---
    const [techPerson] = await Person.findOrCreate({
        where: { card_number: "DEMO-TECH-0001" },
        defaults: {
            first_name: "أحمد", second_name: "المدرب", third_name: "التجريبي",
            tribe: "تموه", phone: "90000002", card_number: "DEMO-TECH-0001",
            date_birth: "1985-05-05",
        },
    });

    await TechnicalApparatus.findOrCreate({
        where: { id_person: techPerson.id, id_team: team.id },
        defaults: {
            occupation: "مدرب أول", classification: "firstDegree",
            membership_date: "2026-01-01", testimony_experience: "شهادة تدريب B",
            paid: true, status: "accepted",
            id_person: techPerson.id, id_team: team.id,
        },
    });

    console.log("\n✅ Seed complete.");
    console.log(`   Login:    ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
    console.log(`   Team:     ${team.name} (${team.id})`);
    await db.close();
};

run().catch(async (e) => {
    console.error("Seed failed:", e?.message || e);
    try { await db.close(); } catch {}
    process.exit(1);
});
