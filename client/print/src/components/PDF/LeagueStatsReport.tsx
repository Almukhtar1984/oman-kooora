import React, { useMemo, useState } from "react";
import {
    Page,
    Text,
    Image,
    Document,
    StyleSheet,
    View,
    Font,
    PDFViewer,
    pdf,
} from "@react-pdf/renderer";

import { cardPalette } from "./Card";
import { usePrintAssets } from "../../hooks/usePrintAssets";
import PrintProgress from "../PrintProgress";

// ── Data shapes (loose, mirroring the untyped GraphQL payloads used elsewhere) ─
export interface StatsTeam {
    id?: string;
    name?: string;
    logo?: string | null;
    club?: { logo?: string | null } | null;
}
export interface RankingRow {
    team?: StatsTeam;
    points?: number;
    matchesPlayed?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    goalDifference?: number;
    group?: string;
}
export interface ScorerRow {
    team?: string;
    Goal?: number;
    PlayerID?: {
        id?: string;
        number?: string;
        player?: { person?: { first_name?: string; second_name?: string; third_name?: string; tribe?: string } };
    };
}
export interface CardRow {
    player?: string;
    number?: string;
    count?: number;
    team?: { id?: string; name?: string };
}
export interface AlertRow {
    player?: string;
    number?: string;
    yellowCount?: number;
    team?: { id?: string; name?: string };
    matches?: Array<{ firstTeam?: string; secondTeam?: string; date?: string }>;
}
export interface ParticipatingTeamRow {
    id?: string;
    group?: string;
    team?: StatsTeam;
    league?: { name?: string };
}

export interface StandingRow {
    teamId?: string;
    name: string;
    logo?: string | null;
    points: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
}

Font.register({
    family: "Montserrat-Arabic",
    fonts: [
        { src: "/fonts/Montserrat-Arabic-Regular.ttf", fontStyle: "normal", fontWeight: 400 },
        { src: "/fonts/Montserrat-Arabic-Medium.ttf", fontStyle: "normal", fontWeight: 700 },
    ],
});

// ─────────────────────────── pure helpers (tested) ───────────────────────────

export const scorerName = (s: ScorerRow | undefined): string => {
    const p = s?.PlayerID?.player?.person;
    return [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ").trim();
};

// Head-to-head-agnostic league sort: points, then goal difference, then goals
// scored — the same tie-break the dashboard's LeagueStats modal uses.
export const sortStanding = (a: StandingRow, b: StandingRow): number => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
};

// Merge the server-computed ranking with the full participating-team list so
// teams that haven't played yet still appear (as zero rows) and every row
// carries a logo. Returns [groupName, rows[]] sorted by group then standing.
export const buildGroupedStandings = (
    ranking: RankingRow[] | undefined,
    participatingTeams: ParticipatingTeamRow[] | undefined,
): Array<[string, StandingRow[]]> => {
    const logoByTeam = new Map<string, string | null | undefined>();
    const groupByTeam = new Map<string, string>();
    for (const pt of participatingTeams || []) {
        const id = pt?.team?.id;
        if (!id) continue;
        logoByTeam.set(id, pt?.team?.logo ?? pt?.team?.club?.logo ?? null);
        if (pt?.group) groupByTeam.set(id, pt.group);
    }

    const byGroup = new Map<string, StandingRow[]>();
    const seen = new Set<string>();
    const push = (group: string, row: StandingRow) => {
        if (!byGroup.has(group)) byGroup.set(group, []);
        byGroup.get(group)!.push(row);
    };

    for (const r of ranking || []) {
        const id = r?.team?.id;
        const group = r?.group || (id ? groupByTeam.get(id) : "") || "—";
        push(group, {
            teamId: id,
            name: r?.team?.name || "—",
            logo: (id && logoByTeam.get(id)) || r?.team?.logo || null,
            points: r?.points ?? 0,
            matchesPlayed: r?.matchesPlayed ?? 0,
            wins: r?.wins ?? 0,
            draws: r?.draws ?? 0,
            losses: r?.losses ?? 0,
            goalsFor: r?.goalsFor ?? 0,
            goalsAgainst: r?.goalsAgainst ?? 0,
            goalDifference: r?.goalDifference ?? (r?.goalsFor ?? 0) - (r?.goalsAgainst ?? 0),
        });
        if (id) seen.add(id);
    }

    // Teams with no ranking row yet → zero rows so the group is complete.
    for (const pt of participatingTeams || []) {
        const id = pt?.team?.id;
        if (!id || seen.has(id)) continue;
        push(pt?.group || "—", {
            teamId: id,
            name: pt?.team?.name || "—",
            logo: pt?.team?.logo ?? pt?.team?.club?.logo ?? null,
            points: 0, matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
        });
        seen.add(id);
    }

    return Array.from(byGroup.entries())
        .sort(([a], [b]) => a.localeCompare(b, "ar"))
        .map(([g, rows]) => [g, [...rows].sort(sortStanding)] as [string, StandingRow[]]);
};

