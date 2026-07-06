import {
    Badge,
    Box,
    Button,
    Center,
    Divider,
    Grid,
    Group,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    ThemeIcon,
    useMantineTheme,
} from "@mantine/core";
import {
    IconAlertTriangle,
    IconCards,
    IconChartBar,
    IconExternalLink,
    IconFlag,
    IconPrinter,
    IconBallFootball,
    IconTarget,
    IconTrophy,
    IconUsersGroup,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { printUrl } from "../../lib/config";
import {
    useCardsByLeague,
    useGetRanking,
    useTopGoal,
    useYellowCardAlerts,
} from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

type Props = {
    data?: any;
} & ModalProps;

type Ranking = {
    team: { id: string; name: string };
    points: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    group?: string;
    goalsFor?: number;
    goalsAgainst?: number;
};

type Scorer = {
    team: string;
    Goal: number;
    PlayerID?: {
        id: string;
        number?: string;
        player?: { person?: { first_name?: string; second_name?: string; third_name?: string; tribe?: string } };
    };
};

type CardRow = {
    player: string;
    number?: string;
    count: number;
    team?: { id: string; name: string };
};

type CardIncident = {
    opponent: string;
    minute?: string;
    matchType?: string;
    matchDate?: string;
};

const MATCH_TYPE_LABELS: Record<string, string> = {
    "groups": "دوري المجموعات",
    "league-16": "دوري الستة عشر",
    "league-8": "دوري الثمانية",
    "quarter-finals": "ربع النهائي",
    "semi-finals": "نصف النهائي",
    "final": "النهائي",
};

export const STAGE_OPTIONS = [
    { value: "all", label: "كل المراحل" },
    { value: "groups", label: "المجموعات" },
    { value: "league-16", label: "دور الـ16" },
    { value: "league-8", label: "دور الـ8" },
    { value: "quarter-finals", label: "ربع النهائي" },
    { value: "semi-finals", label: "نصف النهائي (دور الـ4)" },
    { value: "final", label: "النهائي" },
];

export const matchTypeLabel = (t?: string) => (t && MATCH_TYPE_LABELS[t]) || t || "";

export const computeStageScorers = (matches: any[], stage: string): Scorer[] => {
    if (!matches) return [];
    const filtered = stage === "all" ? matches : matches.filter((m) => m?.type === stage);
    const tally = new Map<string, { team: string; goals: number; player: any }>();

    const bump = (entries: any[] | undefined, teamName: string) => {
        for (const s of entries || []) {
            const key = s?.participating_player?.id;
            if (!key) continue;
            const existing = tally.get(key);
            if (existing) existing.goals++;
            else tally.set(key, { team: teamName, goals: 1, player: s.participating_player });
        }
    };

    for (const m of filtered) {
        bump(m?.firstTeamScorersMatch, m?.firstTeam?.team?.name || "—");
        bump(m?.secondTeamScorersMatch, m?.secondTeam?.team?.name || "—");
    }

    return Array.from(tally.values())
        .map((e) => ({
            team: e.team,
            Goal: e.goals,
            PlayerID: {
                id: e.player?.id,
                number: e.player?.number,
                player: e.player?.player,
            },
        }))
        .sort((a, b) => b.Goal - a.Goal);
};

export const computeStageCards = (
    matches: any[],
    stage: string
): { yellowCards: CardRow[]; redCards: CardRow[] } => {
    if (!matches) return { yellowCards: [], redCards: [] };
    const filtered = stage === "all" ? matches : matches.filter((m) => m?.type === stage);
    const yellowMap = new Map<string, CardRow>();
    const redMap = new Map<string, CardRow>();

    const ingest = (card: any, side: any) => {
        if (!card?.player) return;
        const teamId = side?.team?.id;
        const key = `${card.player}::${teamId}`;
        const row: CardRow = {
            player: card.player,
            count: 1,
            team: { id: teamId, name: side?.team?.name },
        };
        if (card.type === "red") {
            if (redMap.has(key)) redMap.get(key)!.count++;
            else redMap.set(key, row);
        } else if (card.type === "yellow") {
            if (yellowMap.has(key)) yellowMap.get(key)!.count++;
            else yellowMap.set(key, row);
        }
    };

    for (const m of filtered) {
        for (const c of m?.firstTeamCards || []) ingest(c, m?.firstTeam);
        for (const c of m?.secondTeamCards || []) ingest(c, m?.secondTeam);
    }

    // Mirror the backend rule (Resolvers/League.mjs getCardsByLeague): a red
    // card on a player suppresses any yellow rows for that same player+team,
    // regardless of match order.
    for (const key of redMap.keys()) yellowMap.delete(key);

    return {
        yellowCards: Array.from(yellowMap.values()).sort((a, b) => b.count - a.count),
        redCards: Array.from(redMap.values()).sort((a, b) => b.count - a.count),
    };
};

export const computeFinalPlacements = (matches: any[]) => {
    if (!matches) return null;
    const finalMatch = matches.find((m) => m?.type === "final" && m?.matchState === "end");
    if (!finalMatch) return null;

    const first = finalMatch.firstTeamGoal ?? 0;
    const second = finalMatch.secondTeamGoal ?? 0;
    if (first === second) {
        // Draw — decided by the penalty shootout when one was recorded.
        const firstPen = finalMatch.penalty?.firstTeamPenalty;
        const secondPen = finalMatch.penalty?.secondTeamPenalty;
        if (
            typeof firstPen === "number" &&
            typeof secondPen === "number" &&
            firstPen !== secondPen
        ) {
            const winner = firstPen > secondPen ? finalMatch.firstTeam?.team : finalMatch.secondTeam?.team;
            const runnerUp = firstPen > secondPen ? finalMatch.secondTeam?.team : finalMatch.firstTeam?.team;
            return { winner, runnerUp, finalMatch };
        }
        // No (or tied) shootout data — surface ambiguous result.
        return { winner: null, runnerUp: null, finalMatch };
    }
    const winner = first > second ? finalMatch.firstTeam?.team : finalMatch.secondTeam?.team;
    const runnerUp = first > second ? finalMatch.secondTeam?.team : finalMatch.firstTeam?.team;
    return { winner, runnerUp, finalMatch };
};

export const collectIncidents = (
    matches: any[],
    playerName: string,
    teamId: string | undefined,
    cardType: "yellow" | "red"
): CardIncident[] => {
    const out: CardIncident[] = [];
    if (!matches || !teamId) return out;

    for (const m of matches) {
        const firstPtId = m?.firstTeam?.id;
        const secondPtId = m?.secondTeam?.id;
        const firstName = m?.firstTeam?.team?.name || "—";
        const secondName = m?.secondTeam?.team?.name || "—";

        for (const c of m?.firstTeamCards || []) {
            if (c?.player === playerName && c?.type === cardType && firstPtId === teamId) {
                out.push({
                    opponent: secondName,
                    minute: c?.date,
                    matchType: m?.type,
                    matchDate: m?.date,
                });
            }
        }
        for (const c of m?.secondTeamCards || []) {
            if (c?.player === playerName && c?.type === cardType && secondPtId === teamId) {
                out.push({
                    opponent: firstName,
                    minute: c?.date,
                    matchType: m?.type,
                    matchDate: m?.date,
                });
            }
        }
    }
    return out;
};

const sortRanking = (a: Ranking, b: Ranking) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    const gdB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    if (gdB !== gdA) return gdB - gdA;
    return (b.goalsFor || 0) - (a.goalsFor || 0);
};

