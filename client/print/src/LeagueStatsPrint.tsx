import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLeagueStats } from "./graphql";
import LeagueStatsReport, { LeagueStatsData } from "./components/PDF/LeagueStatsReport";

// Printable league-statistics report. Reached from the dashboard's
// "طباعة الإحصائيات" button (#/league/:id). Every aggregate it needs is a public
// GraphQL query, so it renders from a plain link with no token.
export default function LeagueStatsPrint() {
    const { id } = useParams();
    const [getStats] = useLeagueStats();
    const [data, setData] = useState<LeagueStatsData | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        getStats({
            variables: { id },
            fetchPolicy: "network-only",
            // errorPolicy "all" (set on the hook) delivers partial data here even
            // when one aggregate errors, so onCompleted still fires.
            onCompleted: (res) => {
                const teams = res?.participatingTeamsByLeague || [];
                setData({
                    leagueName: teams[0]?.league?.name || "",
                    participatingTeams: teams,
                    ranking: res?.calculatePoints || [],
                    scorers: res?.calculateGoalPlayer || [],
                    yellowCards: res?.getCardsByLeague?.yellowCards || [],
                    redCards: res?.getCardsByLeague?.redCards || [],
                    alerts: res?.yellowCardAlerts || [],
                });
                setLoaded(true);
            },
            onError: () => {
                setData({});
                setLoaded(true);
            },
        });
    }, [getStats, id]);

    if (!loaded) {
        return (
            <div data-testid="league-stats-loading" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                جارٍ جلب إحصائيات البطولة…
            </div>
        );
    }

    return <LeagueStatsReport data={data || {}} />;
}
