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

// Display strings so the same component prints player AND technical-staff
// cards — only the wording changes, the card layout stays identical.
export interface CardsLabels {
    empty: string;
    preparing: string;
    unit: string;
    filePrefix: string;
    headerFallback: string;
}

const PLAYER_LABELS: CardsLabels = {
    empty: "لا يوجد لاعبون مشاركون في هذه الدورة بعد.",
    preparing: "جارٍ تجهيز بطاقات اللاعبين",
    unit: "بطاقة لاعب",
    filePrefix: "players-cards",
    headerFallback: "بطاقة لاعب",
};

interface Props {
    players?: ParticipatingPlayer[];
    labels?: CardsLabels;
    // Above this player count the component defers mounting PDFViewer until the
    // user explicitly clicks "عرض PDF" — for 200–300+ players the viewer alone
    // can cost hundreds of MB of memory.
    deferViewerAbove?: number;
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
    // Set on technical-staff envelopes (TeamStaffCards) — renders a "الصفة" row.
    occupation: pp.player?.occupation,
});

const toolbarStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    padding: "6px 10px",
    gap: 8,
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    direction: "rtl",
};

const primaryBtn: React.CSSProperties = {
    backgroundColor: "#0891b2",
    color: "#ffffff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
    ...primaryBtn,
    backgroundColor: "#ffffff",
    color: "#0891b2",
    border: "1px solid #0891b2",
};

const LeagueCards = ({ players, labels = PLAYER_LABELS, deferViewerAbove = 100 }: Props) => {
    const safePlayers = useMemo(() => players || [], [players]);
    const { images, qr, progress } = usePrintAssets(safePlayers);
    const [downloading, setDownloading] = useState(false);
    // Heavy leagues defer the viewer; light leagues open it immediately.
    const heavy = safePlayers.length > deferViewerAbove;
    const [showViewer, setShowViewer] = useState(!heavy);

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
                            headerTitle={leagueName || labels.headerFallback}
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
                {labels.empty}
            </div>
        );
    }

    if (!progress.ready) {
        return (
            <PrintProgress
                progress={progress}
                label={labels.preparing}
                totalPlayers={safePlayers.length}
            />
        );
    }

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const blob = await pdf(docElement).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${labels.filePrefix}-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } finally {
            setDownloading(false);
        }
    };

    // Heavy league ready screen: don't mount PDFViewer until the user asks.
    // For 200–300+ players, mounting the viewer can take 30+ seconds and
    // hundreds of MB; many users only need the file, not the on-screen preview.
    if (heavy && !showViewer) {
        return (
            <div
                data-testid="league-cards-ready"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    direction: "rtl",
                    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
                    color: "#1f2937",
                    padding: 24,
                    gap: 14,
                }}
            >
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                    الملف جاهز
                </div>
                <div style={{ color: "#6b7280", textAlign: "center" }}>
                    {safePlayers.length} {labels.unit} — {progress.imagesTotal} صورة موحّدة
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                        type="button"
                        style={{ ...primaryBtn, opacity: downloading ? 0.7 : 1, cursor: downloading ? "wait" : "pointer" }}
                        onClick={handleDownload}
                        disabled={downloading}
                        data-testid="league-cards-download"
                    >
                        {downloading ? "جارٍ التحميل…" : "تحميل PDF مباشرة"}
                    </button>
                    <button
                        type="button"
                        style={secondaryBtn}
                        onClick={() => setShowViewer(true)}
                        data-testid="league-cards-show-viewer"
                    >
                        عرض PDF داخل المتصفح
                    </button>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>
                    التحميل المباشر أسرع للأعداد الكبيرة ويوفّر ذاكرة المتصفح
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={toolbarStyle}>
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    data-testid="league-cards-download"
                    style={{ ...primaryBtn, opacity: downloading ? 0.7 : 1, cursor: downloading ? "wait" : "pointer" }}
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
