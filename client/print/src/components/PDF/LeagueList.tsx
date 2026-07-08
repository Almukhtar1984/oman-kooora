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

import { buildFullName, cardPalette } from "./Card";

interface ParticipatingPlayer {
    id: string;
    number?: string;
    participating_team?: any;
    player?: any;
}

interface Props {
    players?: ParticipatingPlayer[];
    deferViewerAbove?: number;
}

Font.register({
    family: "Montserrat-Arabic",
    fonts: [
        {
            src: "/fonts/Montserrat-Arabic-Regular.ttf",
            fontStyle: "normal",
            fontWeight: 400,
        },
        {
            src: "/fonts/Montserrat-Arabic-Medium.ttf",
            fontStyle: "normal",
            fontWeight: 700,
        },
    ],
});

// ───────────────────── status derivation + filtering (tested) ─────────────────

// A participating player is "معار" (on loan) when their most recent loan/return
// record is an accepted loan INTO the team they're participating with. lastLoan
// already returns the newest of {loan, returning}, so a subsequent return
// naturally flips this off. Otherwise the label follows Player.type:
// external → محترف (professional), anything else → داخلي (internal).
export const STATUS_LOAN = "معار";
export const STATUS_EXTERNAL = "محترف";
export const STATUS_INTERNAL = "داخلي";
export const STATUS_VALUES = [STATUS_INTERNAL, STATUS_EXTERNAL, STATUS_LOAN];

export const isLoanedInto = (pp?: ParticipatingPlayer): boolean => {
    const l = pp?.player?.lastLoan;
    return !!(
        l &&
        l.transition_type === "loan" &&
        l.status === "accepted" &&
        l.team_to?.id &&
        l.team_to.id === pp?.participating_team?.team?.id
    );
};

export const playerStatus = (pp?: ParticipatingPlayer): string => {
    if (isLoanedInto(pp)) return STATUS_LOAN;
    return pp?.player?.type === "external" ? STATUS_EXTERNAL : STATUS_INTERNAL;
};

export interface ListFilter {
    team: string; // team id | "all"
    group: string; // group letter | "all"
    status: string; // one of STATUS_VALUES | "all"
}

export const filterParticipants = (
    players: ParticipatingPlayer[] | undefined,
    { team, group, status }: ListFilter,
): ParticipatingPlayer[] =>
    (players || []).filter(
        (pp) =>
            (team === "all" || pp?.participating_team?.team?.id === team) &&
            (group === "all" || (pp?.participating_team?.group || "") === group) &&
            (status === "all" || playerStatus(pp) === status),
    );

// Distinct teams present in the list, id+name, name-sorted — drives the dropdown.
export const distinctTeams = (players: ParticipatingPlayer[] | undefined): Array<{ id: string; name: string }> => {
    const byId = new Map<string, string>();
    for (const pp of players || []) {
        const t = pp?.participating_team?.team;
        if (t?.id && !byId.has(t.id)) byId.set(t.id, t.name || "—");
    }
    return Array.from(byId.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "ar"));
};

export const distinctGroups = (players: ParticipatingPlayer[] | undefined): string[] => {
    const set = new Set<string>();
    for (const pp of players || []) {
        const g = pp?.participating_team?.group;
        if (g) set.add(g);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
};

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
    titleText: {
        fontSize: 11,
        color: "#ffffff",
        fontWeight: 700,
    },
    subtitleText: {
        fontSize: 8,
        color: "#cffafe",
    },
    accentStrip: {
        height: 2,
        backgroundColor: cardPalette.accent,
        marginBottom: 8,
    },
    cell: {
        borderWidth: 1,
        borderColor: cardPalette.border,
        borderStyle: "solid",
        height: "1cm",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    cellText: {
        fontSize: 9,
        fontWeight: 400,
        color: cardPalette.textDark,
    },
    headerCell: {
        borderWidth: 1,
        borderColor: cardPalette.primaryDark,
        borderStyle: "solid",
        height: "1cm",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cardPalette.primary,
    },
    headerText: {
        fontSize: 9,
        fontWeight: 700,
        color: "#ffffff",
    },
});

// ─────────────────────────── DOM filter bar (tested) ──────────────────────────

