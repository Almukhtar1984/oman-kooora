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

interface ParticipatingTeam {
    id: string;
    group?: string;
    status?: string;
    team?: any;
}

interface Props {
    teams?: ParticipatingTeam[];
    leagueName?: string;
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

// Team.category is a 1-based int; mirror the label map used across the dashboards.
const CATEGORY_LABELS = ["الدرجة الأولى", "الدرجة الثانية", "الدرجة الثالثة"];
const categoryLabel = (category?: number) =>
    category && CATEGORY_LABELS[category - 1] ? CATEGORY_LABELS[category - 1] : "";

const STATUS_LABELS: Record<string, string> = {
    accepted: "مقبول",
    waiting: "بانتظار",
    rejected: "مرفوض",
};
const statusLabel = (status?: string) => STATUS_LABELS[status || "waiting"] || "بانتظار";

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

const primaryBtn: React.CSSProperties = {
    backgroundColor: "#0891b2",
    color: "#ffffff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
};

const TeamsList = ({ teams, leagueName, deferViewerAbove = 150 }: Props) => {
    const safeTeams = useMemo(() => teams || [], [teams]);
    const [downloading, setDownloading] = useState(false);
    const heavy = safeTeams.length > deferViewerAbove;
    const [showViewer, setShowViewer] = useState(!heavy);

    const acceptedCount = useMemo(
        () => safeTeams.filter((t) => t?.status === "accepted").length,
        [safeTeams],
    );

    const docElement = useMemo(
        () => (
            <Document>
                <Page orientation={"portrait"} style={styles.body} size={"A4"} wrap={true}>
                    <View style={styles.titleBar}>
                        <View
                            style={{
                                flexDirection: "row-reverse",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Image style={{ width: 24, height: 24 }} src={"/logo.jpg"} />
                            <Text style={styles.titleText}>منصة طموح</Text>
                        </View>
                        <View style={{ alignItems: "flex-start" }}>
                            <Text style={styles.titleText}>قائمة الفرق المشاركة</Text>
                            {leagueName ? (
                                <Text style={styles.subtitleText}>
                                    {leagueName} — {safeTeams.length} فريق (مقبول: {acceptedCount})
                                </Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={styles.accentStrip} />

                    {/* Header row (RTL): # | اسم الفريق | النادي | الفئة | المجموعة | الحالة */}
                    <View
                        style={{
                            flexDirection: "row",
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0cm 0.2cm",
                        }}
                    >
                        <View style={[styles.headerCell, { flex: 0.8 }]}>
                            <Text style={styles.headerText}>الحالة</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 0.8 }]}>
                            <Text style={styles.headerText}>المجموعة</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerText}>الفئة</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 1.6 }]}>
                            <Text style={styles.headerText}>النادي</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 2 }]}>
                            <Text style={styles.headerText}>اسم الفريق</Text>
                        </View>
                        <View style={[styles.headerCell, { flex: 0.4 }]}>
                            <Text style={styles.headerText}>#</Text>
                        </View>
                    </View>

                    {safeTeams.map((pt, index) => {
                        const team = pt.team;
                        const isStriped = index % 2 === 1;
                        return (
                            <View
                                key={pt.id || index}
                                style={{
                                    flexDirection: "row",
                                    width: "100%",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.1cm 0.2cm 0",
                                    backgroundColor: isStriped
                                        ? cardPalette.surfaceMuted
                                        : "transparent",
                                }}
                            >
                                <View style={[styles.cell, { flex: 0.8 }]}>
                                    <Text style={styles.cellText}>{statusLabel(pt.status)}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 0.8 }]}>
                                    <Text style={styles.cellText}>{pt.group || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>{categoryLabel(team?.category)}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1.6 }]}>
                                    <Text style={styles.cellText}>{team?.club?.name || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 2 }]}>
                                    <Text style={styles.cellText}>{team?.name || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 0.4 }]}>
                                    <Text style={styles.cellText}>{index + 1}</Text>
                                </View>
                            </View>
                        );
                    })}
                </Page>
            </Document>
        ),
        [safeTeams, leagueName, acceptedCount],
    );

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `teams-list-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } finally {
            setDownloading(false);
        }
    };

    if (safeTeams.length === 0) {
        return (
            <div data-testid="teams-list-empty" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                لا توجد فرق مشاركة في هذه البطولة بعد.
            </div>
        );
    }

    if (heavy && !showViewer) {
        return (
            <div
                data-testid="teams-list-ready"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    direction: "rtl",
                    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
                    color: "#1f2937",
                    padding: 24,
                    gap: 14,
                }}
            >
                <div style={{ fontSize: 20, fontWeight: 700 }}>الملف جاهز</div>
                <div style={{ color: "#6b7280", textAlign: "center" }}>
                    قائمة {safeTeams.length} فريق{leagueName ? ` — ${leagueName}` : ""}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        data-testid="teams-list-download"
                        style={{ ...primaryBtn, cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.7 : 1 }}
                    >
                        {downloading ? "جارٍ التحميل…" : "تحميل PDF مباشرة"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowViewer(true)}
                        data-testid="teams-list-show-viewer"
                        style={{ ...primaryBtn, backgroundColor: "#ffffff", color: "#0891b2", border: "1px solid #0891b2", cursor: "pointer" }}
                    >
                        عرض PDF داخل المتصفح
                    </button>
                </div>
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
                    data-testid="teams-list-download"
                    style={{ ...primaryBtn, cursor: downloading ? "wait" : "pointer", opacity: downloading ? 0.7 : 1 }}
                >
                    {downloading ? "جارٍ التحميل…" : "تحميل PDF"}
                </button>
            </div>
            <PDFViewer
                data-testid="teams-list-pdfviewer"
                style={{ flex: 1, width: "100%", border: "none" }}
            >
                {docElement}
            </PDFViewer>
        </div>
    );
};

export default TeamsList;
