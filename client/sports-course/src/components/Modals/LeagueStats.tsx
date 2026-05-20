import {
    Badge,
    Box,
    Button,
    Center,
    Divider,
    Grid,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    ThemeIcon,
    useMantineTheme,
} from "@mantine/core";
import {
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

    const [getRanking, { loading: loadingRanking }] = useGetRanking();
    const [getTopGoal, { loading: loadingGoals }] = useTopGoal();
    const [getCards, { loading: loadingCards }] = useCardsByLeague();

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
            onCompleted: ({ calculateGoalPlayer }) => setScorers([...(calculateGoalPlayer || [])]),
        });
        getCards({
            variables: { leagueId },
            fetchPolicy: "network-only",
            onCompleted: ({ getCardsByLeague }) => {
                setYellowCards([...(getCardsByLeague?.yellowCards || [])].sort((a, b) => b.count - a.count));
                setRedCards([...(getCardsByLeague?.redCards || [])].sort((a, b) => b.count - a.count));
            },
        });
    }, [data, props.opened, getRanking, getTopGoal, getCards]);

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

                <Tabs defaultValue="standings" color="cyan" keepMounted={false}>
                    <Tabs.List>
                        <Tabs.Tab value="standings" leftSection={<IconTrophy size={14} />}>الترتيب</Tabs.Tab>
                        <Tabs.Tab value="scorers"   leftSection={<IconTarget size={14} />}>الهدافون</Tabs.Tab>
                        <Tabs.Tab value="yellow"    leftSection={<IconCards size={14} />}>البطاقات الصفراء</Tabs.Tab>
                        <Tabs.Tab value="red"       leftSection={<IconCards size={14} />}>البطاقات الحمراء</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="standings" pt="md">
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
                            {loadingGoals && <LoadingRow text="جاري جلب الهدافين…" />}
                            {!loadingGoals && scorers.length === 0 && <EmptyRow text="لا يوجد هدافون بعد" />}
                            {!loadingGoals && scorers.length > 0 && (
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
                                        {scorers.map((s, i) => {
                                            const p = s.PlayerID?.player?.person;
                                            const name = [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ");
                                            return (
                                                <Table.Tr key={`${s.PlayerID?.id}-${i}`}>
                                                    <Table.Td>{i + 1}</Table.Td>
                                                    <Table.Td>{name || "—"}</Table.Td>
                                                    <Table.Td>{s.team}</Table.Td>
                                                    <Table.Td ta="center">
                                                        <Badge size="sm" variant="light" color="green">{s.Goal}</Badge>
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
                        <CardsTable rows={yellowCards} color="yellow" loading={loadingCards} />
                    </Tabs.Panel>

                    <Tabs.Panel value="red" pt="md">
                        <CardsTable rows={redCards} color="red" loading={loadingCards} />
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

const CardsTable = ({ rows, color, loading }: { rows: CardRow[]; color: "yellow" | "red"; loading: boolean }) => (
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
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.map((r, i) => (
                        <Table.Tr key={`${r.team?.id}-${r.player}-${i}`}>
                            <Table.Td>{i + 1}</Table.Td>
                            <Table.Td>{r.player}</Table.Td>
                            <Table.Td>{r.team?.name}</Table.Td>
                            <Table.Td ta="center">{r.number || "—"}</Table.Td>
                            <Table.Td ta="center">
                                <Badge size="sm" variant="light" color={color}>{r.count}</Badge>
                            </Table.Td>
                        </Table.Tr>
                    ))}
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
