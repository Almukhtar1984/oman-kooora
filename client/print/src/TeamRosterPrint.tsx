import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTeamRoster } from "./graphql";
import TeamRosterList from "./components/PDF/TeamRosterList";

export default function TeamRosterPrint() {
    const { id } = useParams();
    const [getRoster] = useTeamRoster();
    const [roster, setRoster] = useState<any>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        getRoster({
            variables: { id },
            fetchPolicy: "network-only",
            onCompleted: ({ teamRoster }) => {
                setRoster(teamRoster || null);
                setLoaded(true);
            },
            onError: () => {
                setRoster(null);
                setLoaded(true);
            },
        });
    }, [getRoster, id]);

    if (!loaded) {
        return (
            <div data-testid="team-roster-loading" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                جارٍ تحميل كشف الفريق…
            </div>
        );
    }

    return <TeamRosterList roster={roster} />;
}
