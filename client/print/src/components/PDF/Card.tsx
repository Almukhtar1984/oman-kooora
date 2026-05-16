import React, { useEffect, useState } from "react";

import {Page, Text, Image, Document, StyleSheet, View, Font, PDFViewer} from "@react-pdf/renderer";
import QRCode from "qrcode";
import dayjs from "dayjs";

import {apiUrl, printUrl} from "../../config";

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
    ]
});

const styles = StyleSheet.create({
    body: {
        fontFamily: "Montserrat-Arabic",
        backgroundColor: "#fff",
        fontSize: 12,
        padding: 14,
    },

    smFont: {
        fontSize: 9,
        color: "#888",
    },

    horizontalDivider: {
        position: "absolute",
        top: 0,
        left: "50%",
        height: "100%",
        textAlign: "center",
        borderLeft: "2px dashed #333",
    },

    verticalDivider: {
        position: "absolute",
        top: "50%",
        left: 0,
        width: "100%",
        textAlign: "center",
        borderTop: "2px dashed #333",
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

    // Don't try to render a PDF until we actually have player data — otherwise
    // PDFViewer renders a card full of "undefined" strings.
    if (!player?.id) {
        return (
            <div data-testid="print-card-loading" style={{ padding: 24, textAlign: "center" }}>
                جارٍ تحميل بطاقة اللاعب…
            </div>
        );
    }

    const fullName = buildFullName(player?.person);
    const birthLine = formatBirthLine(player?.person?.date_birth);

    return (
        <PDFViewer
            data-testid="print-card-pdfviewer"
            style={{ minHeight: "calc(100vh - 25px )", minWidth: "calc(100vw - 10px )" }}
        >
            <Document>
                <Page orientation={"landscape"} style={styles.body} size={"A7"} >

                    <View style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", alignItems: "center", border: "1px solid #555", justifyContent: "space-between"}}>
                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "3cm", alignItems: "center", justifyContent: "space-between"}}>
                            {/* section 1 */}
                            {qrDataUrl
                                ? <Image
                                    style={{ width: "20mm", height: "20mm", marginLeft: "5mm" }}
                                    src={qrDataUrl}
                                />
                                : <View style={{ width: "20mm", height: "20mm", marginLeft: "5mm" }} />
                            }

                            {/* section 2 */}
                            {player?.team?.club?.logo
                                ? <Image style={{ width: "20mm", height: "20mm", marginRight: "5mm" }} src={`${apiUrl}/images/${player.team.club.logo}`} />
                                : <View style={{ width: "20mm", height: "20mm", marginRight: "5mm" }} />
                            }

                        </View>

                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "4cm", alignItems: "center", justifyContent: "space-between", padding: "0.5cm"}}>
                            {/* section 1 */}
                            <View style={{flex: 1}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "30mm"}}>
                                    {/*logo*/}
                                    {player?.person?.personal_picture
                                        ? <Image style={{ width: "100%", height: "2.5cm" }} src={`${apiUrl}/images/${player.person.personal_picture}`} />
                                        : <View style={{width: "100%", height: "2.5cm", border: "1px solid #555"}}/>
                                    }

                                </View>
                            </View>

                            {/* section 2 */}
                            <View style={{flex: 2.5}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {player?.team?.name || ""}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الفريق : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {fullName}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الاسم الكامل : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {birthLine}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>تاريخ الميلاد : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {player?.person?.card_number || ""}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الرقم المدني : </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </Page>
                <Page orientation={"landscape"} style={styles.body} size={"A7"} >

                    <View style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", alignItems: "center", border: "1px solid #555", justifyContent: "center"}}>
                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "3cm", alignItems: "center", justifyContent: "center"}}>
                            {/* section 1 */}
                            {player?.team?.logo
                                ? <Image style={{ width: "30mm", height: "30mm" }} src={`${apiUrl}/images/${player.team.logo}`} />
                                : <View style={{ width: "30mm", height: "30mm" }} />
                            }
                            <View style={{width: "1cm", height: "1cm"}}></View>
                            {/* section 2 */}
                            {player?.team?.club?.logo
                                ? <Image style={{ width: "30mm", height: "30mm" }} src={`${apiUrl}/images/${player.team.club.logo}`} />
                                : <View style={{ width: "30mm", height: "30mm" }} />
                            }
                        </View>

                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
};


export default CardTemplate
