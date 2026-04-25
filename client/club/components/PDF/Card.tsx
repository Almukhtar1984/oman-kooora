import React, { useState } from "react";
import {Page, Text, Image, Document, StyleSheet, View, Font, PDFViewer,} from "@react-pdf/renderer";
import QRCode from "qrcode";

interface Props {
    shipmentDataList?: any;
    userData?: any;
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

let fontsLoaded: any = false;
let forceUpdate: any = null;


// Helper to trigger an update in a functional component
function useForceUpdate() {
    const [value, setValue] = useState(0);
    return () => setValue((value) => value + 1);
}

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

const CardTemplate = ({ shipmentDataList, userData }: Props) => {
    forceUpdate = useForceUpdate();

    let canvas: any = null;
    // qrcode generator
    // let qrCodeGenerator = (qrcode: any) => {
    //     canvas = document.createElement("canvas");
    //     QRCode.toCanvas(canvas, qrcode, {
    //         margin: 2,
    //     });
    //     return canvas.toDataURL();
    // };


    return (
        <PDFViewer width={"100%"} style={{ minHeight: "calc(100vh - 5px )" }}>
            <Document>
                <Page orientation={"landscape"} style={styles.body} size={"A7"} >

                    <View style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", alignItems: "center", border: "1px solid #555", justifyContent: "space-between"}}>
                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "3cm", alignItems: "center", justifyContent: "space-between"}}>
                            {/* section 1 */}
                            <View style={{flex: 2.5}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    {/*<Image*/}
                                    {/*    style={{ width: "20mm", height: "20mm" }}*/}
                                    {/*    src={qrCodeGenerator("312456456")}*/}
                                    {/*/>*/}
                                </View>
                            </View>

                            {/* section 2 */}
                            <View style={{flex: 1}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "18mm", width: "18mm"}}>
                                    {/* logo */}
                                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                    <Image style={{ width: "20mm", height: "20mm" }} src={"/logo.jpg"} />
                                </View>
                            </View>

                        </View>

                        <View style={{display: "flex", flexDirection: "row", width: "100%", height: "4cm", alignItems: "center", justifyContent: "space-between", padding: "0.5cm"}}>
                            {/* section 1 */}
                            <View style={{flex: 1}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "30mm"}}>
                                    {/*logo*/}
                                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                    <Image style={{ width: "100%", height: "20mm" }} src={"/Mahrez.jpg"} />
                                </View>
                            </View>

                            {/* *section 2 */}
                            <View style={{flex: 2.5}}>
                                <View style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>هشام هشام هشام هشام</Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الاسم الكامل : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>20/09/1998</Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>تاريح الميلاد : </Text>
                                    </View>
                                    <View style={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center"}}>
                                        <Text style={{fontSize: 7, fontWeight: 500, marginRight: 5}}>فريق الشباب</Text>
                                        <Text style={{fontSize: 7, fontWeight: 600}}>الفريق : </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
};


export default CardTemplate
