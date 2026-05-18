import React, { useEffect, useState } from "react";
import { Document, Font, PDFViewer } from "@react-pdf/renderer";
import QRCode from "qrcode";

import { printUrl } from "../../config";
import { CardBackPage, CardFrontPage } from "./Card";

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
                {safePlayers.map((pp) => {
                    const leagueName = pp.participating_team?.league?.name;
                    const teamName = pp.participating_team?.team?.name;
                    return (
                        <React.Fragment key={pp.id}>
                            <CardFrontPage
                                qrDataUrl={qrMap[pp.id] || ""}
                                player={playerForCard(pp)}
                                headerTitle={leagueName || "بطاقة لاعب"}
                                headerSubtitle={teamName}
                            />
                            <CardBackPage
                                player={playerForCard(pp)}
                                headerTitle={leagueName || "بطاقة لاعب"}
                                headerSubtitle={teamName}
                            />
                        </React.Fragment>
                    );
                })}
            </Document>
        </PDFViewer>
    );
};

export default LeagueCards;
