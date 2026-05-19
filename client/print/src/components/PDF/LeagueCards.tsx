import React, { useMemo, useState } from "react";
import { Document, Font, PDFViewer, pdf } from "@react-pdf/renderer";

import { CardFrontPage } from "./Card";
import { usePrintAssets } from "../../hooks/usePrintAssets";
import PrintProgress from "../PrintProgress";

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

// Flatten the ParticipatingPlayer envelope into the shape CardFrontPage expects
// (id, person, team{club}) so the league entry-point and the single-player
// entry-point render the exact same card.
const playerForCard = (pp: ParticipatingPlayer) => ({
    id: pp.player?.id,
    person: pp.player?.person,
    team: pp.participating_team?.team,
});

const LeagueCards = ({ players }: Props) => {
    const safePlayers = useMemo(() => players || [], [players]);
    const { images, qr, progress } = usePrintAssets(safePlayers);
    const [downloading, setDownloading] = useState(false);

    const docElement = useMemo(
        () => (
            <Document>
                {safePlayers.map((pp) => {
                    const leagueName = pp.participating_team?.league?.name;
                    const teamName = pp.participating_team?.team?.name;
                    return (
                        <CardFrontPage
                            key={pp.id}
                            qrDataUrl={qr[pp.id] || ""}
                            player={playerForCard(pp)}
                            headerTitle={leagueName || "بطاقة لاعب"}
                            headerSubtitle={teamName}
                            images={images}
                        />
                    );
                })}
            </Document>
        ),
        [safePlayers, qr, images],
    );

    if (safePlayers.length === 0) {
        return (
            <div data-testid="league-cards-empty" style={{ padding: 24, textAlign: "center" }}>
                لا يوجد لاعبون مشاركون في هذه الدورة بعد.
            </div>
        );
    }

    if (!progress.ready) {
        return <PrintProgress progress={progress} label="جارٍ تجهيز بطاقات اللاعبين" />;
    }

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `players-cards-${new Date().toISOString().slice(0, 10)}.pdf`;
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
                    data-testid="league-cards-download"
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
                data-testid="league-cards-pdfviewer"
                style={{ flex: 1, width: "100%", border: "none" }}
            >
                {docElement}
            </PDFViewer>
        </div>
    );
};

export default LeagueCards;
