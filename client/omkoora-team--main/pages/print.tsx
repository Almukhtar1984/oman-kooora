import { useTheme } from "@emotion/react";
import Head from "next/head";
import React, {useEffect, useState} from "react";
import dynamic from "next/dynamic";
import useStore from "../store/useStore";

// CardTemplate pulls in @react-pdf/renderer (~3 MB). Loading it via
// next/dynamic with ssr:false keeps it out of the main bundle so it
// only ships when this page is actually opened.
const CardTemplate = dynamic(() => import("../components/PDF/Card"), {
    ssr: false,
});

export default function Print() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme();
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }


    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    return (
        <div></div>//<CardTemplate shipmentDataList={[]} userData={userData} />
    );
}