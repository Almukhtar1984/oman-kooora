import React from "react";

import {Page, Text, Image, Document, StyleSheet, View, Font, PDFViewer} from "@react-pdf/renderer";
import QRCode from "qrcode";
//@ts-ignore
import dayjs from "dayjs";

import {apiUrl, printUrl} from "../../config";

interface Props {
    assembly?: any;
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
        fontSize: "9",
        color: "#888",
    },

    horizontalDivider: {
        position: "absolute",
        top: 0,
        left: "50%",
        height: "100%",
        textAlign: "center",
        borderLeft: `2px dashed #333}`,
    },

    verticalDivider: {
        position: "absolute",
        top: "50%",
        left: 0,
        width: "100%",
        textAlign: "center",
        borderTop: `2px dashed #333`,
    },
})

const AssemblyCardTemplate = ({ assembly }: Props) => {
    let canvas: any = null;
    let qrCodeGenerator = (qrcode: any) => {
        canvas = document.createElement("canvas");
        QRCode.toCanvas(canvas, qrcode, {
            margin: 2,
        });
        return canvas.toDataURL();
    };

    let expireDate = (subscription_date: string) => {
        const year = dayjs(subscription_date).format("YYYY")
    
        const date = new Date(`${parseInt(year)+1}-12-31`);

        return dayjs(date).format("YYYY-MM-DD");
    };

    return (
        <PDFViewer style={{ minHeight: "calc(100vh - 25px )", minWidth: "calc(100vw - 10px )" }}>
            <Document>
                <Page orientation={"landscape"} style={styles.body} size={"A7"} >

                    <View style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", alignItems: "center", border: "1px solid #555", justifyContent: "space-between"}}>
                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "3cm", alignItems: "center", justifyContent: "space-between"}}>
                            {/* section 1 */}
                            <Image
                                style={{ width: "20mm", height: "20mm", marginLeft: "5mm" }}
                                src={qrCodeGenerator(`${printUrl}/#/${assembly?.id}`)}
                            />

                            {/* section 2 */}
                            <Image style={{ width: "20mm", height: "20mm", marginRight: "5mm" }} src={`${assembly?.team?.club?.logo}`} />

                        </View>

                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "4cm", alignItems: "center", justifyContent: "space-between", padding: "0.5cm"}}>
                            {/* section 1 */}
                            <View style={{flex: 1}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "30mm"}}>
                                    {/*logo*/}
                                    {assembly?.personal_picture
                                        ? <Image style={{ width: "100%", height: "2.5cm" }} src={`${apiUrl}/images/${assembly?.personal_picture}`} />
                                        : <View style={{width: "100%", height: "2.5cm", border: "1px solid #555"}}/>
                                    }

                                </View>
                            </View>

                            {/* *section 2 */}
                            <View style={{flex: 2.5}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {`${assembly?.team?.name}`}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الفريق : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {`${assembly?.first_name} ${assembly?.second_name} ${assembly?.third_name} ${assembly?.tribe}`}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الاسم الكامل : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {`${assembly?.card_number}`}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الرقم المدني : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>
                                            {`${expireDate(assembly?.subscription_date)}`}
                                        </Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>تاريخ الانتهاء : </Text>
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
                            <Image
                                style={{ width: "30mm", height: "30mm" }}
                                src={`${assembly?.team?.logo}`}
                            />
                            <View style={{width: "1cm", height: "1cm"}}></View>
                            {/* section 2 */}
                            <Image
                                style={{ width: "30mm", height: "30mm" }}
                                src={`${assembly?.team?.club?.logo}`}
                            />
                        </View>

                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
};


export default AssemblyCardTemplate
