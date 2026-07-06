import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLeagueTeams } from "./graphql";
import TeamsList from "./components/PDF/TeamsList";

export default function LeagueTeamsList() {
    const { id } = useParams();
    const [getLeague] = useLeagueTeams();
    const [teams, setTeams] = useState<any[]>([]);
    const [leagueName, setLeagueName] = useState<string>("");
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        getLeague({
            variables: { idLeague: id },
            fetchPolicy: "cache-first",
            onCompleted: ({ participatingTeamsByLeague }) => {
                const list = participatingTeamsByLeague || [];
                setTeams(list);
                setLeagueName(list[0]?.league?.name || "");
                setLoaded(true);
            },
            onError: () => {
                setTeams([]);
                setLoaded(true);
            },
        });
    }, [getLeague, id]);

    if (!loaded) {
        return (
            <div data-testid="teams-list-loading" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                جارٍ تحميل قائمة الفرق المشاركة…
            </div>
        );
    }

    return <TeamsList teams={teams} leagueName={leagueName} />;
}