export interface Overview {
    teams: number;
    played: number;
    scorers: number;
    goals: number;
    yellow: number;
    red: number;
}

export const computeOverview = (
    participatingTeams: ParticipatingTeamRow[] | undefined,
    ranking: RankingRow[] | undefined,
    scorers: ScorerRow[] | undefined,
    yellowCards: CardRow[] | undefined,
    redCards: CardRow[] | undefined,
): Overview => {
    // Each played match increments matchesPlayed for two teams, so half the sum
    // is the number of matches played — derivable without the (protected) match list.
    const playedTwice = (ranking || []).reduce((n, r) => n + (r?.matchesPlayed || 0), 0);
    const validScorers = (scorers || []).filter((s) => s && s.PlayerID);
    return {
        teams: (participatingTeams || []).length,
        played: Math.round(playedTwice / 2),
        scorers: validScorers.length,
        goals: validScorers.reduce((n, s) => n + (s?.Goal || 0), 0),
        yellow: (yellowCards || []).reduce((n, c) => n + (c?.count || 0), 0),
        red: (redCards || []).reduce((n, c) => n + (c?.count || 0), 0),
    };
};

// ─────────────────────────────── PDF styles ──────────────────────────────────

const styles = StyleSheet.create({
    body: {
        fontFamily: "Montserrat-Arabic",
        backgroundColor: "#fff",
        fontSize: 12,
        padding: "1cm",
    },
    titleBar: {
        backgroundColor: cardPalette.primary,
        color: "#ffffff",
        paddingVertical: 6,
        paddingHorizontal: 10,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    titleText: { fontSize: 11, color: "#ffffff", fontWeight: 700 },
    subtitleText: { fontSize: 8, color: "#cffafe" },
    accentStrip: { height: 2, backgroundColor: cardPalette.accent, marginBottom: 8 },
    sectionHead: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: cardPalette.surfaceMuted,
        borderColor: cardPalette.border,
        borderWidth: 1,
        borderStyle: "solid",
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 10,
        marginBottom: 4,
    },
    sectionHeadText: { fontSize: 10, fontWeight: 700, color: cardPalette.primaryDark },
    groupHead: { fontSize: 9, fontWeight: 700, color: cardPalette.textDark, marginTop: 6, marginBottom: 2, textAlign: "right" },
    row: { flexDirection: "row", width: "100%", alignItems: "stretch" },
    cell: {
        borderWidth: 0.5,
        borderColor: cardPalette.border,
        borderStyle: "solid",
        minHeight: "0.62cm",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 2,
    },
    cellText: { fontSize: 8, fontWeight: 400, color: cardPalette.textDark },
    nameText: { fontSize: 8, fontWeight: 400, color: cardPalette.textDark, textAlign: "right", width: "100%" },
    headerCell: {
        borderWidth: 0.5,
        borderColor: cardPalette.primaryDark,
        borderStyle: "solid",
        minHeight: "0.55cm",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cardPalette.primary,
        paddingHorizontal: 2,
    },
    headerText: { fontSize: 7.5, fontWeight: 700, color: "#ffffff" },
    logo: { width: 12, height: 12, marginLeft: 4 },
    emptyText: { fontSize: 8, color: "#9ca3af", textAlign: "right", paddingVertical: 4 },
    alertBox: {
        borderWidth: 0.5,
        borderColor: "#fbbf24",
        borderStyle: "solid",
        backgroundColor: "#fffbeb",
        padding: 5,
        marginBottom: 3,
    },
    alertTitle: { fontSize: 8.5, fontWeight: 700, color: "#92400e", textAlign: "right" },
    alertSub: { fontSize: 7.5, color: "#6b7280", textAlign: "right", marginTop: 2 },
});

