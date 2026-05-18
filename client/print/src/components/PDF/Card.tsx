import React, { useEffect, useState } from "react";

import {
    Page,
    Text,
    Image,
    Document,
    StyleSheet,
    View,
    Font,
    PDFViewer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import dayjs from "dayjs";

import { apiUrl, printUrl } from "../../config";

interface Props {
    player?: any;
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

// Centralised palette so Card.tsx, LeagueCards.tsx and LeagueList.tsx stay in
// visual sync. Cyan matches the league dashboard in sports-course.
export const cardPalette = {
    primary: "#0891b2",
    primaryDark: "#0e7490",
    primaryLight: "#cffafe",
    accent: "#06b6d4",
    textDark: "#1f2937",
    textMuted: "#6b7280",
    border: "#d1d5db",
    surface: "#ffffff",
    surfaceMuted: "#f9fafb",
};

const styles = StyleSheet.create({
    body: {
        fontFamily: "Montserrat-Arabic",
        backgroundColor: cardPalette.surface,
        padding: 0,
    },
    card: {
        width: "100%",
        height: "100%",
        backgroundColor: cardPalette.surface,
        borderWidth: 1,
        borderColor: cardPalette.border,
        borderStyle: "solid",
    },
    headerBar: {
        backgroundColor: cardPalette.primary,
        color: "#ffffff",
        paddingVertical: 4,
        paddingHorizontal: 8,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: {
        fontSize: 9,
        fontWeight: 700,
        color: "#ffffff",
    },
    headerSubtitle: {
        fontSize: 7,
        color: "#cffafe",
    },
    accentStrip: {
        height: 2,
        backgroundColor: cardPalette.accent,
    },
    footerBar: {
        backgroundColor: cardPalette.primaryDark,
        color: "#ffffff",
        paddingVertical: 3,
        paddingHorizontal: 8,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
    },
    footerText: {
        fontSize: 6,
        color: "#cffafe",
    },
    label: {
        fontSize: 6,
        color: cardPalette.textMuted,
        fontWeight: 700,
    },
    value: {
        fontSize: 7,
        color: cardPalette.textDark,
        fontWeight: 500,
    },
    valueStrong: {
        fontSize: 8,
        color: cardPalette.textDark,
        fontWeight: 700,
    },
    row: {
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "flex-start",
        marginBottom: 1,
    },
});

// Exported so tests can validate name composition (joins parts, drops undefined).
export const buildFullName = (person?: any): string => {
    if (!person) return "";
    return [person.first_name, person.second_name, person.third_name, person.tribe]
        .filter((p) => typeof p === "string" && p.length > 0)
        .join(" ");
};

// Exported so tests can validate the birth-date display string.
export const formatBirthLine = (dateBirth?: string): string => {
    if (!dateBirth) return "";
    const parsed = dayjs(dateBirth);
    if (!parsed.isValid()) return dateBirth;
    return `${dateBirth} (${parsed.locale("ar").fromNow(true)})`;
};

// Exported so tests can verify QR generation produces a non-empty data URL.
export const generateQrDataUrl = async (text: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(text || " ", { margin: 2 });
    } catch {
        return "";
    }
};

// Front + back templates that LeagueCards.tsx can reuse so all ID cards stay
// visually identical regardless of entry point.
export const CardFrontPage = ({
    qrDataUrl,
    player,
    headerTitle,
    headerSubtitle,
}: {
    qrDataUrl: string;
    player: any;
    headerTitle?: string;
    headerSubtitle?: string;
}) => {
    const fullName = buildFullName(player?.person);
    const birthLine = formatBirthLine(player?.person?.date_birth);
    const team = player?.team;
    const club = team?.club;

    return (
        <Page orientation={"landscape"} style={styles.body} size={"A7"}>
            <View style={styles.card}>
                <View style={styles.headerBar}>
                    <Text style={styles.headerTitle}>{headerTitle || "بطاقة لاعب"}</Text>
                    <Text style={styles.headerSubtitle}>{headerSubtitle || team?.name || ""}</Text>
                </View>
                <View style={styles.accentStrip} />

                <View
                    style={{
                        flex: 1,
                        flexDirection: "row-reverse",
                        padding: 6,
                        gap: 6,
                    }}
                >
                    {/* Right column: photo + QR */}
                    <View
                        style={{
                            width: 78,
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 4,
                        }}
                    >
                        {player?.person?.personal_picture ? (
                            <Image
                                style={{
                                    width: 70,
                                    height: 78,
                                    borderWidth: 1,
                                    borderColor: cardPalette.primary,
                                    borderStyle: "solid",
                                }}
                                src={`${apiUrl}/images/${player.person.personal_picture}`}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 70,
                                    height: 78,
                                    borderWidth: 1,
                                    borderColor: cardPalette.border,
                                    borderStyle: "solid",
                                    backgroundColor: cardPalette.surfaceMuted,
                                }}
                            />
                        )}
                    </View>

                    {/* Left column: data rows */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "column",
                            justifyContent: "space-between",
                            paddingVertical: 2,
                        }}
                    >
                        <View>
                            <Text style={styles.label}>الاسم الكامل</Text>
                            <Text style={styles.valueStrong}>{fullName}</Text>
                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: cardPalette.border,
                                    marginVertical: 3,
                                }}
                            />

                            <Text style={styles.label}>الفريق</Text>
                            <Text style={styles.value}>{team?.name || "—"}</Text>
                            <View style={{ height: 3 }} />

                            <Text style={styles.label}>تاريخ الميلاد</Text>
                            <Text style={styles.value}>{birthLine || "—"}</Text>
                            <View style={{ height: 3 }} />

                            <Text style={styles.label}>الرقم المدني</Text>
                            <Text style={styles.value}>{player?.person?.card_number || "—"}</Text>
                        </View>

                        <View
                            style={{
                                flexDirection: "row-reverse",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginTop: 3,
                            }}
                        >
                            {club?.logo ? (
                                <Image
                                    style={{ width: 22, height: 22 }}
                                    src={`${apiUrl}/images/${club.logo}`}
                                />
                            ) : (
                                <View style={{ width: 22, height: 22 }} />
                            )}
                            {qrDataUrl ? (
                                <Image style={{ width: 36, height: 36 }} src={qrDataUrl} />
                            ) : (
                                <View style={{ width: 36, height: 36 }} />
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.accentStrip} />
                <View style={styles.footerBar}>
                    <Text style={styles.footerText}>منصة طموح</Text>
                    <Text style={styles.footerText}>omkooora.com</Text>
                </View>
            </View>
        </Page>
    );
};

