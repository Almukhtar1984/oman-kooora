import React, { useState } from "react";

import {Page, Text, Image, Document, StyleSheet, View, Font, PDFViewer} from "@react-pdf/renderer";

interface Props {
    players?: any;
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

const ListMembers = ({ players }: Props) => {
    let forceUpdate = useForceUpdate();

    const apiUrl = "https://api.omkooora.com"
    // const apiUrl = "http://localhost:7000"


    return (
        <PDFViewer  style={{ minHeight: "calc(100vh - 25px )", minWidth: "calc(100vw - 10px )" }}>
            <Document>
                <Page orientation={"portrait"} style={styles.body} size={"A4"} >

                    <View style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", alignItems: "center", border: "1px solid #555", justifyContent: "flex-start"}}>
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
                                    <Image style={{ width: "20mm", height: "20mm" }} src={"/logo.jpg"} />
                                </View>
                            </View>

                        </View>

                        <View style={{display: "flex", flexDirection: "row", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "0cm 0.2cm"}}>
                            <View style={{flex: 0.7, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>التصنيف</Text>
                            </View>
                            <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>الفريق</Text>
                            </View>
                            <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>تاريخ الميلاد</Text>
                            </View>
                            <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>رقم الهوية</Text>
                            </View>
                            <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>رقم الهاتف</Text>
                            </View>
                            <View style={{flex: 2, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>الاسم الكامل</Text>
                            </View>
                            <View style={{flex: 0.3, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eee"}}>
                                <Text style={{fontSize: 9, fontWeight: 500}}>#</Text>
                            </View>
                        </View>

                        {players?.map((player: any, index: number) => (
                            <View style={{display: "flex", flexDirection: "row", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "0.2cm 0.2cm 0"}}>
                                <View style={{flex: 0.7, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {player?.occupation}
                                    </Text>
                                </View>
                                <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {player?.team?.name}
                                    </Text>
                                </View>
                                <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {player?.person?.date_birth}
                                    </Text>
                                </View>
                                <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {player?.person?.card_number}
                                    </Text>
                                </View>
                                <View style={{flex: 1, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {player?.person?.phone}
                                    </Text>
                                </View>
                                <View style={{flex: 2, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {`${player?.person?.first_name} ${player?.person?.second_name} ${player?.person?.third_name} ${player?.person?.tribe}`}
                                    </Text>
                                </View>
                                <View style={{flex: 0.3, border: "1px solid #555", height: "1cm", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{fontSize: 9, fontWeight: 400}}>
                                        {index+1}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
};


export default ListMembers