import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAllParticipatingTechnicalStaff } from "./graphql";
import LeagueCards, { CardsLabels } from "./components/PDF/LeagueCards";

const STAFF_LABELS: CardsLabels = {
    empty: "لا يوجد جهاز فني مطابق للطباعة.",
    preparing: "جارٍ تجهيز بطاقات الجهاز الفني",
    unit: "بطاقة جهاز فني",
    filePrefix: "staff-cards",
    headerFallback: "بطاقة جهاز فني",
};

// Reshape a ParticipatingTechnicalStaff row into the ParticipatingPlayer
// envelope LeagueCards/usePrintAssets expect, so staff cards render with the
// exact same ID-card template as player cards.
const staffToCardEnvelope = (row: any) => ({
    id: row?.id,
    player: {
        id: row?.technicalApparatus?.id,
        occupation: row?.technicalApparatus?.occupation,
        person: row?.technicalApparatus?.person,
    },
    participating_team: row?.participating_team,
});

export default function TeamStaffCards() {
    const { teamId, ids } = useParams();
    const [getStaff] = useAllParticipatingTechnicalStaff();
    const [staff, setStaff] = useState<any[]>([]);
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
        getStaff({
            variables: { idParticipatingTeams: teamId },
            fetchPolicy: "cache-first",
            onCompleted: ({ allParticipatingTechnicalStaff }) => {
                const list = (allParticipatingTechnicalStaff || []) as any[];
                const filtered = wantedIds
                    ? list.filter((s: any) => s?.id && wantedIds.has(s.id))
                    : list;
                setStaff(filtered.map(staffToCardEnvelope));
                setLoaded(true);
            },
            onError: () => {
                setStaff([]);
                setLoaded(true);
            },
        });
    }, [getStaff, teamId, wantedIds]);

    if (!loaded) {
        return (
            <div data-testid="staff-cards-loading" style={{ padding: 24, textAlign: "center" }}>
                جارٍ تحميل بطاقات الجهاز الفني…
            </div>
        );
    }

    if (staff.length === 0) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                لا يوجد جهاز فني مطابق للطباعة.
            </div>
        );
    }

    return <LeagueCards players={staff} labels={STAFF_LABELS} />;
}