const selectStyle: React.CSSProperties = {
    padding: "5px 8px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 13,
    backgroundColor: "#fff",
    color: "#1f2937",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#6b7280", marginInlineEnd: 4 };
const primaryBtn: React.CSSProperties = {
    backgroundColor: "#0891b2",
    color: "#ffffff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
};

interface FilterBarProps {
    teams: Array<{ id: string; name: string }>;
    groups: string[];
    filter: ListFilter;
    onChange: (patch: Partial<ListFilter>) => void;
    onDownload: () => void;
    downloading: boolean;
    count: number;
}

export const FilterBar = ({ teams, groups, filter, onChange, onDownload, downloading, count }: FilterBarProps) => (
    <div
        data-testid="league-list-filters"
        style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            direction: "rtl",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
    >
        <label style={{ display: "flex", alignItems: "center" }}>
            <span style={labelStyle}>الفريق</span>
            <select
                data-testid="filter-team"
                style={selectStyle}
                value={filter.team}
                onChange={(e) => onChange({ team: e.target.value })}
            >
                <option value="all">كل الفرق</option>
                {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </select>
        </label>

        {groups.length > 0 ? (
            <label style={{ display: "flex", alignItems: "center" }}>
                <span style={labelStyle}>المجموعة</span>
                <select
                    data-testid="filter-group"
                    style={selectStyle}
                    value={filter.group}
                    onChange={(e) => onChange({ group: e.target.value })}
                >
                    <option value="all">كل المجموعات</option>
                    {groups.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
            </label>
        ) : null}

        <label style={{ display: "flex", alignItems: "center" }}>
            <span style={labelStyle}>الحالة</span>
            <select
                data-testid="filter-status"
                style={selectStyle}
                value={filter.status}
                onChange={(e) => onChange({ status: e.target.value })}
            >
                <option value="all">كل الحالات</option>
                {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                        {s}
                    </option>
                ))}
            </select>
        </label>

        <span style={{ fontSize: 12, color: "#6b7280" }}>({count} لاعب)</span>

        <button
            type="button"
            onClick={onDownload}
            disabled={downloading || count === 0}
            data-testid="league-list-download"
            style={{
                ...primaryBtn,
                marginInlineStart: "auto",
                cursor: downloading ? "wait" : count === 0 ? "not-allowed" : "pointer",
                opacity: downloading || count === 0 ? 0.6 : 1,
            }}
        >
            {downloading ? "جارٍ التحميل…" : "تحميل PDF"}
        </button>
    </div>
);

const LeagueList = ({ players, deferViewerAbove = 150 }: Props) => {
    const safePlayers = useMemo(() => players || [], [players]);
    const leagueName = safePlayers[0]?.participating_team?.league?.name;

    const teams = useMemo(() => distinctTeams(safePlayers), [safePlayers]);
    const groups = useMemo(() => distinctGroups(safePlayers), [safePlayers]);

    const [filter, setFilter] = useState<ListFilter>({ team: "all", group: "all", status: "all" });
    const [downloading, setDownloading] = useState(false);
    const [showViewer, setShowViewer] = useState(false);

    const filtered = useMemo(() => filterParticipants(safePlayers, filter), [safePlayers, filter]);

    // Any filter change re-evaluates the heavy/deferred decision from scratch:
    // pick a single team (light) → viewer opens; back to "all" (heavy) → the
    // ready screen returns instead of mounting a 300-row PDFViewer.
    const onFilterChange = (patch: Partial<ListFilter>) => {
        setShowViewer(false);
        setFilter((f) => ({ ...f, ...patch }));
    };

    const heavy = filtered.length > deferViewerAbove;

    const filterSummary = useMemo(() => {
        const parts: string[] = [];
        if (filter.team !== "all") parts.push(teams.find((t) => t.id === filter.team)?.name || "");
        if (filter.group !== "all") parts.push(`المجموعة ${filter.group}`);
        if (filter.status !== "all") parts.push(filter.status);
        return parts.filter(Boolean).join(" — ");
    }, [filter, teams]);

    const docElement = useMemo(
        () => (
            <Document>
                <Page orientation={"portrait"} style={styles.body} size={"A4"} wrap={true}>
                    <View style={styles.titleBar}>
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                            <Image style={{ width: 24, height: 24 }} src={"/logo.jpg"} />
                            <Text style={styles.titleText}>منصة طموح</Text>
                        </View>
                        <View style={{ alignItems: "flex-start" }}>
                            <Text style={styles.titleText}>قائمة اللاعبين المشاركين</Text>
                            {leagueName || filterSummary ? (
                                <Text style={styles.subtitleText}>
                                    {[leagueName, filterSummary].filter(Boolean).join(" — ")} ({filtered.length})
                                </Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={styles.accentStrip} />

                    <View
                        style={{
                            flexDirection: "row",
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0cm 0.2cm",
                        }}
                    >
                        <View style={[styles.headerCell, { flex: 0.7 }]}>
                            <Text style={styles.headerText}>الحالة</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 0.5 }]}>
                            <Text style={styles.headerText}>الرقم</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerText}>الفريق</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerText}>تاريخ الميلاد</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerText}>الرقم المدني</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerText}>الهاتف</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 2 }]}>
                            <Text style={styles.headerText}>الاسم الكامل</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 0.3 }]}>
                            <Text style={styles.headerText}>#</Text>
                        </View>
                    </View>

                    {filtered.map((pp, index) => {
                        const player = pp.player;
                        const team = pp.participating_team?.team;
                        const isStriped = index % 2 === 1;
                        return (
                            <View
                                key={pp.id || index}
                                style={{
                                    flexDirection: "row",
                                    width: "100%",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.1cm 0.2cm 0",
                                    backgroundColor: isStriped ? cardPalette.surfaceMuted : "transparent",
                                }}
                            >
                                <View style={[styles.cell, { flex: 0.7 }]}>
                                    <Text style={styles.cellText}>{playerStatus(pp)}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 0.5 }]}>
                                    <Text style={styles.cellText}>{pp.number || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>{team?.name || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>{player?.person?.date_birth || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>{player?.person?.card_number || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>{player?.person?.phone || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 2 }]}>
                                    <Text style={styles.cellText}>{buildFullName(player?.person)}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 0.3 }]}>
                                    <Text style={styles.cellText}>{index + 1}</Text>
                                </View>
                            </View>
                        );
                    })}
                </Page>
            </Document>
        ),
        [filtered, leagueName, filterSummary],
    );

    const handleDownload = async () => {
        if (downloading || filtered.length === 0) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const tag = filterSummary ? `-${filterSummary.replace(/\s+/g, "_")}` : "";
            a.download = `players-list${tag}-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } finally {
            setDownloading(false);
        }
    };

    const filterBar = (
        <FilterBar
            teams={teams}
            groups={groups}
            filter={filter}
            onChange={onFilterChange}
            onDownload={handleDownload}
            downloading={downloading}
            count={filtered.length}
        />
    );

    let body: React.ReactNode;
    if (safePlayers.length > 0 && filtered.length === 0) {
        // Players exist but the active filters exclude all of them.
        body = (
            <div data-testid="league-list-empty" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                لا يوجد لاعبون مطابقون للفلاتر المختارة.
            </div>
        );
    } else if (heavy && !showViewer) {
        // Heavy result: show a ready screen instead of mounting the PDFViewer
        // (which paginates 300+ rows). Narrowing by team/group usually drops
        // below the threshold and opens the viewer automatically.
        body = (
            <div
                data-testid="league-list-ready"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    direction: "rtl",
                    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
                    color: "#1f2937",
                    padding: 24,
                    gap: 14,
                }}
            >
                <div style={{ fontSize: 20, fontWeight: 700 }}>الملف جاهز</div>
                <div style={{ color: "#6b7280", textAlign: "center" }}>
                    قائمة {filtered.length} لاعب{filterSummary ? ` — ${filterSummary}` : ""}
                </div>
                <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center" }}>
                    اختر فريقًا أو مجموعة من الأعلى لتقليل العدد، أو حمّل/اعرض القائمة كاملة.
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        data-testid="league-list-download-ready"
                        style={{ ...primaryBtn, cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.7 : 1 }}
                    >
                        {downloading ? "جارٍ التحميل…" : "تحميل PDF مباشرة"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowViewer(true)}
                        data-testid="league-list-show-viewer"
                        style={{
                            ...primaryBtn,
                            backgroundColor: "#ffffff",
                            color: "#0891b2",
                            border: "1px solid #0891b2",
                            cursor: "pointer",
                        }}
                    >
                        عرض PDF داخل المتصفح
                    </button>
                </div>
            </div>
        );
    } else {
        body = (
            <PDFViewer data-testid="league-list-pdfviewer" style={{ flex: 1, width: "100%", border: "none" }}>
                {docElement}
            </PDFViewer>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            {filterBar}
            {body}
        </div>
    );
};

export default LeagueList;
