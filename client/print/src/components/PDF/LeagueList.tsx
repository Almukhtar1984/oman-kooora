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

const LeagueList = ({ players }: Props) => {
    const safePlayers = useMemo(() => players || [], [players]);
    const leagueName = safePlayers[0]?.participating_team?.league?.name;
    const [downloading, setDownloading] = useState(false);

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
                            <Text style={styles.titleText}>قائمة اللاعبين المشاركين</Text>
                            {leagueName ? (
                                <Text style={styles.subtitleText}>{leagueName}</Text>
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
                            <Text style={styles.headerText}>المركز</Text>
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

                    {safePlayers.map((pp, index) => {
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
                                    backgroundColor: isStriped
                                        ? cardPalette.surfaceMuted
                                        : "transparent",
                                }}
                            >
                                <View style={[styles.cell, { flex: 0.7 }]}>
                                    <Text style={styles.cellText}>{player?.player_center || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 0.5 }]}>
                                    <Text style={styles.cellText}>{pp.number || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>{team?.name || ""}</Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>
                                        {player?.person?.date_birth || ""}
                                    </Text>
                                </View>
                                <View style={[styles.cell, { flex: 1 }]}>
                                    <Text style={styles.cellText}>
                                        {player?.person?.card_number || ""}
                                    </Text>
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
        [safePlayers, leagueName],
    );

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `players-list-${new Date().toISOString().slice(0, 10)}.pdf`;
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
                    data-testid="league-list-download"
                    style={{
                        backgroundColor: "#0891b2",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: downloading ? "wait" : "pointer",
                        opacity: downloading ? 0.7 : 1,
                    }}
                >
                    {downloading ? "جارٍ التحميل…" : "تحميل PDF"}
                </button>
            </div>
            <PDFViewer
                data-testid="league-list-pdfviewer"
                style={{ flex: 1, width: "100%", border: "none" }}
            >
                {docElement}
            </PDFViewer>
        </div>
    );
};

export default LeagueList;
