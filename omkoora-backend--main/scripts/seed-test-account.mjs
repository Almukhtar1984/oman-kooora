/**
 * Create a dedicated TEST login for an external developer, without putting any
 * password in the repo. The password is supplied at run time via env vars.
 *
 * Usage (on the server):
 *   TEST_ACCOUNT_EMAIL=dev-test@omkooora.com \
 *   TEST_ACCOUNT_PASSWORD='choose-a-strong-one' \
 *   node scripts/seed-test-account.mjs
 *
 * Optional env:
 *   TEST_ACCOUNT_ROLE     "1".."5" (default "2" = club admin)
 *   TEST_ACCOUNT_CLUB_ID  attach to this club (default: the first existing club)
 *
 * Idempotent: keyed on the email. Safe to re-run (updates the password).
 */
import db from "../src/Config/DBContact.mjs";
import { Club, Team, Players, Person, User, ClubManagement, Permission } from "../src/Models/index.mjs";
import { hashPassword } from "../src/Helpers/Password.mjs";

const EMAIL = process.env.TEST_ACCOUNT_EMAIL;
const PASSWORD = process.env.TEST_ACCOUNT_PASSWORD;
const ROLE = process.env.TEST_ACCOUNT_ROLE || "2";
const CLUB_ID = process.env.TEST_ACCOUNT_CLUB_ID || null;
// Portal (mobile-app) login is by phone + civil number, no password. These
// create a test PLAYER the developer can log in with via authenticatePortalPerson.
const PORTAL_PHONE = process.env.TEST_PORTAL_PHONE || "90000001";
const PORTAL_CARD = process.env.TEST_PORTAL_CARD || "10000001";
const fullGrant = "1,2,3,4,5,6,7,8,9,10";

const run = async () => {
    if (!EMAIL || !PASSWORD) {
        throw new Error("Set TEST_ACCOUNT_EMAIL and TEST_ACCOUNT_PASSWORD env vars.");
    }
    if (PASSWORD.length < 8) {
        throw new Error("TEST_ACCOUNT_PASSWORD must be at least 8 characters.");
    }
    await db.authenticate();

    const club = CLUB_ID
        ? await Club.findByPk(CLUB_ID)
        : await Club.findOne({ order: [["createdAt", "ASC"]] });
    if (!club) throw new Error("No club found to attach the test account to (pass TEST_ACCOUNT_CLUB_ID).");

    let user = await User.findOne({ where: { email: EMAIL } });
    if (user) {
        await User.update(
            { password: await hashPassword(PASSWORD), activation: true, email_verify: true, role: ROLE },
            { where: { id: user.id } }
        );
        console.log(`\n✅ Test account updated: ${EMAIL} (role ${ROLE}) → ${club.name}`);
    } else {
        const suffix = Date.now().toString().slice(-6);
        const person = await Person.create({
            first_name: "حساب", second_name: "تجريبي", third_name: "للمطوّرة",
            tribe: "تموه", phone: `9${suffix}`, card_number: `TESTACC-${suffix}`, date_birth: "1990-01-01",
        });
        await ClubManagement.create({ role: "1", membership_date: "2025-01-01", id_person: person.id, id_club: club.id });
        user = await User.create({
            email: EMAIL, password: await hashPassword(PASSWORD),
            role: ROLE, activation: true, email_verify: true, id_person: person.id,
        });
        await Permission.create({
            teams: fullGrant, members: fullGrant, technicals: fullGrant, players: fullGrant,
            transfer_players: fullGrant, loan_players: fullGrant, assembly: fullGrant, inbox: fullGrant,
            outbox: fullGrant, meeting: fullGrant, blogs: fullGrant, forms: fullGrant, permissions: fullGrant,
            complaints: fullGrant, expenses: fullGrant, leagues: fullGrant, id_user: user.id,
        });
        console.log(`\n✅ Test account created: ${EMAIL} (role ${ROLE}) → ${club.name}`);
    }

    console.log("   Share these credentials with the developer (not committed anywhere).");

    // --- Portal (mobile app) test player: login by phone + civil number ------
    let portalPerson = await Person.findOne({ where: { card_number: PORTAL_CARD } });
    if (portalPerson) {
        // Make sure phone matches what we advertise.
        if (portalPerson.phone !== PORTAL_PHONE) {
            await Person.update({ phone: PORTAL_PHONE }, { where: { id: portalPerson.id } });
        }
        console.log(`\n✅ Portal test player already exists — phone ${PORTAL_PHONE} / civil ${PORTAL_CARD}`);
    } else {
        const team = await Team.findOne({ where: { id_club: club.id }, order: [["createdAt", "ASC"]] });
        if (!team) {
            console.log("\n⚠️ No team under the club — skipped the portal player (create a team first, then re-run).");
        } else {
            const p = await Person.create({
                first_name: "لاعب", second_name: "تجريبي", third_name: "للمطوّرة",
                tribe: "تموه", phone: PORTAL_PHONE, card_number: PORTAL_CARD, date_birth: "2000-01-01",
            });
            await Players.create({
                activity: "لاعب", player_center: "وسط", job: "لاعب",
                type: "internal", class: "firstDegree", status: "accepted",
                id_person: p.id, id_team: team.id,
            });
            console.log(`\n✅ Portal test player created — phone ${PORTAL_PHONE} / civil ${PORTAL_CARD} (team: ${team.name})`);
        }
    }
    console.log("   Mobile-app login: authenticatePortalPerson(phone, card_number) — no password.");

    await db.close();
};

run().catch(async (e) => { console.error("Failed:", e?.message || e); try { await db.close(); } catch {} process.exit(1); });