export const LeagueStats = ({ data, ...props }: Props) => {
    const theme = useMantineTheme();

    const [ranking, setRanking] = useState<Ranking[]>([]);
    const [scorers, setScorers] = useState<Scorer[]>([]);
    const [yellowCards, setYellowCards] = useState<CardRow[]>([]);
    const [redCards, setRedCards] = useState<CardRow[]>([]);
    const [yellowAlerts, setYellowAlerts] = useState<any[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>("all");

    const [getRanking, { loading: loadingRanking }] = useGetRanking();
    const [getTopGoal, { loading: loadingGoals }] = useTopGoal();
    const [getCards, { loading: loadingCards }] = useCardsByLeague();
    const [getYellowAlerts] = useYellowCardAlerts();

    useEffect(() => {
        if (!data?.id || !props.opened) return;
        const leagueId = data.id;

        getRanking({
            variables: { leagueId },
            fetchPolicy: "network-only",
            onCompleted: ({ calculatePoints }) => setRanking([...(calculatePoints || [])]),
        });
        getTopGoal({
            variables: { leagueId },
            fetchPolicy: "network-only",
            onCompleted: ({ calculateGoalPlayer }) =>
                setScorers((calculateGoalPlayer || []).filter((s: any) => s && s.PlayerID)),
        });
        getCards({
            variables: { leagueId },
            fetchPolicy: "network-only",
            onCompleted: ({ getCardsByLeague }) => {
                setYellowCards(
                    [...(getCardsByLeague?.yellowCards || [])]
                        .filter((c: any) => c)
                        .sort((a, b) => b.count - a.count)
                );
                setRedCards(
                    [...(getCardsByLeague?.redCards || [])]
                        .filter((c: any) => c)
                        .sort((a, b) => b.count - a.count)
                );
            },
        });
        getYellowAlerts({
            variables: { leagueId },
            fetchPolicy: "network-only",
            onCompleted: ({ yellowCardAlerts }) => setYellowAlerts([...(yellowCardAlerts || [])].filter(Boolean)),
            onError: () => setYellowAlerts([]),
        });
    }, [data, props.opened, getRanking, getTopGoal, getCards, getYellowAlerts]);

    // Group teams by group letter, fallback to participatingTeams.group for teams without records yet
    const groupedRanking = useMemo(() => {
        const teamsByGroup = new Map<string, Ranking[]>();
        // start with participating teams (so empty groups still render)
        (data?.participatingTeams || []).forEach((pt: any) => {
            const g = pt?.group || "—";
            if (!teamsByGroup.has(g)) teamsByGroup.set(g, []);
            const existsInRanking = ranking.find((r) => r.team?.id === pt?.team?.id);
            if (!existsInRanking) {
                teamsByGroup.get(g)!.push({
                    team: { id: pt?.team?.id, name: pt?.team?.name },
                    points: 0,
                    matchesPlayed: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    group: g,
                    goalsFor: 0,
                    goalsAgainst: 0,
                });
            }
        });
        // merge ranking entries
        ranking.forEach((r) => {
            const g = r.group || "—";
            if (!teamsByGroup.has(g)) teamsByGroup.set(g, []);
            teamsByGroup.get(g)!.push(r);
        });
        // sort
        const result = Array.from(teamsByGroup.entries()).sort(([a], [b]) => a.localeCompare(b));
        return result.map(([group, rows]) => [group, [...rows].sort(sortRanking)] as [string, Ranking[]]);
    }, [ranking, data]);

    const totalMatches = data?.matchs?.length || 0;
    const playedMatches = useMemo(() => {
        return (data?.matchs || []).filter((m: any) => m?.matchState === "end").length;
    }, [data]);
    const remainingMatches = Math.max(0, totalMatches - playedMatches);

    // Per-stage breakdown (client-side). When "all" is selected we keep the
    // server-aggregated lists; for any specific stage we recompute from the
    // matches embedded in the league payload.
    const matchesForStage = useMemo(() => {
        const all = data?.matchs || [];
        return selectedStage === "all" ? all : all.filter((m: any) => m?.type === selectedStage);
    }, [data, selectedStage]);

    const displayedScorers = useMemo(() => {
        if (selectedStage === "all") return scorers;
        return computeStageScorers(data?.matchs || [], selectedStage);
    }, [scorers, data, selectedStage]);

    const displayedCards = useMemo(() => {
        if (selectedStage === "all") return { yellowCards, redCards };
        return computeStageCards(data?.matchs || [], selectedStage);
    }, [yellowCards, redCards, data, selectedStage]);

    const placements = useMemo(() => computeFinalPlacements(data?.matchs || []), [data]);

    const closeModal = () => props.onClose();

    return (
        <Modal
            {...props}
            onClose={closeModal}
            size={"90%"}
            footer={<></>}
            styles={{ body: { backgroundColor: theme.colors.gray[1] } }}
        >
            <Box style={{ padding: 20 }}>
                {/* Header row with overview metrics + print */}
                <Group justify="space-between" align="center" mb={16} wrap="wrap">
                    <Group gap={10}>
                        <ThemeIcon size={36} radius="md" variant="light" color="cyan">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text fw={700} c={theme.colors.gray[8]}>إحصائيات البطولة</Text>
                            <Text size="xs" c={theme.colors.gray[5]}>{data?.name || ""}</Text>
                        </Stack>
                    </Group>

                    <Button
                        variant="light"
                        color="cyan"
                        rightSection={<IconExternalLink size={14} />}
                        leftSection={<IconPrinter size={16} />}
                        component="a"
                        href={`${printUrl}/#/league/${data?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        طباعة الإحصائيات
                    </Button>
                </Group>

                {/* Overview cards */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb={16}>
                    <OverviewCard color="cyan" icon={<IconUsersGroup size={18} />} label="فرق مشاركة" value={data?.participatingTeams?.length || 0} />
                    <OverviewCard color="green" icon={<IconBallFootball size={18} />} label="مباريات لُعبت" value={playedMatches} />
                    <OverviewCard color="orange" icon={<IconFlag size={18} />} label="مباريات متبقية" value={remainingMatches} />
                    <OverviewCard color="grape" icon={<IconTrophy size={18} />} label="مجموع المباريات" value={totalMatches} />
                </SimpleGrid>

                {placements && (placements.winner || placements.runnerUp) && (
                    <Paper withBorder radius="md" p="md" mb={16} bg="white">
                        <Group gap={10} mb={10}>
                            <ThemeIcon size={28} radius="md" variant="light" color="yellow">
                                <IconTrophy size={16} />
                            </ThemeIcon>
                            <Text fw={700} c={theme.colors.gray[8]}>نتائج المراكز</Text>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <Paper withBorder radius="md" p="sm" bg="yellow.0">
                                <Group gap={8}>
                                    <Badge color="yellow" size="lg" radius="sm">المركز الأول</Badge>
                                    <Text fw={700}>{placements.winner?.name || "— تعادل في النهائي —"}</Text>
                                </Group>
                            </Paper>
                            <Paper withBorder radius="md" p="sm" bg="gray.0">
                                <Group gap={8}>
                                    <Badge color="gray" size="lg" radius="sm">المركز الثاني</Badge>
                                    <Text fw={700}>{placements.runnerUp?.name || "— تعادل في النهائي —"}</Text>
                                </Group>
                            </Paper>
                        </SimpleGrid>
                    </Paper>
                )}

                <Group justify="space-between" align="center" mb={12} wrap="wrap">
                    <Text fw={600} c={theme.colors.gray[7]} size="sm">تصفية حسب المرحلة</Text>
                    <Select
                        data={STAGE_OPTIONS}
                        value={selectedStage}
                        onChange={(v) => setSelectedStage(v || "all")}
                        size="sm"
                        w={220}
                        allowDeselect={false}
                        aria-label="مرحلة البطولة"
                    />
                </Group>

                {yellowAlerts.length > 0 && (
                    <Paper
                        withBorder
                        radius="md"
                        mb="md"
                        p="md"
                        style={{ backgroundColor: "#fffbeb", borderColor: "#f59e0b" }}
                    >
                        <Group gap={8} mb={8} align="center">
                            <ThemeIcon color="yellow" variant="light" radius="xl" size="md">
                                <IconAlertTriangle size={16} />
                            </ThemeIcon>
                            <Text fw={700} c="#92400e">
                                تنبيه: لاعبون حصلوا على بطاقتين صفراوين في مباراتين متتاليتين ({yellowAlerts.length})
                            </Text>
                        </Group>
                        <Stack gap={6}>
                            {yellowAlerts.map((a: any, i: number) => (
                                <Box
                                    key={i}
                                    p="xs"
                                    style={{ backgroundColor: "#fff", borderRadius: 6, border: "1px solid #fde68a" }}
                                >
                                    <Group justify="space-between" wrap="wrap" gap={6}>
                                        <Group gap={8} align="center">
                                            <Text fw={600} size="sm">
                                                {a.player}
                                                {a.number ? ` (#${a.number})` : ""}
                                            </Text>
                                            {a.team?.name && (
                                                <Badge color="gray" variant="light" size="sm" radius="sm">
                                                    {a.team.name}
                                                </Badge>
                                            )}
                                        </Group>
                                        <Badge color="yellow" variant="filled" size="sm" radius="sm">
                                            {a.yellowCount} بطاقة صفراء
                                        </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed" mt={4}>
                                        {(a.matches || [])
                                            .map((m: any) => `${m.firstTeam} ضد ${m.secondTeam}${m.date ? ` — ${String(m.date).slice(0, 10)}` : ""}`)
                                            .join("  ◂▸  ")}
                                    </Text>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                )}

                <Tabs defaultValue="standings" color="cyan" keepMounted={false}>
                    <Tabs.List>
                        <Tabs.Tab value="standings" leftSection={<IconTrophy size={14} />}>الترتيب</Tabs.Tab>
                        <Tabs.Tab value="scorers"   leftSection={<IconTarget size={14} />}>الهدافون</Tabs.Tab>
                        <Tabs.Tab value="yellow"    leftSection={<IconCards size={14} />}>البطاقات الصفراء</Tabs.Tab>
                        <Tabs.Tab value="red"       leftSection={<IconCards size={14} />}>البطاقات الحمراء</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="standings" pt="md">
                        {selectedStage !== "all" && selectedStage !== "groups" && (
                            <Paper withBorder radius="md" p="sm" mb={10} bg="yellow.0">
                                <Text size="xs" c="gray.7">
                                    الترتيب يخص دور المجموعات فقط — الجدول أدناه ثابت بغض النظر عن المرحلة المختارة
                                </Text>
                            </Paper>
                        )}
                        {loadingRanking && <LoadingRow text="جاري حساب الترتيب…" />}
                        {!loadingRanking && groupedRanking.length === 0 && <EmptyRow text="لا توجد بيانات ترتيب بعد" />}

                        <Grid gutter={16}>
                            {groupedRanking.map(([groupName, rows]) => (
                                <Grid.Col key={groupName} span={{ base: 12, md: groupedRanking.length > 1 ? 6 : 12 }}>
                                    <Paper withBorder radius="md" p="md" bg="white">
                                        <Group justify="space-between" mb={10}>
                                            <Text fw={700} c={theme.colors.gray[8]}>{`المجموعة ${groupName}`}</Text>
                                            <Badge size="sm" variant="light" color="cyan">{rows.length} فرق</Badge>
                                        </Group>
                                        <Table striped highlightOnHover withRowBorders={false} verticalSpacing={6} fz="sm">
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th style={{ width: 28 }}>#</Table.Th>
                                                    <Table.Th>النادي</Table.Th>
                                                    <Table.Th ta="center">ل</Table.Th>
                                                    <Table.Th ta="center">ف</Table.Th>
                                                    <Table.Th ta="center">ت</Table.Th>
                                                    <Table.Th ta="center">خ</Table.Th>
                                                    <Table.Th ta="center">له</Table.Th>
                                                    <Table.Th ta="center">عليه</Table.Th>
                                                    <Table.Th ta="center">+/-</Table.Th>
                                                    <Table.Th ta="center">نقاط</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {rows.map((r, i) => {
                                                    const gd = (r.goalsFor || 0) - (r.goalsAgainst || 0);
                                                    return (
                                                        <Table.Tr key={`${r.team?.id}-${i}`}>
                                                            <Table.Td>
                                                                <Badge size="xs" variant={i === 0 ? "filled" : "default"} color={i === 0 ? "yellow" : "gray"} radius="sm">{i + 1}</Badge>
                                                            </Table.Td>
                                                            <Table.Td>{r.team?.name || "—"}</Table.Td>
                                                            <Table.Td ta="center">{r.matchesPlayed}</Table.Td>
                                                            <Table.Td ta="center" c="green.7">{r.wins}</Table.Td>
                                                            <Table.Td ta="center" c="gray.6">{r.draws}</Table.Td>
                                                            <Table.Td ta="center" c="red.7">{r.losses}</Table.Td>
                                                            <Table.Td ta="center">{r.goalsFor ?? 0}</Table.Td>
                                                            <Table.Td ta="center">{r.goalsAgainst ?? 0}</Table.Td>
                                                            <Table.Td ta="center" c={gd > 0 ? "green.7" : gd < 0 ? "red.7" : "gray.6"}>
                                                                {gd > 0 ? `+${gd}` : gd}
                                                            </Table.Td>
                                                            <Table.Td ta="center"><Text fw={700}>{r.points}</Text></Table.Td>
                                                        </Table.Tr>
                                                    );
                                                })}
                                            </Table.Tbody>
                                        </Table>
                                    </Paper>
                                </Grid.Col>
                            ))}
                        </Grid>
                    </Tabs.Panel>

                    <Tabs.Panel value="scorers" pt="md">
                        <Paper withBorder radius="md" p="md" bg="white">
                            {loadingGoals && selectedStage === "all" && <LoadingRow text="جاري جلب الهدافين…" />}
                            {!loadingGoals && displayedScorers.length === 0 && <EmptyRow text="لا يوجد هدافون بعد" />}
                            {!loadingGoals && displayedScorers.length > 0 && (
                                <Table striped highlightOnHover withRowBorders={false} verticalSpacing={6} fz="sm">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th style={{ width: 36 }}>#</Table.Th>
                                            <Table.Th>اللاعب</Table.Th>
                                            <Table.Th>الفريق</Table.Th>
                                            <Table.Th ta="center">أهداف</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {displayedScorers.map((s, i) => {
                                            if (!s) return null;
                                            const p = s?.PlayerID?.player?.person;
                                            const name = [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ");
                                            return (
                                                <Table.Tr key={`${s?.PlayerID?.id || i}-${i}`}>
                                                    <Table.Td>{i + 1}</Table.Td>
                                                    <Table.Td>{name || "—"}</Table.Td>
                                                    <Table.Td>{s?.team}</Table.Td>
                                                    <Table.Td ta="center">
                                                        <Badge size="sm" variant="light" color="green">{s?.Goal ?? 0}</Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Paper>
                    </Tabs.Panel>

                    <Tabs.Panel value="yellow" pt="md">
                        <CardsTable
                            rows={displayedCards.yellowCards}
                            color="yellow"
                            cardType="yellow"
                            matches={matchesForStage}
                            loading={loadingCards && selectedStage === "all"}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="red" pt="md">
                        <CardsTable
                            rows={displayedCards.redCards}
                            color="red"
                            cardType="red"
                            matches={matchesForStage}
                            loading={loadingCards && selectedStage === "all"}
                        />
                    </Tabs.Panel>
                </Tabs>
            </Box>
        </Modal>
    );
};

const OverviewCard = ({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: number }) => (
    <Paper withBorder radius="md" p="sm" bg="white">
        <Group gap={10} align="center">
            <ThemeIcon size={32} radius="md" variant="light" color={color}>{icon}</ThemeIcon>
            <Stack gap={0}>
                <Text size="xs" c="gray.6">{label}</Text>
                <Text fw={700} size="lg" lh={1}>{value}</Text>
            </Stack>
        </Group>
    </Paper>
);

const CardsTable = ({
    rows,
    color,
    cardType,
    matches,
    loading,
}: {
    rows: CardRow[];
    color: "yellow" | "red";
    cardType: "yellow" | "red";
    matches: any[];
    loading: boolean;
}) => (
    <Paper withBorder radius="md" p="md" bg="white">
        {loading && <LoadingRow text="جاري جلب البطاقات…" />}
        {!loading && rows.length === 0 && <EmptyRow text="لا توجد بطاقات" />}
        {!loading && rows.length > 0 && (
            <Table striped highlightOnHover withRowBorders={false} verticalSpacing={6} fz="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th style={{ width: 36 }}>#</Table.Th>
                        <Table.Th>اللاعب</Table.Th>
                        <Table.Th>الفريق</Table.Th>
                        <Table.Th ta="center">رقم</Table.Th>
                        <Table.Th ta="center">العدد</Table.Th>
                        <Table.Th>المباريات</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.map((r, i) => {
                        const incidents = collectIncidents(matches, r.player, r.team?.id, cardType);
                        return (
                            <Table.Tr key={`${r.team?.id}-${r.player}-${i}`}>
                                <Table.Td>{i + 1}</Table.Td>
                                <Table.Td>{r.player}</Table.Td>
                                <Table.Td>{r.team?.name}</Table.Td>
                                <Table.Td ta="center">{r.number || "—"}</Table.Td>
                                <Table.Td ta="center">
                                    <Badge size="sm" variant="light" color={color}>{r.count}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    {incidents.length === 0 ? (
                                        <Text size="xs" c="gray.5">—</Text>
                                    ) : (
                                        <Group gap={6} wrap="wrap">
                                            {incidents.map((inc, j) => {
                                                const parts: string[] = [`ضد ${inc.opponent}`];
                                                if (inc.minute) parts.push(`د.${inc.minute}`);
                                                const typeLabel = matchTypeLabel(inc.matchType);
                                                if (typeLabel) parts.push(typeLabel);
                                                return (
                                                    <Badge
                                                        key={j}
                                                        size="sm"
                                                        variant="outline"
                                                        color={color}
                                                        radius="sm"
                                                    >
                                                        {parts.join(" — ")}
                                                    </Badge>
                                                );
                                            })}
                                        </Group>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        )}
    </Paper>
);

const LoadingRow = ({ text }: { text: string }) => (
    <Center py={20}>
        <Text size="sm" c="gray.5">{text}</Text>
    </Center>
);

const EmptyRow = ({ text }: { text: string }) => (
    <Center py={20}>
        <Stack align="center" gap={4}>
            <Divider w={60} />
            <Text size="sm" c="gray.5">{text}</Text>
        </Stack>
    </Center>
);
