// One-time backfill: add every club's players + technical staff + board members
// to its general assembly (العمومية), so no club is left with an empty list.
// Same records the "إضافة عضو موجود" flow creates; idempotent by card number.
//
// Run once (node 20):  node scripts/backfill-assembly-people.mjs
import { Club, Team, Person, Players, TechnicalApparatus, Members, Assembly } from "../src/Models/index.mjs";

const cap = (s) => ("" + (s ?? "")).slice(0, 20);
const today = new Date().toISOString().slice(0, 10);

// people.date_birth is a VARCHAR in production and holds junk for some rows
// ("Invalid Date", Excel serials like 25569, "30-01-01", ""). assemblies.date_birth
// is a real DATE column, so anything that is not a plain YYYY-MM-DD calendar date
// has to become NULL — otherwise the whole club's insert is rejected.
const asDate = (value) => {
    const s = ("" + (value ?? "")).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return s;
};

const CHUNK = 500;

async function backfillClub(idClub) {
    const withClub = () => ({
        include: [
            { model: Team, as: "team", required: true, where: { id_club: idClub } },
            { model: Person, as: "person", required: true },
        ],
    });

    const [players, technicals, members] = await Promise.all([
        Players.findAll(withClub()),
        TechnicalApparatus.findAll(withClub()),
        Members.findAll(withClub()),
    ]);

    const groups = [
        { rows: players, type: "لاعب" },
        { rows: technicals, type: "جهاز فني" },
        { rows: members, type: "عضو" },
    ];

    const existing = await Assembly.findAll({ where: { id_club: idClub }, attributes: ["card_number"] });
    const seen = new Set(existing.map((a) => ("" + (a.card_number ?? "")).trim()).filter(Boolean));

    const toCreate = [];
    let skipped = 0, total = 0;
    for (const g of groups) {
        for (const row of g.rows) {
            const p = row.person;
            if (!p) continue;
            total++;
            const card = ("" + (p.card_number ?? "")).trim();
            if (card && seen.has(card)) { skipped++; continue; }
            if (card) seen.add(card);
            toCreate.push({
                first_name: cap(p.first_name),
                second_name: cap(p.second_name),
                third_name: cap(p.third_name),
                tribe: cap(p.tribe),
                card_number: p.card_number || null,
                phone: p.phone ? ("" + p.phone).slice(0, 20) : null,
                date_birth: asDate(p.date_birth),
                personal_picture: p.personal_picture || null,
                type: g.type,
                membership_date: today,
                id_club: idClub,
            });
        }
    }

    for (let i = 0; i < toCreate.length; i += CHUNK) {
        await Assembly.bulkCreate(toCreate.slice(i, i + CHUNK), { validate: false });
    }
    return { added: toCreate.length, skipped, total };
}

const clubs = await Club.findAll({ attributes: ["id", "name"] });
let grandAdded = 0, grandSkipped = 0;
for (const c of clubs) {
    const r = await backfillClub(c.id);
    grandAdded += r.added;
    grandSkipped += r.skipped;
    console.log(`• ${c.name}: +${r.added} added, ${r.skipped} skipped (of ${r.total})`);
}
console.log(`\n✅ DONE — ${clubs.length} clubs, ${grandAdded} added, ${grandSkipped} already present.`);
process.exit(0);
