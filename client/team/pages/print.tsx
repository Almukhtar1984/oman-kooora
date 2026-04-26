import { useTheme } from "@emotion/react";
import Head from "next/head";
import React, {useEffect, useState} from "react";
import useStore from "../store/useStore";
import CardTemplate from "../components/PDF/Card";

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