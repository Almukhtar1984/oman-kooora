import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useParticipatingPlayersByLeague } from "./graphql";
import LeagueList from "./components/PDF/LeagueList";

export default function LeaguePlayersList() {
    const { id } = useParams();
    const [getPlayers] = useParticipatingPlayersByLeague();
    const [players, setPlayers] = useState<any[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        getPlayers({
            variables: { idLeague: id },
            fetchPolicy: "network-only",
            onCompleted: ({ participatingPlayersByLeague }) => {
                setPlayers(participatingPlayersByLeague || []);
                setLoaded(true);
            },
            onError: () => {
                setPlayers([]);
                setLoaded(true);
            },
        });
    }, [getPlayers, id]);

    if (!loaded) {
        return (
            <div data-testid="league-list-loading" style={{ padding: 24, textAlign: "center" }}>
                جارٍ تحميل قائمة اللاعبين المشاركين…
            </div>
        );
    }

    return <LeagueList players={players} />;
}
