import React from "react";
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

import { buildFullName } from "./Card";

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
    cell: {
        border: "1px solid #555",
        height: "1cm",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    cellText: {
        fontSize: 9,
        fontWeight: 400,
    },
    headerCell: {
        border: "1px solid #555",
        height: "1cm",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eee",
    },
    headerText: {
        fontSize: 9,
        fontWeight: 500,
    },
});

const LeagueList = ({ players }: Props) => {
    const safePlayers = players || [];

    return (
        <PDFViewer
            data-testid="league-list-pdfviewer"
            style={{ minHeight: "calc(100vh - 25px )", minWidth: "calc(100vw - 10px )" }}
        >
            <Document>
                <Page orientation={"portrait"} style={styles.body} size={"A4"} wrap={true}>
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            height: "3cm",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                        }}
                    >
                        <View style={{ flex: 2.5 }} />
                        <View style={{ flex: 1 }}>
                            <View
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "18mm",
                                    width: "18mm",
                                }}
                            >
                                <Image style={{ width: "20mm", height: "20mm" }} src={"/logo.jpg"} />
                            </View>
                        </View>
                    </View>

                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            textAlign: "center",
                            marginBottom: "0.4cm",
                        }}
                    >
                        قائمة اللاعبين المشاركين في الدورة
                    </Text>

                    <View
                        style={{
                            display: "flex",
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
                        return (
                            <View
                                key={pp.id || index}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    width: "100%",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.1cm 0.2cm 0",
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
        </PDFViewer>
    );
};

export default LeagueList;