const HCell = ({ label, flex }: { label: string; flex: number }) => (
    <View style={[styles.headerCell, { flex }]}>
        <Text style={styles.headerText}>{label}</Text>
    </View>
);
const DCell = ({ value, flex, bold }: { value: React.ReactNode; flex: number; bold?: boolean }) => (
    <View style={[styles.cell, { flex }]}>
        <Text style={[styles.cellText, { fontWeight: bold ? 700 : 400 }]}>{value}</Text>
    </View>
);

// ───────────────────────── testable sub-components ───────────────────────────

// Children are laid out LTR but the page is RTL, so the last child renders
// right-most. Order below = visual: #  الفريق  ل  ف  ت  خ  له  عليه  +/-  نقاط.
export const StandingsGroup = ({
    groupName,
    rows,
    images,
    showGroupName,
}: {
    groupName: string;
    rows: StandingRow[];
    images?: Record<string, string>;
    showGroupName?: boolean;
}) => (
    <View wrap={false}>
        {showGroupName ? <Text style={styles.groupHead}>{`المجموعة ${groupName}`}</Text> : null}
        <View style={styles.row}>
            <HCell label="نقاط" flex={0.7} />
            <HCell label="+/-" flex={0.6} />
            <HCell label="عليه" flex={0.6} />
            <HCell label="له" flex={0.6} />
            <HCell label="خ" flex={0.5} />
            <HCell label="ت" flex={0.5} />
            <HCell label="ف" flex={0.5} />
            <HCell label="ل" flex={0.5} />
            <HCell label="الفريق" flex={3} />
            <HCell label="#" flex={0.5} />
        </View>
        {rows.map((r, i) => {
            const gd = r.goalDifference;
            const img = r.logo && images ? images[r.logo] : undefined;
            return (
                <View style={[styles.row, { backgroundColor: i % 2 === 1 ? cardPalette.surfaceMuted : "transparent" }]} key={r.teamId || i}>
                    <DCell value={r.points} flex={0.7} bold />
                    <DCell value={gd > 0 ? `+${gd}` : gd} flex={0.6} />
                    <DCell value={r.goalsAgainst} flex={0.6} />
                    <DCell value={r.goalsFor} flex={0.6} />
                    <DCell value={r.losses} flex={0.5} />
                    <DCell value={r.draws} flex={0.5} />
                    <DCell value={r.wins} flex={0.5} />
                    <DCell value={r.matchesPlayed} flex={0.5} />
                    <View style={[styles.cell, { flex: 3, justifyContent: "flex-end", paddingRight: 4 }]}>
                        <Text style={styles.nameText}>{r.name}</Text>
                        {img ? <Image style={styles.logo} src={img} /> : null}
                    </View>
                    <DCell value={i + 1} flex={0.5} />
                </View>
            );
        })}
    </View>
);

export const ScorersTable = ({ scorers }: { scorers: ScorerRow[] }) => {
    const rows = (scorers || []).filter((s) => s && s.PlayerID);
    if (rows.length === 0) return <Text style={styles.emptyText}>لا يوجد هدافون بعد</Text>;
    return (
        <View>
            <View style={styles.row}>
                <HCell label="أهداف" flex={0.8} />
                <HCell label="الفريق" flex={2.4} />
                <HCell label="اللاعب" flex={3} />
                <HCell label="#" flex={0.6} />
            </View>
            {rows.map((s, i) => (
                <View style={[styles.row, { backgroundColor: i % 2 === 1 ? cardPalette.surfaceMuted : "transparent" }]} key={s?.PlayerID?.id || i} wrap={false}>
                    <DCell value={s?.Goal ?? 0} flex={0.8} bold />
                    <View style={[styles.cell, { flex: 2.4, justifyContent: "flex-end", paddingRight: 4 }]}>
                        <Text style={styles.nameText}>{s?.team || "—"}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 3, justifyContent: "flex-end", paddingRight: 4 }]}>
                        <Text style={styles.nameText}>{scorerName(s) || "—"}</Text>
                    </View>
                    <DCell value={i + 1} flex={0.6} />
                </View>
            ))}
        </View>
    );
};

