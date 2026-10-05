#!/usr/bin/env node
/**
 * Why does a club's الأعضاء page show "لا يوجد بيانات"?
 *
 * The club app lists board members / technical staff / team managers by joining
 * them to the club's teams. Teams are soft-deleted (paranoid), so a row whose
 * team was deleted still sits in the database but disappears from every
 * club-wide list — which looks exactly like "the data vanished".
 *
 * This prints, per club: live vs deleted teams, and how many rows hang on each.
 * READ-ONLY — it runs SELECTs only and prints counts, never names or any other
 * personal data.
 *
 *   node scripts/diagnose-club-lists.mjs            # every club
 *   node scripts/diagnose-club-lists.mjs "اسم النادي"  # one club
 */
import db from "../src/Config/DBContact.mjs";

const wanted = process.argv[2]?.trim();

const q = async (sql, replacements = {}) => {
    // logging: false — the dev config echoes every SQL statement otherwise.
    const [rows] = await db.query(sql, { replacements, logging: false });
    return rows;
};

const run = async () => {
    await db.authenticate();

    const clubs = await q(`
        SELECT c.id, c.name,
            (SELECT COUNT(*) FROM teams t WHERE t.id_club = c.id AND t.deletedAt IS NULL)     AS live_teams,
            (SELECT COUNT(*) FROM teams t WHERE t.id_club = c.id AND t.deletedAt IS NOT NULL) AS deleted_teams
        FROM clubs c
        WHERE c.deletedAt IS NULL ${wanted ? "AND c.name LIKE :like" : ""}
        ORDER BY c.name
    `, { like: `%${wanted}%` });

    if (!clubs.length) {
        console.log(wanted ? `لا يوجد نادٍ بالاسم: ${wanted}` : "لا توجد أندية.");
        return;
    }

    // rows that the club page shows  vs  rows hidden behind a deleted team
    const countFor = async (table, clubId) => {
        const [row] = await q(`
            SELECT
                SUM(CASE WHEN t.deletedAt IS NULL     THEN 1 ELSE 0 END) AS visible,
                SUM(CASE WHEN t.deletedAt IS NOT NULL THEN 1 ELSE 0 END) AS hidden
            FROM ${table} x
            JOIN teams t ON t.id = x.id_team
            WHERE t.id_club = :clubId AND x.deletedAt IS NULL
        `, { clubId });
        return { visible: Number(row?.visible || 0), hidden: Number(row?.hidden || 0) };
    };

    console.log("\nالنادي | فرق حيّة | فرق محذوفة | مجلس الإدارة (ظاهر/مخفي) | الجهاز الفني (ظاهر/مخفي) | اللاعبون (ظاهر/مخفي) | مدراء الفرق\n");

    for (const club of clubs) {
        const [members, technicals, players] = await Promise.all([
            countFor("members", club.id),
            countFor("technical_apparatus", club.id),
            countFor("players", club.id),
        ]);
        const [mgr] = await q(`
            SELECT COUNT(*) AS n FROM club_managements cm
            WHERE cm.id_club = :clubId AND cm.deletedAt IS NULL
        `, { clubId: club.id });

        const flag = (c) => (c.visible === 0 && c.hidden > 0 ? "  ← مخفي خلف فرق محذوفة" : "");
        console.log(
            `${club.name} | ${club.live_teams} | ${club.deleted_teams} | ` +
            `${members.visible}/${members.hidden}${flag(members)} | ` +
            `${technicals.visible}/${technicals.hidden}${flag(technicals)} | ` +
            `${players.visible}/${players.hidden}${flag(players)} | ${mgr?.n ?? 0}`
        );
    }

    console.log(`
القراءة:
  - "ظاهر" = ما تعرضه صفحة النادي فعلاً (مرتبط بفريق حيّ).
  - "مخفي" = صفوف موجودة في القاعدة لكن فريقها محذوف حذفاً ناعماً، فلا تظهر.
  - إن كان الظاهر 0 والمخفي أكبر من 0 → الفرق حُذفت والسجلات سليمة (يمكن استرجاع الفريق).
  - إن كان الاثنان 0 → لا توجد سجلات أصلاً لهذا النادي.
`);
};

run()
    .catch((e) => { console.error("فشل التشخيص:", e?.message || e); process.exitCode = 1; })
    .finally(() => db.close());
