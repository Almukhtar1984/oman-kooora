import { useApolloClient } from "@apollo/client";
import {
    Alert,
    Badge,
    Box,
    Button,
    Center,
    Grid,
    Group,
    Paper,
    SegmentedControl,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    useMantineTheme,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconFriends, IconShirtSport, IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect, useMemo, useState } from "react";
import {
    AllLeagues,
    useAllParticipatingPlayers,
    useCreateParticipatingPlayersMatch,
    useDeleteParticipatingPlayersMatch,
    useMatchLineup,
    useUpdateParticipatingPlayerMatchSub,
    useUpdateParticipatingPlayersMatch,
} from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

const { Col } = Grid;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

type LineupState = "none" | "starter" | "sub";

type Player = {
    id: string; // participating_player id
    name: string;
    number?: string;
    initial: string;
    state: LineupState;
    matchEntryId?: string; // ParticipatingPlayersMatch.id if already on lineup
};

const STATE_OPTIONS = [
    { value: "none",    label: "غير مشارك" },
    { value: "starter", label: "أساسي" },
    { value: "sub",     label: "بديل" },
];

const MAX_STARTERS = 11;
const MAX_SUBS = 6;

const initialOf = (name?: string) => (name?.trim()?.charAt(0) || "?");

const buildPlayer = (pp: any, lineupRow: any): Player => {
    const p = pp?.player?.person;
    const name = [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ") || "—";
    const state: LineupState = lineupRow?.starter ? "starter" : lineupRow?.sub ? "sub" : "none";
    return {
        id: pp?.id,
        name,
        number: pp?.number,
        initial: initialOf(name),
        state,
        matchEntryId: lineupRow?.id,
    };
};

export const ManageMatchLineup = ({ data, ...props }: Props) => {
    const theme = useMantineTheme();
    const [firstTeam, setFirstTeam] = useState<Player[]>([]);
    const [secondTeam, setSecondTeam] = useState<Player[]>([]);
    const [originalFirst, setOriginalFirst] = useState<Record<string, LineupState>>({});
    const [originalSecond, setOriginalSecond] = useState<Record<string, LineupState>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [getLineup] = useMatchLineup();
    const [getFirstPlayers]  = useAllParticipatingPlayers();
    const [getSecondPlayers] = useAllParticipatingPlayers();

    const apolloClient = useApolloClient();
    const [createPPM] = useCreateParticipatingPlayersMatch();
    const [updatePPM] = useUpdateParticipatingPlayersMatch();
    const [updateSub] = useUpdateParticipatingPlayerMatchSub();
    const [deletePPM] = useDeleteParticipatingPlayersMatch();

    useEffect(() => {
        if (!data?.id || !props.opened) return;
        setLoading(true);
        setError("");

        const matchId = data.id;
        const firstTeamId = data?.firstTeam?.id;
        const secondTeamId = data?.secondTeam?.id;

        // Kick off all three queries in parallel; merge when both team players
        // and the lineup are back.
        let lineupData: any = null;
        let firstPlayers: any[] = [];
        let secondPlayers: any[] = [];
        let pending = 3;

        const tryMerge = () => {
            pending -= 1;
            if (pending > 0) return;
            const lineupFirst  = lineupData?.getMatch?.firstTeamParticipatingPlayersMatch || [];
            const lineupSecond = lineupData?.getMatch?.secondTeamParticipatingPlayersMatch || [];

            const lineupByPlayer = new Map<string, any>();
            for (const row of [...lineupFirst, ...lineupSecond]) {
                const playerId = row?.id_participating_player?.id || row?.id_participating_player;
                if (playerId) lineupByPlayer.set(playerId, row);
            }

            const buildList = (players: any[]) =>
                players.map((pp: any) => buildPlayer(pp, lineupByPlayer.get(pp?.id)));

            const first = buildList(firstPlayers);
            const second = buildList(secondPlayers);
            setFirstTeam(first);
            setSecondTeam(second);
            setOriginalFirst(Object.fromEntries(first.map((p) => [p.id, p.state])));
            setOriginalSecond(Object.fromEntries(second.map((p) => [p.id, p.state])));
            setLoading(false);
        };

        getLineup({
            variables: { matchId },
            fetchPolicy: "network-only",
            onCompleted: (d) => { lineupData = d; tryMerge(); },
            onError: () => { lineupData = { getMatch: {} }; tryMerge(); },
        });
        getFirstPlayers({
            variables: { idParticipatingTeams: firstTeamId },
            fetchPolicy: "network-only",
            onCompleted: ({ allParticipatingPlayers }) => { firstPlayers = allParticipatingPlayers || []; tryMerge(); },
            onError: () => { firstPlayers = []; tryMerge(); },
        });
        getSecondPlayers({
            variables: { idParticipatingTeams: secondTeamId },
            fetchPolicy: "network-only",
            onCompleted: ({ allParticipatingPlayers }) => { secondPlayers = allParticipatingPlayers || []; tryMerge(); },
            onError: () => { secondPlayers = []; tryMerge(); },
        });
    }, [data, props.opened, getLineup, getFirstPlayers, getSecondPlayers]);

    const counts = (list: Player[]) => ({
        starters: list.filter((p) => p.state === "starter").length,
        subs: list.filter((p) => p.state === "sub").length,
    });

    const firstCounts = useMemo(() => counts(firstTeam), [firstTeam]);
    const secondCounts = useMemo(() => counts(secondTeam), [secondTeam]);

    const toggle = (team: "first" | "second", playerId: string, value: string) => {
        const setter = team === "first" ? setFirstTeam : setSecondTeam;
        setter((prev) => prev.map((p) => (p.id === playerId ? { ...p, state: value as LineupState } : p)));
    };

    const onSave = async () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        if (
            firstCounts.starters > MAX_STARTERS ||
            secondCounts.starters > MAX_STARTERS ||
            firstCounts.subs > MAX_SUBS ||
            secondCounts.subs > MAX_SUBS
        ) {
            setError(`الحد الأقصى: ${MAX_STARTERS} أساسي و ${MAX_SUBS} بديل لكل فريق.`);
            return;
        }
        setError("");
        setSaving(true);

        try {
            const all = [...firstTeam, ...secondTeam];
            const original = { ...originalFirst, ...originalSecond };

            const toCreate: { id_match: string; id_participating_player: string; starter: boolean }[] = [];
            const toUpdateStarter: { id: string; id_match: string; id_participating_player: string; starter: boolean }[] = [];
            const toUpdateSub: { id: string; sub: boolean }[] = [];
            const toDelete: string[] = [];

            for (const p of all) {
                const was = original[p.id] ?? "none";
                if (p.state === was) continue;

                if (was === "none" && p.state !== "none") {
                    toCreate.push({
                        id_match: data.id,
                        id_participating_player: p.id,
                        starter: p.state === "starter",
                    });
                    if (p.state === "sub") {
                        // Sub flag needs a follow-up call once we have the id —
                        // handled below after create returns.
                    }
                } else if (p.state === "none" && was !== "none" && p.matchEntryId) {
                    toDelete.push(p.matchEntryId);
                } else if (p.matchEntryId) {
                    // Was starter ↔ sub: update both flags.
                    toUpdateStarter.push({
                        id: p.matchEntryId,
                        id_match: data.id,
                        id_participating_player: p.id,
                        starter: p.state === "starter",
                    });
                    toUpdateSub.push({ id: p.matchEntryId, sub: p.state === "sub" });
                }
            }

            // 1) Creates first so we can wire up sub flags for new "sub" rows.
            let createdRows: { id: string; starter: boolean }[] = [];
            if (toCreate.length > 0) {
                const r = await createPPM({ variables: { content: toCreate } });
                createdRows = (r.data?.createParticipatingPlayersMatch || []).map((row: any) => ({
                    id: row.id,
                    starter: row.starter,
                }));
            }
            // For created rows that should be "sub", flip the sub flag.
            const subFromCreate: { id: string; sub: boolean }[] = [];
            toCreate.forEach((c, i) => {
                if (!c.starter && createdRows[i]?.id) {
                    subFromCreate.push({ id: createdRows[i].id, sub: true });
                }
            });

            // 2) Update starter flags + sub flags + deletes in parallel.
            await Promise.all([
                toUpdateStarter.length > 0 ? updatePPM({ variables: { content: toUpdateStarter } }) : Promise.resolve(),
                ...toUpdateSub.map((s) => updateSub({ variables: s })),
                ...subFromCreate.map((s) => updateSub({ variables: s })),
                ...toDelete.map((id) => deletePPM({ variables: { id } })),
            ]);

            notyf.success("تم حفظ التشكيلة");
            // Refresh dashboard in the background; modal closes immediately.
            apolloClient.refetchQueries({ include: [AllLeagues] }).catch(() => {});
            props.onClose();
        } catch (e: any) {
            notyf.error(e?.message || "فشل حفظ التشكيلة");
        } finally {
            setSaving(false);
        }
    };

    const renderTeamColumn = (
        teamLabel: string,
        list: Player[],
        counters: { starters: number; subs: number },
        team: "first" | "second"
    ) => {
        const color = team === "first" ? "cyan" : "grape";
        return (
            <Paper withBorder radius="md" p="md" bg="white">
                <Group justify="space-between" align="center" mb={10}>
                    <Group gap={8}>
                        <ThemeIcon variant="light" color={color} size={32} radius="md">
                            <IconShirtSport size={18} />
                        </ThemeIcon>
                        <Text fw={700}>{teamLabel}</Text>
                    </Group>
                    <Group gap={6}>
                        <Badge
                            color={counters.starters > MAX_STARTERS ? "red" : "green"}
                            variant="light"
                            radius="sm"
                        >
                            أساسي {counters.starters}/{MAX_STARTERS}
                        </Badge>
                        <Badge
                            color={counters.subs > MAX_SUBS ? "red" : "blue"}
                            variant="light"
                            radius="sm"
                        >
                            بديل {counters.subs}/{MAX_SUBS}
                        </Badge>
                    </Group>
                </Group>

                {loading ? (
                    <Stack gap={6}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} height={42} radius="md" />
                        ))}
                    </Stack>
                ) : list.length === 0 ? (
                    <Center py={20}>
                        <Text size="sm" c="gray.5">لا يوجد لاعبون مسجّلون في هذا الفريق.</Text>
                    </Center>
                ) : (
                    <Stack gap={6}>
                        {list.map((p) => (
                            <Group
                                key={p.id}
                                wrap="nowrap"
                                justify="space-between"
                                align="center"
                                p={8}
                                style={{
                                    border: `1px solid ${theme.colors.gray[2]}`,
                                    borderRadius: 8,
                                    background:
                                        p.state === "starter"
                                            ? theme.colors.green[0]
                                            : p.state === "sub"
                                            ? theme.colors.blue[0]
                                            : "white",
                                    transition: "background-color .15s ease",
                                }}
                            >
                                <Group gap={8} align="center" style={{ minWidth: 0 }}>
                                    <Box
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 999,
                                            background: theme.colors.gray[1],
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 700,
                                            color: theme.colors.gray[7],
                                            fontSize: 12,
                                        }}
                                    >
                                        {p.number || p.initial}
                                    </Box>
                                    <Text size="sm" lineClamp={1} c={theme.colors.gray[8]} title={p.name}>
                                        {p.name}
                                    </Text>
                                </Group>
                                <SegmentedControl
                                    size="xs"
                                    color={p.state === "starter" ? "green" : p.state === "sub" ? "blue" : "gray"}
                                    value={p.state}
                                    onChange={(v) => toggle(team, p.id, v)}
                                    data={STATE_OPTIONS}
                                />
                            </Group>
                        ))}
                    </Stack>
                )}
            </Paper>
        );
    };

    return (
        <Modal
            {...props}
            onClose={props.onClose}
            size={"90%"}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={props.onClose}>
                            إلغاء
                        </Button>
                        <Button rightSection={<IconCheck size={15} />} onClick={onSave} loading={saving}>
                            حفظ التشكيلة
                        </Button>
                    </Group>
                </Box>
            }
            styles={{ body: { backgroundColor: theme.colors.gray[1] } }}
        >
            <Box style={{ padding: 20 }}>
                <Group gap={10} align="center" mb={14}>
                    <ThemeIcon size={36} radius="md" variant="light" color="cyan">
                        <IconFriends size={20} />
                    </ThemeIcon>
                    <Stack gap={2}>
                        <Text fw={700} c={theme.colors.gray[8]}>تشكيلة المباراة</Text>
                        <Text size="xs" c={theme.colors.gray[5]}>
                            {`${data?.firstTeam?.team?.name || ""} ضد ${data?.secondTeam?.team?.name || ""}`}
                        </Text>
                    </Stack>
                </Group>

                {error && (
                    <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />} mb={12}>
                        {error}
                    </Alert>
                )}

                <Grid gutter={16}>
                    <Col span={{ base: 12, md: 6 }}>
                        {renderTeamColumn(data?.firstTeam?.team?.name || "الفريق الأول", firstTeam, firstCounts, "first")}
                    </Col>
                    <Col span={{ base: 12, md: 6 }}>
                        {renderTeamColumn(data?.secondTeam?.team?.name || "الفريق الثاني", secondTeam, secondCounts, "second")}
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};
