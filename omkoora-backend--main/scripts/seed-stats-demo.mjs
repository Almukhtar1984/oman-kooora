/**
 * Rich demo data for the super-admin "الإحصاء" statistics page.
 * Creates a super-admin (role "1") login + several clubs each with teams,
 * players (varied age category & status), members, technicals, assembly,
 * board, stadiums, a league, plus loans/transfers and extra app users.
 *
 * Idempotent: clubs are keyed by name; a club's nested data is only seeded
 * the first time (when the club has no teams yet). Safe to re-run.
 *
 *   node scripts/seed-stats-demo.mjs
 */
import db from "../src/Config/DBContact.mjs";
import {
    Club, Team, Person, Members, User, TechnicalApparatus, Assembly,
    ClubManagement, Stadium, League, Transfer, Players,
} from "../src/Models/index.mjs";
import { hashPassword } from "../src/Helpers/Password.mjs";

const SUPER_EMAIL = "superadmin@tomoh.local";
const SUPER_PASSWORD = "Admin@1234";

let personSeq = 1000;
const mkPerson = async (first) => {
    personSeq += 1;
    return Person.create({
        first_name: first, second_name: "بن محمد", third_name: "التجريبي",
        tribe: "تموه", phone: `9${String(personSeq).padStart(7, "0")}`,
        card_number: `STAT-${personSeq}`, date_birth: "1998-01-01",
    });
};

const ACTIVITIES = ["كرة القدم", "كرة اليد", "كرة السلة", "كرة الطائرة"];
const CLASSES = ["firstDegree", "secondDegree", "rookies", "young"];
const STATUSES = ["accepted", "accepted", "accepted", "waiting", "rejected"];

// clubName -> { mohafada, teams: [{activity, category, players, members, technicals}] }
const CLUBS = [
    { name: "نادي مسقط الرياضي", mohafada: "مسقط", teamsCount: 4 },
    { name: "نادي ظفار الرياضي", mohafada: "ظفار", teamsCount: 3 },
    { name: "نادي صحار الرياضي", mohafada: "شمال الباطنة", teamsCount: 2 },
    { name: "نادي نزوى الرياضي", mohafada: "الداخلية", teamsCount: 3 },
];

