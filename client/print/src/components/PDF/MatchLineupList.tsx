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

export interface LineupPlayer {
    name?: string;
    number?: string;
    position?: string;
    starter?: boolean;
    sub?: boolean;
}

export interface MatchLineupData {
    id?: string;
    date?: string;
    leagueName?: string;
    firstTeamName?: string;
    secondTeamName?: string;
    firstTeamPlayers?: LineupPlayer[];
    secondTeamPlayers?: LineupPlayer[];
}

interface Props {
    lineup?: MatchLineupData | null;
}

Font.register({
    family: "Montserrat-Arabic",
    fonts: [
        { src: "/fonts/Montserrat-Arabic-Regular.ttf", fontStyle: "normal", fontWeight: 400 },
        { src: "/fonts/Montserrat-Arabic-Medium.ttf", fontStyle: "normal", fontWeight: 700 },
    ],
});

export const statusLabel = (p: LineupPlayer): string =>
    p?.starter ? "أساسي" : p?.sub ? "احتياط" : "—";

const styles = StyleSheet.create({
    body: { fontFamily: "Montserrat-Arabic", backgroundColor: "#fff", fontSize: 12, padding: "1cm" },
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
    teamHeader: {
        backgroundColor: cardPalette.primaryDark,
        color: "#fff",
        paddingVertical: 4,
        paddingHorizontal: 8,
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        marginTop: 10,
        marginBottom: 2,
    },
    teamHeaderText: { fontSize: 10, color: "#fff", fontWeight: 700 },
    cell: {
        borderWidth: 1,
        borderColor: cardPalette.border,
        borderStyle: "solid",
        height: "0.85cm",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    cellText: { fontSize: 9, fontWeight: 400, color: cardPalette.textDark },
    headerCell: {
        borderWidth: 1,
        borderColor: cardPalette.primaryDark,
        borderStyle: "solid",
        height: "0.85cm",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: cardPalette.primary,
    },
    headerText: { fontSize: 9, fontWeight: 700, color: "#ffffff" },
    signRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 24 },
    signBox: { width: "30%", alignItems: "center" },
    signLine: { borderTopWidth: 1, borderTopColor: cardPalette.textDark, borderTopStyle: "solid", width: "100%", marginBottom: 4 },
    signText: { fontSize: 9, color: cardPalette.textMuted },
});

const primaryBtn: React.CSSProperties = {
    backgroundColor: "#0891b2",
    color: "#ffffff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
};

// One team's table: header + a striped row per player.
export const TeamLineupTable = ({ title, players }: { title: string; players: LineupPlayer[] }) => {
    const starters = players.filter((p) => p.starter).length;
    const subs = players.filter((p) => p.sub).length;
    return (
        <View wrap={false}>
            <View style={styles.teamHeader}>
                <Text style={styles.teamHeaderText}>{title || "—"}</Text>
                <Text style={styles.teamHeaderText}>
                    أساسي: {starters} — احتياط: {subs}
                </Text>
            </View>

            {/* RTL header: الحالة | المركز | اسم اللاعب | # */}
            <View style={{ flexDirection: "row", width: "100%" }}>
                <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>الحالة</Text></View>
                <View style={[styles.headerCell, { flex: 1.4 }]}><Text style={styles.headerText}>المركز</Text></View>
                <View style={[styles.headerCell, { flex: 3 }]}><Text style={styles.headerText}>اسم اللاعب</Text></View>
                <View style={[styles.headerCell, { flex: 0.6 }]}><Text style={styles.headerText}>#</Text></View>
            </View>

            {players.length === 0 ? (
                <View style={[styles.cell, { width: "100%" }]}>
                    <Text style={styles.cellText}>لا يوجد لاعبون مسجّلون لهذا الفريق.</Text>
                </View>
            ) : (
                players.map((p, i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: "row",
                            width: "100%",
                            backgroundColor: i % 2 === 1 ? cardPalette.surfaceMuted : "transparent",
                        }}
                    >
                        <View style={[styles.cell, { flex: 1 }]}>
                            <Text style={[styles.cellText, p.starter ? { color: cardPalette.primaryDark, fontWeight: 700 } : {}]}>
                                {statusLabel(p)}
                            </Text>
                        </View>
                        <View style={[styles.cell, { flex: 1.4 }]}><Text style={styles.cellText}>{p.position || "—"}</Text></View>
                        <View style={[styles.cell, { flex: 3 }]}><Text style={styles.cellText}>{p.name || "—"}</Text></View>
                        <View style={[styles.cell, { flex: 0.6 }]}><Text style={styles.cellText}>{p.number || ""}</Text></View>
                    </View>
                ))
            )}
        </View>
    );
};

const MatchLineupList = ({ lineup }: Props) => {
    const [downloading, setDownloading] = useState(false);

    const first = useMemo(() => lineup?.firstTeamPlayers || [], [lineup]);
    const second = useMemo(() => lineup?.secondTeamPlayers || [], [lineup]);
    const dateText = (lineup?.date || "").toString().slice(0, 10);

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
                            <Text style={styles.titleText}>كشف لاعبي المباراة</Text>
                            <Text style={styles.subtitleText}>
                                {[lineup?.leagueName, dateText].filter(Boolean).join(" — ")}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.accentStrip} />

                    <Text style={{ fontSize: 12, fontWeight: 700, textAlign: "center", marginBottom: 4, color: cardPalette.textDark }}>
                        {(lineup?.firstTeamName || "—")} × {(lineup?.secondTeamName || "—")}
                    </Text>

                    <TeamLineupTable title={lineup?.firstTeamName || ""} players={first} />
                    <TeamLineupTable title={lineup?.secondTeamName || ""} players={second} />

                    <View style={styles.signRow}>
                        <View style={styles.signBox}><View style={styles.signLine} /><Text style={styles.signText}>حكم المباراة</Text></View>
                        <View style={styles.signBox}><View style={styles.signLine} /><Text style={styles.signText}>مدرب الفريق الأول</Text></View>
                        <View style={styles.signBox}><View style={styles.signLine} /><Text style={styles.signText}>مدرب الفريق الثاني</Text></View>
                    </View>
                </Page>
            </Document>
        ),
        [lineup, first, second, dateText],
    );

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `match-lineup-${lineup?.id || "match"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } finally {
            setDownloading(false);
        }
    };

    if (!lineup?.id) {
        return (
            <div data-testid="match-lineup-empty" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                لا توجد بيانات لهذه المباراة.
            </div>
        );
    }

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
                    data-testid="match-lineup-download"
                    style={{ ...primaryBtn, cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.7 : 1 }}
                >
                    {downloading ? "جارٍ التحميل…" : "تحميل PDF"}
                </button>
            </div>
            <PDFViewer data-testid="match-lineup-pdfviewer" style={{ flex: 1, width: "100%", border: "none" }}>
                {docElement}
            </PDFViewer>
        </div>
    );
};

export default MatchLineupList;
