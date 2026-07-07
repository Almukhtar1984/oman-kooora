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

export interface RosterPlayer {
    number?: string;
    name?: string;
    position?: string;
}
export interface RosterStaff {
    name?: string;
    job?: string;
}
export interface TeamRosterData {
    teamName?: string;
    leagueName?: string;
    players?: RosterPlayer[];
    staff?: RosterStaff[];
}

interface Props {
    roster?: TeamRosterData | null;
}

Font.register({
    family: "Montserrat-Arabic",
    fonts: [
        { src: "/fonts/Montserrat-Arabic-Regular.ttf", fontStyle: "normal", fontWeight: 400 },
        { src: "/fonts/Montserrat-Arabic-Medium.ttf", fontStyle: "normal", fontWeight: 700 },
    ],
});

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
    sectionHeader: {
        backgroundColor: cardPalette.primaryDark,
        color: "#fff",
        paddingVertical: 4,
        paddingHorizontal: 8,
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        marginTop: 10,
        marginBottom: 2,
    },
    sectionHeaderText: { fontSize: 10, color: "#fff", fontWeight: 700 },
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
    signBox: { width: "40%", alignItems: "center" },
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

export const PlayersTable = ({ players }: { players: RosterPlayer[] }) => (
    <View>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>اللاعبون</Text>
            <Text style={styles.sectionHeaderText}>العدد: {players.length}</Text>
        </View>
        {/* RTL: المركز | اسم اللاعب | # */}
        <View style={{ flexDirection: "row", width: "100%" }}>
            <View style={[styles.headerCell, { flex: 1.6 }]}><Text style={styles.headerText}>المركز</Text></View>
            <View style={[styles.headerCell, { flex: 3 }]}><Text style={styles.headerText}>اسم اللاعب</Text></View>
            <View style={[styles.headerCell, { flex: 0.6 }]}><Text style={styles.headerText}>#</Text></View>
        </View>
        {players.length === 0 ? (
            <View style={[styles.cell, { width: "100%" }]}><Text style={styles.cellText}>لا يوجد لاعبون مسجّلون.</Text></View>
        ) : (
            players.map((p, i) => (
                <View key={i} style={{ flexDirection: "row", width: "100%", backgroundColor: i % 2 === 1 ? cardPalette.surfaceMuted : "transparent" }}>
                    <View style={[styles.cell, { flex: 1.6 }]}><Text style={styles.cellText}>{p.position || "—"}</Text></View>
                    <View style={[styles.cell, { flex: 3 }]}><Text style={styles.cellText}>{p.name || "—"}</Text></View>
                    <View style={[styles.cell, { flex: 0.6 }]}><Text style={styles.cellText}>{p.number || ""}</Text></View>
                </View>
            ))
        )}
    </View>
);

export const StaffTable = ({ staff }: { staff: RosterStaff[] }) => (
    <View wrap={false}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>الجهاز الفني</Text>
            <Text style={styles.sectionHeaderText}>العدد: {staff.length}</Text>
        </View>
        {/* RTL: الوظيفة | الاسم */}
        <View style={{ flexDirection: "row", width: "100%" }}>
            <View style={[styles.headerCell, { flex: 1.6 }]}><Text style={styles.headerText}>الوظيفة</Text></View>
            <View style={[styles.headerCell, { flex: 3 }]}><Text style={styles.headerText}>الاسم</Text></View>
        </View>
        {staff.length === 0 ? (
            <View style={[styles.cell, { width: "100%" }]}><Text style={styles.cellText}>لا يوجد جهاز فني مسجّل.</Text></View>
        ) : (
            staff.map((s, i) => (
                <View key={i} style={{ flexDirection: "row", width: "100%", backgroundColor: i % 2 === 1 ? cardPalette.surfaceMuted : "transparent" }}>
                    <View style={[styles.cell, { flex: 1.6 }]}><Text style={styles.cellText}>{s.job || "—"}</Text></View>
                    <View style={[styles.cell, { flex: 3 }]}><Text style={styles.cellText}>{s.name || "—"}</Text></View>
                </View>
            ))
        )}
    </View>
);

const TeamRosterList = ({ roster }: Props) => {
    const [downloading, setDownloading] = useState(false);
    const players = useMemo(() => roster?.players || [], [roster]);
    const staff = useMemo(() => roster?.staff || [], [roster]);

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
                            <Text style={styles.titleText}>كشف الفريق (لاعبون + جهاز فني)</Text>
                            <Text style={styles.subtitleText}>
                                {[roster?.teamName, roster?.leagueName].filter(Boolean).join(" — ")}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.accentStrip} />

                    <PlayersTable players={players} />
                    <StaffTable staff={staff} />

                    <View style={styles.signRow}>
                        <View style={styles.signBox}><View style={styles.signLine} /><Text style={styles.signText}>مدير الفريق</Text></View>
                        <View style={styles.signBox}><View style={styles.signLine} /><Text style={styles.signText}>منظّم البطولة</Text></View>
                    </View>
                </Page>
            </Document>
        ),
        [roster, players, staff],
    );

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `team-roster-${roster?.teamName || "team"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } finally {
            setDownloading(false);
        }
    };

    if (!roster) {
        return (
            <div data-testid="team-roster-empty" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                لا توجد بيانات لهذا الفريق.
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
                    data-testid="team-roster-download"
                    style={{ ...primaryBtn, cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.7 : 1 }}
                >
                    {downloading ? "جارٍ التحميل…" : "تحميل PDF"}
                </button>
            </div>
            <PDFViewer data-testid="team-roster-pdfviewer" style={{ flex: 1, width: "100%", border: "none" }}>
                {docElement}
            </PDFViewer>
        </div>
    );
};

export default TeamRosterList;
