import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMatchLineup } from "./graphql";
import MatchLineupList from "./components/PDF/MatchLineupList";

export default function MatchLineupPrint() {
    const { id } = useParams();
    const [getLineup] = useMatchLineup();
    const [lineup, setLineup] = useState<any>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        getLineup({
            variables: { id },
            fetchPolicy: "network-only",
            onCompleted: ({ matchLineup }) => {
                setLineup(matchLineup || null);
                setLoaded(true);
            },
            onError: () => {
                setLineup(null);
                setLoaded(true);
            },
        });
    }, [getLineup, id]);

    if (!loaded) {
        return (
            <div data-testid="match-lineup-loading" style={{ padding: 24, textAlign: "center", direction: "rtl" }}>
                جارٍ تحميل كشف لاعبي المباراة…
            </div>
        );
    }

    return <MatchLineupList lineup={lineup} />;
}