const run = async () => {
    await db.authenticate();

    // ---- Super-admin (role "1") login ----
    let superUser = await User.findOne({ where: { email: SUPER_EMAIL } });
    if (!superUser) {
        const p = await mkPerson("مدير النظام");
        superUser = await User.create({
            email: SUPER_EMAIL, password: await hashPassword(SUPER_PASSWORD),
            role: "1", activation: true, email_verify: true, id_person: p.id,
        });
    }

    // ---- Extra app users for the "viewers by role" breakdown ----
    for (const role of ["2", "2", "3", "3", "3", "4", "5"]) {
        const email = `viewer_${role}_${personSeq}@tomoh.local`;
        const exists = await User.findOne({ where: { email } });
        if (!exists) {
            const p = await mkPerson(`مستخدم ${role}`);
            await User.create({
                email, password: await hashPassword("Viewer@1234"),
                role, activation: true, email_verify: true, id_person: p.id,
            });
        }
    }

    let clubIdx = 0;
    for (const def of CLUBS) {
        clubIdx += 1;
        const [club] = await Club.findOrCreate({
            where: { name: def.name },
            defaults: { name: def.name, governorate: def.mohafada, mohafada: def.mohafada, phone: `24${clubIdx}00000` },
        });

        // Only seed nested data the first time (club has no teams yet).
        const existingTeams = await Team.count({ where: { id_club: club.id } });
        if (existingTeams > 0) continue;

        // Club board (مجلس الإدارة): 3 members.
        for (let b = 0; b < 3; b++) {
            const p = await mkPerson(`إداري ${b + 1}`);
            await ClubManagement.create({
                role: b === 0 ? "1" : "2", membership_date: "2025-01-01",
                id_person: p.id, id_club: club.id,
            });
        }

        // General assembly (الجمعية العمومية): 8 people at club level.
        for (let a = 0; a < 8; a++) {
            await Assembly.create({
                first_name: `عضو`, second_name: `عمومية`, third_name: `${a + 1}`,
                tribe: "تموه", date_birth: "1990-01-01", card_number: `ASM-${club.id.slice(0, 4)}-${a}`,
                phone: `95${clubIdx}0000${a}`, membership_date: "2025-01-01",
                subscription_date: "2025-01-01", gender: a % 2 ? "female" : "male",
                type: "عضو عامل", id_club: club.id,
            });
        }

        // League (مسابقة) for the club.
        await League.create({
            name: `دوري ${def.name}`, numberTeams: 8, numberGroups: 2,
            description: "دوري تجريبي", startDate: "2026-01-01", expiryDate: "2026-06-01",
            externalplayer: 2, internalplayer: 20, id_club: club.id, id_user: superUser.id,
        });

        const clubTeams = [];
        for (let t = 0; t < def.teamsCount; t++) {
            const activity = ACTIVITIES[(clubIdx + t) % ACTIVITIES.length];
            const category = (t % 4) + 1;
            const team = await Team.create({
                name: `${def.name} - ${activity} ${t + 1}`,
                phone: `24${clubIdx}0${t}000`, manager_name: "مدير الفريق",
                activities: activity, code: `C${clubIdx}T${t}`, category,
                enableAddPlayer: true, id_club: club.id,
            });
            clubTeams.push(team);

            // Players: spread across age categories & statuses.
            const nPlayers = 5 + ((clubIdx + t) % 5); // 5..9
            for (let i = 0; i < nPlayers; i++) {
                const p = await mkPerson(`لاعب ${i + 1}`);
                await Players.create({
                    activity, player_center: "وسط", job: "لاعب",
                    type: i % 4 === 0 ? "external" : "internal",
                    class: CLASSES[i % CLASSES.length],
                    status: STATUSES[i % STATUSES.length],
                    id_person: p.id, id_team: team.id,
                });
            }

            // Members (أعضاء الفريق) + technical staff.
            for (let m = 0; m < 2; m++) {
                const p = await mkPerson(`عضو فريق ${m + 1}`);
                await Members.create({
                    occupation: "عضو", classification: "member", membership_date: "2025-01-01",
                    id_person: p.id, id_team: team.id,
                });
            }
            for (let k = 0; k < 2; k++) {
                const p = await mkPerson(`مدرب ${k + 1}`);
                await TechnicalApparatus.create({
                    occupation: k === 0 ? "مدرب أول" : "مدرب مساعد", classification: "firstDegree",
                    membership_date: "2025-01-01", testimony_experience: "شهادة B",
                    paid: true, status: "accepted", id_person: p.id, id_team: team.id,
                });
            }

            // A stadium for the first team of each club.
            if (t === 0) {
                await Stadium.create({
                    name: `ملعب ${def.name}`, about: "ملعب تجريبي", attachments: "",
                    type: "natural", sport: "كرة القدم", rent: 50,
                    mohafada: def.mohafada, start_time: "08:00:00", end_time: "22:00:00",
                    id_team: team.id,
                });
            }
        }

        // Loans + transfers between this club's teams (needs >= 2 teams).
        if (clubTeams.length >= 2) {
            const somePlayers = await Players.findAll({ where: { id_team: clubTeams[0].id }, limit: 3 });
            for (let i = 0; i < somePlayers.length; i++) {
                await Transfer.create({
                    transition_type: i === 0 ? "loan" : "transition",
                    status: "accepted", type: "internal",
                    date_start: "2026-01-01", date_end: "2026-06-01",
                    id_player: somePlayers[i].id, id_team_from: clubTeams[0].id,
                    id_team_to: clubTeams[1].id, id_club_to: club.id,
                });
            }
        }
    }

    // A few cross-club extra transfers to make the numbers interesting.
    const anyPlayers = await Players.findAll({ limit: 6 });
    const anyTeams = await Team.findAll({ limit: 2 });
    if (anyPlayers.length >= 4 && anyTeams.length >= 2) {
        for (let i = 0; i < 4; i++) {
            await Transfer.create({
                transition_type: i % 2 === 0 ? "loan" : "transition",
                status: i % 3 === 0 ? "waiting" : "accepted", type: "external",
                date_start: "2026-02-01", date_end: "2026-07-01",
                id_player: anyPlayers[i].id, id_team_from: anyTeams[0].id,
                id_team_to: anyTeams[1].id,
            });
        }
    }

    const [clubs, teams, players] = await Promise.all([Club.count(), Team.count(), Players.count()]);
    console.log("\n✅ Stats demo seed complete.");
    console.log(`   Super-admin login: ${SUPER_EMAIL}  /  ${SUPER_PASSWORD}`);
    console.log(`   Clubs: ${clubs}   Teams: ${teams}   Players: ${players}`);
    await db.close();
};

run().catch(async (e) => {
    console.error("Seed failed:", e?.message || e);
    try { await db.close(); } catch {}
    process.exit(1);
});