export const CardBackPage = ({
    player,
    headerTitle,
    headerSubtitle,
}: {
    player: any;
    headerTitle?: string;
    headerSubtitle?: string;
}) => {
    const team = player?.team;
    const club = team?.club;

    return (
        <Page orientation={"landscape"} style={styles.body} size={"A7"}>
            <View style={styles.card}>
                <View style={styles.headerBar}>
                    <Text style={styles.headerTitle}>{headerTitle || "بطاقة لاعب"}</Text>
                    <Text style={styles.headerSubtitle}>{headerSubtitle || ""}</Text>
                </View>
                <View style={styles.accentStrip} />

                <View
                    style={{
                        flex: 1,
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row-reverse",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 18,
                        }}
                    >
                        <View style={{ alignItems: "center" }}>
                            {team?.logo ? (
                                <Image
                                    style={{ width: 64, height: 64 }}
                                    src={`${apiUrl}/images/${team.logo}`}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderWidth: 1,
                                        borderColor: cardPalette.border,
                                        borderStyle: "solid",
                                    }}
                                />
                            )}
                            <Text
                                style={{
                                    fontSize: 7,
                                    color: cardPalette.textDark,
                                    fontWeight: 700,
                                    marginTop: 3,
                                }}
                            >
                                {team?.name || ""}
                            </Text>
                            <Text style={{ fontSize: 5, color: cardPalette.textMuted }}>
                                فريق
                            </Text>
                        </View>

                        <View style={{ alignItems: "center" }}>
                            {club?.logo ? (
                                <Image
                                    style={{ width: 64, height: 64 }}
                                    src={`${apiUrl}/images/${club.logo}`}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderWidth: 1,
                                        borderColor: cardPalette.border,
                                        borderStyle: "solid",
                                    }}
                                />
                            )}
                            <Text
                                style={{
                                    fontSize: 7,
                                    color: cardPalette.textDark,
                                    fontWeight: 700,
                                    marginTop: 3,
                                }}
                            >
                                {club?.name || ""}
                            </Text>
                            <Text style={{ fontSize: 5, color: cardPalette.textMuted }}>
                                نادي
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.accentStrip} />
                <View style={styles.footerBar}>
                    <Text style={styles.footerText}>منصة طموح</Text>
                    <Text style={styles.footerText}>omkooora.com</Text>
                </View>
            </View>
        </Page>
    );
};

const CardTemplate = ({ player }: Props) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    useEffect(() => {
        if (!player?.id) {
            setQrDataUrl("");
            return;
        }
        let cancelled = false;
        generateQrDataUrl(`${printUrl}/#/${player.id}`).then((url) => {
            if (!cancelled) setQrDataUrl(url);
        });
        return () => {
            cancelled = true;
        };
    }, [player?.id]);

    if (!player?.id) {
        return (
            <div data-testid="print-card-loading" style={{ padding: 24, textAlign: "center" }}>
                جارٍ تحميل بطاقة اللاعب…
            </div>
        );
    }

    return (
        <PDFViewer
            data-testid="print-card-pdfviewer"
            style={{ minHeight: "calc(100vh - 25px )", minWidth: "calc(100vw - 10px )" }}
        >
            <Document>
                <CardFrontPage qrDataUrl={qrDataUrl} player={player} />
                <CardBackPage player={player} />
            </Document>
        </PDFViewer>
    );
};

export default CardTemplate;
