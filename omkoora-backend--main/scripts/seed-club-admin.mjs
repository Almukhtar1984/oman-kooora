/**
 * Creates a club-admin login (User role "2" + ClubManagement role "1")
 * tied to an existing club, to test the club app's statistics page.
 *   node scripts/seed-club-admin.mjs
 */
import db from "../src/Config/DBContact.mjs";
import { Club, Person, User, ClubManagement, Permission } from "../src/Models/index.mjs";
import { hashPassword } from "../src/Helpers/Password.mjs";

const EMAIL = "clubadmin@tomoh.local";
const PASSWORD = "Club@1234";
const fullGrant = "1,2,3,4,5,6,7,8,9,10";

const run = async () => {
    await db.authenticate();
    const club = await Club.findOne({ where: { name: "نادي مسقط الرياضي" } });
    if (!club) throw new Error("Club 'نادي مسقط الرياضي' not found — run seed-stats-demo.mjs first.");

    let user = await User.findOne({ where: { email: EMAIL } });
    if (!user) {
        const person = await Person.create({
            first_name: "مدير", second_name: "النادي", third_name: "التجريبي",
            tribe: "تموه", phone: "97000001", card_number: "CLUBADMIN-0001", date_birth: "1985-01-01",
        });
        await ClubManagement.create({ role: "1", membership_date: "2025-01-01", id_person: person.id, id_club: club.id });
        user = await User.create({
            email: EMAIL, password: await hashPassword(PASSWORD),
            role: "2", activation: true, email_verify: true, id_person: person.id,
        });
        await Permission.create({
            teams: fullGrant, members: fullGrant, technicals: fullGrant, players: fullGrant,
            transfer_players: fullGrant, loan_players: fullGrant, assembly: fullGrant, inbox: fullGrant,
            outbox: fullGrant, meeting: fullGrant, blogs: fullGrant, forms: fullGrant, permissions: fullGrant,
            complaints: fullGrant, expenses: fullGrant, leagues: fullGrant, id_user: user.id,
        });
    }

    console.log(`\n✅ Club-admin ready: ${EMAIL} / ${PASSWORD}  → ${club.name}`);
    await db.close();
};

run().catch(async (e) => { console.error("Failed:", e?.message || e); try { await db.close(); } catch {} process.exit(1); });