export const CardsTable = ({ rows, unit }: { rows: CardRow[]; unit: string }) => {
    const list = (rows || []).filter(Boolean);
    if (list.length === 0) return <Text style={styles.emptyText}>لا توجد بطاقات</Text>;
    return (
        <View>
            <View style={styles.row}>
                <HCell label={unit} flex={0.8} />
                <HCell label="رقم" flex={0.7} />
                <HCell label="الفريق" flex={2.4} />
                <HCell label="اللاعب" flex={3} />
                <HCell label="#" flex={0.6} />
            </View>
            {list.map((c, i) => (
                <View style={[styles.row, { backgroundColor: i % 2 === 1 ? cardPalette.surfaceMuted : "transparent" }]} key={`${c?.team?.id}-${c?.player}-${i}`} wrap={false}>
                    <DCell value={c?.count ?? 0} flex={0.8} bold />
                    <DCell value={c?.number || "—"} flex={0.7} />
                    <View style={[styles.cell, { flex: 2.4, justifyContent: "flex-end", paddingRight: 4 }]}>
                        <Text style={styles.nameText}>{c?.team?.name || "—"}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 3, justifyContent: "flex-end", paddingRight: 4 }]}>
                        <Text style={styles.nameText}>{c?.player || "—"}</Text>
                    </View>
                    <DCell value={i + 1} flex={0.6} />
                </View>
            ))}
        </View>
    );
};

