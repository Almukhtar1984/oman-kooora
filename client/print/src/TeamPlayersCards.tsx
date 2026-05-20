import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAllParticipatingPlayers } from "./graphql";
import LeagueCards from "./components/PDF/LeagueCards";

export default function TeamPlayersCards() {
    const { teamId, ids } = useParams();
    const [getPlayers] = useAllParticipatingPlayers();
    const [players, setPlayers] = useState<any[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);

    const wantedIds = useMemo(() => {
        if (!ids || ids === "all") return null;
        return new Set(
            String(ids)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
        );
    }, [ids]);

    useEffect(() => {
        if (!teamId) return;
        getPlayers({
            variables: { idParticipatingTeams: teamId },
            fetchPolicy: "cache-first",
            onCompleted: ({ allParticipatingPlayers }) => {
                const list = (allParticipatingPlayers || []) as any[];
                const filtered = wantedIds
                    ? list.filter((p: any) => p?.id && wantedIds.has(p.id))
                    : list;
                setPlayers(filtered);
                setLoaded(true);
            },
            onError: () => {
                setPlayers([]);
                setLoaded(true);
            },
        });
    }, [getPlayers, teamId, wantedIds]);

    if (!loaded) {
        return (
            <div data-testid="team-cards-loading" style={{ padding: 24, textAlign: "center" }}>
                جارٍ تحميل بطاقات اللاعبين…
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                لا يوجد لاعبون مطابقون للطباعة.
            </div>
        );
    }

    return <LeagueCards players={players} />;
}
