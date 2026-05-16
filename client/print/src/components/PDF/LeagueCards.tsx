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
import { buildFullName, formatBirthLine } from "./Card";

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
        padding: 14,
    },
});

const useQrMap = (players: ParticipatingPlayer[] | undefined) => {
    const [map, setMap] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;
        if (!players || players.length === 0) {
            setMap({});
            return;
        }

        Promise.all(
            players.map(async (pp) => {
                const playerId = pp?.player?.id;
                if (!playerId) return [pp.id, ""] as const;
                try {
                    const url = await QRCode.toDataURL(`${printUrl}/#/${playerId}`, { margin: 2 });
                    return [pp.id, url] as const;
                } catch {
                    return [pp.id, ""] as const;
                }
            }),
        ).then((entries) => {
            if (cancelled) return;
            setMap(Object.fromEntries(entries));
        });

        return () => {
            cancelled = true;
        };
    }, [players]);

    return map;
};

const PlayerCardPages = ({
    item,
    qrDataUrl,
}: {
    item: ParticipatingPlayer;
    qrDataUrl: string;
}) => {
    const player = item.player;
    const team = item.participating_team?.team;
    const club = team?.club;
    const fullName = buildFullName(player?.person);
    const birthLine = formatBirthLine(player?.person?.date_birth);

    return (
        <>
            <Page orientation={"landscape"} style={styles.body} size={"A7"}>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        border: "1px solid #555",
                        justifyContent: "space-between",
                    }}
                >
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            height: "3cm",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        {qrDataUrl ? (
                            <Image
                                style={{ width: "20mm", height: "20mm", marginLeft: "5mm" }}
                                src={qrDataUrl}
                            />
                        ) : (
                            <View style={{ width: "20mm", height: "20mm", marginLeft: "5mm" }} />
                        )}

                        {club?.logo ? (
                            <Image
                                style={{ width: "20mm", height: "20mm", marginRight: "5mm" }}
                                src={`${apiUrl}/images/${club.logo}`}
                            />
                        ) : (
                            <View style={{ width: "20mm", height: "20mm", marginRight: "5mm" }} />
                        )}
                    </View>

                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            height: "4cm",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.5cm",
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <View
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "30mm",
                                }}
                            >
                                {player?.person?.personal_picture ? (
                                    <Image
                                        style={{ width: "100%", height: "2.5cm" }}
                                        src={`${apiUrl}/images/${player.person.personal_picture}`}
                                    />
                                ) : (
                                    <View
                                        style={{
                                            width: "100%",
                                            height: "2.5cm",
                                            border: "1px solid #555",
                                        }}
                                    />
                                )}
                            </View>
                        </View>

                        <View style={{ flex: 2.5 }}>
                            <View
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                <View
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontSize: 7, fontWeight: 500, marginRight: 5 }}>
                                        {team?.name || ""}
                                    </Text>
                                    <Text style={{ fontSize: 7, fontWeight: 600 }}>الفريق : </Text>
                                </View>
                                <View
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontSize: 7, fontWeight: 500, marginRight: 5 }}>
                                        {fullName}
                                    </Text>
                                    <Text style={{ fontSize: 7, fontWeight: 600 }}>
                                        الاسم الكامل :{" "}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontSize: 7, fontWeight: 500, marginRight: 5 }}>
                                        {birthLine}
                                    </Text>
                                    <Text style={{ fontSize: 7, fontWeight: 600 }}>
                                        تاريخ الميلاد :{" "}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontSize: 7, fontWeight: 500, marginRight: 5 }}>
                                        {player?.person?.card_number || ""}
                                    </Text>
                                    <Text style={{ fontSize: 7, fontWeight: 600 }}>
                                        الرقم المدني :{" "}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>

            <Page orientation={"landscape"} style={styles.body} size={"A7"}>
                <View
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        border: "1px solid #555",
                        justifyContent: "center",
                    }}
                >
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            height: "3cm",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {team?.logo ? (
                            <Image
                                style={{ width: "30mm", height: "30mm" }}
                                src={`${apiUrl}/images/${team.logo}`}
                            />
                        ) : (
                            <View style={{ width: "30mm", height: "30mm" }} />
                        )}
                        <View style={{ width: "1cm", height: "1cm" }} />
                        {club?.logo ? (
                            <Image
                                style={{ width: "30mm", height: "30mm" }}
                                src={`${apiUrl}/images/${club.logo}`}
                            />
                        ) : (
                            <View style={{ width: "30mm", height: "30mm" }} />
                        )}
                    </View>
                </View>
            </Page>
        </>
    );
};

const LeagueCards = ({ players }: Props) => {
    const qrMap = useQrMap(players);
    const safePlayers = players || [];

    if (safePlayers.length === 0) {
        return (
            <div data-testid="league-cards-empty" style={{ padding: 24, textAlign: "center" }}>
                لا يوجد لاعبون مشاركون في هذه الدورة بعد.
            </div>
        );
    }

    return (
        <PDFViewer
            data-testid="league-cards-pdfviewer"
            style={{ minHeight: "calc(100vh - 25px )", minWidth: "calc(100vw - 10px )" }}
        >
            <Document>
                {safePlayers.map((pp) => (
                    <PlayerCardPages key={pp.id} item={pp} qrDataUrl={qrMap[pp.id] || ""} />
                ))}
            </Document>
        </PDFViewer>
    );
};

export default LeagueCards;