export const AlertsSection = ({ alerts }: { alerts: AlertRow[] }) => {
    const list = (alerts || []).filter(Boolean);
    if (list.length === 0) return null;
    return (
        <View>
            <View style={styles.sectionHead}>
                <Text style={styles.sectionHeadText}>
                    {`تنبيه: بطاقتان صفراوان في مباراتين متتاليتين (${list.length})`}
                </Text>
            </View>
            {list.map((a, i) => (
                <View style={styles.alertBox} key={i} wrap={false}>
                    <Text style={styles.alertTitle}>
                        {`${a?.player || "—"}${a?.number ? ` (#${a.number})` : ""}${a?.team?.name ? ` — ${a.team.name}` : ""} — ${a?.yellowCount ?? 0} بطاقة صفراء`}
                    </Text>
                    <Text style={styles.alertSub}>
                        {(a?.matches || [])
                            .map((m) => `${m?.firstTeam || "—"} ضد ${m?.secondTeam || "—"}${m?.date ? ` — ${String(m.date).slice(0, 10)}` : ""}`)
                            .join("   ◂▸   ")}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const SectionHead = ({ label }: { label: string }) => (
    <View style={styles.sectionHead}>
        <Text style={styles.sectionHeadText}>{label}</Text>
    </View>
);

// ─────────────────────────────── entry point ─────────────────────────────────

export interface LeagueStatsData {
    leagueName?: string;
    participatingTeams?: ParticipatingTeamRow[];
    ranking?: RankingRow[];
    scorers?: ScorerRow[];
    yellowCards?: CardRow[];
    redCards?: CardRow[];
    alerts?: AlertRow[];
}

const primaryBtn: React.CSSProperties = {
    backgroundColor: "#0891b2",
    color: "#ffffff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
};

const LeagueStatsReport = ({ data }: { data: LeagueStatsData }) => {
    const {
        leagueName = "",
        participatingTeams = [],
        ranking = [],
        scorers = [],
        yellowCards = [],
        redCards = [],
        alerts = [],
    } = data || {};

    // Reuse the players-print asset pipeline purely for team logos: shape each
    // team into the PlayerLike envelope it expects so we get the same dedupe +
    // canvas-downscale + data-URI embedding + progress reporting for free.
    const logoInput = useMemo(
        () => participatingTeams.map((pt) => ({ participating_team: { team: { logo: pt?.team?.logo, club: { logo: pt?.team?.club?.logo } } } })),
        [participatingTeams],
    );
    const { images, progress } = usePrintAssets(logoInput);

    const grouped = useMemo(() => buildGroupedStandings(ranking, participatingTeams), [ranking, participatingTeams]);
    const overview = useMemo(
        () => computeOverview(participatingTeams, ranking, scorers, yellowCards, redCards),
        [participatingTeams, ranking, scorers, yellowCards, redCards],
    );
    const [downloading, setDownloading] = useState(false);

    const hasAny =
        grouped.length > 0 ||
        scorers.filter((s) => s && s.PlayerID).length > 0 ||
        yellowCards.length > 0 ||
        redCards.length > 0;

    const docElement = useMemo(
        () => (
            <Document>
                <Page orientation="portrait" style={styles.body} size="A4" wrap>
                    <View style={styles.titleBar}>
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                            <Image style={{ width: 24, height: 24 }} src="/logo.jpg" />
                            <Text style={styles.titleText}>منصة طموح</Text>
                        </View>
                        <View style={{ alignItems: "flex-start" }}>
                            <Text style={styles.titleText}>إحصائيات البطولة</Text>
                            {leagueName ? <Text style={styles.subtitleText}>{leagueName}</Text> : null}
                        </View>
                    </View>
                    <View style={styles.accentStrip} />

                    {/* Overview strip */}
                    <View style={[styles.row, { marginBottom: 4 }]}>
                        <View style={[styles.cell, { flex: 1, flexDirection: "column", paddingVertical: 3 }]}>
                            <Text style={[styles.cellText, { fontWeight: 700 }]}>{overview.red}</Text>
                            <Text style={[styles.cellText, { fontSize: 6.5, color: "#6b7280" }]}>بطاقات حمراء</Text>
                        </View>
                        <View style={[styles.cell, { flex: 1, flexDirection: "column", paddingVertical: 3 }]}>
                            <Text style={[styles.cellText, { fontWeight: 700 }]}>{overview.yellow}</Text>
                            <Text style={[styles.cellText, { fontSize: 6.5, color: "#6b7280" }]}>بطاقات صفراء</Text>
                        </View>
                        <View style={[styles.cell, { flex: 1, flexDirection: "column", paddingVertical: 3 }]}>
                            <Text style={[styles.cellText, { fontWeight: 700 }]}>{overview.goals}</Text>
                            <Text style={[styles.cellText, { fontSize: 6.5, color: "#6b7280" }]}>مجموع الأهداف</Text>
                        </View>
                        <View style={[styles.cell, { flex: 1, flexDirection: "column", paddingVertical: 3 }]}>
                            <Text style={[styles.cellText, { fontWeight: 700 }]}>{overview.played}</Text>
                            <Text style={[styles.cellText, { fontSize: 6.5, color: "#6b7280" }]}>مباريات لُعبت</Text>
                        </View>
                        <View style={[styles.cell, { flex: 1, flexDirection: "column", paddingVertical: 3 }]}>
                            <Text style={[styles.cellText, { fontWeight: 700 }]}>{overview.teams}</Text>
                            <Text style={[styles.cellText, { fontSize: 6.5, color: "#6b7280" }]}>فرق مشاركة</Text>
                        </View>
                    </View>

                    {/* Standings */}
                    <SectionHead label="الترتيب" />
                    {grouped.length === 0 ? (
                        <Text style={styles.emptyText}>لا توجد بيانات ترتيب بعد</Text>
                    ) : (
                        grouped.map(([groupName, rows]) => (
                            <StandingsGroup
                                key={groupName}
                                groupName={groupName}
                                rows={rows}
                                images={images}
                                showGroupName={grouped.length > 1 || groupName !== "—"}
                            />
                        ))
                    )}

                    {/* Scorers */}
                    <SectionHead label="الهدافون" />
                    <ScorersTable scorers={scorers} />

                    {/* Yellow cards */}
                    <SectionHead label="البطاقات الصفراء" />
                    <CardsTable rows={yellowCards} unit="صفراء" />

                    {/* Red cards */}
                    <SectionHead label="البطاقات الحمراء" />
                    <CardsTable rows={redCards} unit="حمراء" />

                    {/* Two-yellow alerts */}
                    <AlertsSection alerts={alerts} />
                </Page>
            </Document>
        ),
        [leagueName, overview, grouped, images, scorers, yellowCards, redCards, alerts],
    );

    if (!hasAny) {
        return (
            <div data-testid="league-stats-empty" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                لا توجد إحصائيات لهذه البطولة بعد.
            </div>
        );
    }

    if (!progress.ready) {
        return <PrintProgress progress={progress} label="جارٍ تجهيز إحصائيات البطولة" />;
    }

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `league-stats-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: "6px 10px",
                    gap: 8,
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    direction: "rtl",
                }}
            >
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    data-testid="league-stats-download"
                    style={{ ...primaryBtn, cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.7 : 1 }}
                >
                    {downloading ? "جارٍ التحميل…" : "تحميل PDF"}
                </button>
            </div>
            <PDFViewer data-testid="league-stats-pdfviewer" style={{ flex: 1, width: "100%", border: "none" }}>
                {docElement}
            </PDFViewer>
        </div>
    );
};

export default LeagueStatsReport;
