import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Center,
    Grid,
    Group,
    Select,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import {
    IconAlertCircle,
    IconCards,
    IconCheck,
    IconDeviceFloppy,
    IconTrash,
    IconX,
} from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect, useMemo, useState } from "react";
import { AllLeagues, useDeleteMatchCard, useUpdateMatchCard } from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

const { Col } = Grid;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

type CardRow = {
    id: string;
    teamId: string;
    teamName: string;
    type: string;
    player: string;
    date: string;
};

const CARD_TYPES = [
    { value: "yellow", label: "صفراء" },
    { value: "red", label: "حمراء" },
];

export const ManageMatchCards = ({ data, ...props }: Props) => {
    const theme = useMantineTheme();
    const [rows, setRows] = useState<CardRow[]>([]);
    const [dirty, setDirty] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string>("");

    const [updateMatchCard, { loading: saving }] = useUpdateMatchCard();
    const [deleteMatchCard] = useDeleteMatchCard();

    const teams = useMemo(
        () => [
            { value: data?.firstTeam?.id, label: data?.firstTeam?.team?.name || "—" },
            { value: data?.secondTeam?.id, label: data?.secondTeam?.team?.name || "—" },
        ],
        [data?.firstTeam?.id, data?.secondTeam?.id, data?.firstTeam?.team?.name, data?.secondTeam?.team?.name]
    );

    useEffect(() => {
        if (!data || !props.opened) return;
        const collect: CardRow[] = [];
        const all = [
            ...(data?.firstTeamCards || []).map((c: any) => ({ ...c, _ownerTeamId: data?.firstTeam?.id, _ownerTeamName: data?.firstTeam?.team?.name })),
            ...(data?.secondTeamCards || []).map((c: any) => ({ ...c, _ownerTeamId: data?.secondTeam?.id, _ownerTeamName: data?.secondTeam?.team?.name })),
        ];
        for (const c of all) {
            if (!c?.id) continue;
            collect.push({
                id: c.id,
                teamId: c?.team?.id || c._ownerTeamId,
                teamName: c?.team?.team?.name || c._ownerTeamName || "—",
                type: c.type || "yellow",
                player: c.player || "",
                date: c.date || "",
            });
        }
        setRows(collect);
        setDirty({});
        setError("");
    }, [data, props.opened]);

    const update = (id: string, patch: Partial<CardRow>) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        setDirty((prev) => ({ ...prev, [id]: true }));
    };

    const removeCard = async (id: string) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        try {
            await deleteMatchCard({
                variables: { id },
                refetchQueries: [AllLeagues],
                awaitRefetchQueries: false,
            });
            setRows((prev) => prev.filter((r) => r.id !== id));
            setDirty((prev) => {
                const { [id]: _omit, ...rest } = prev;
                return rest;
            });
            notyf.success("تم حذف البطاقة");
        } catch (e: any) {
            notyf.error(e?.message || "تعذّر حذف البطاقة");
        }
    };

    const saveAll = async () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const dirtyRows = rows.filter((r) => dirty[r.id]);
        if (dirtyRows.length === 0) {
            notyf.success("لا تغييرات للحفظ");
            props.onClose();
            return;
        }

        const incomplete = dirtyRows.find(
            (r) => !r.teamId || !r.type || !r.player || !r.date
        );
        if (incomplete) {
            setError("بعض البطاقات تنقصها بيانات (الفريق / النوع / اللاعب / التوقيت).");
            return;
        }
        setError("");

        try {
            // Run updates in parallel; the LAST call carries the dashboard
            // refetch so we only refresh AllLeagues once.
            await Promise.all(
                dirtyRows.map((r, i) =>
                    updateMatchCard({
                        variables: {
                            id: r.id,
                            content: {
                                type: r.type as any,
                                player: r.player as any,
                                date: r.date as any,
                                id_team: r.teamId,
                                id_match: data?.id,
                            } as any,
                        },
                        ...(i === dirtyRows.length - 1
                            ? { refetchQueries: [AllLeagues], awaitRefetchQueries: false }
                            : {}),
                    })
                )
            );
            setDirty({});
            notyf.success("تم حفظ البطاقات");
            props.onClose();
        } catch (e: any) {
            notyf.error(e?.message || "فشل حفظ البطاقات");
        }
    };

    return (
        <Modal
            {...props}
            onClose={props.onClose}
            size={"75%"}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={props.onClose}>
                            إغلاق
                        </Button>
                        <Button
                            rightSection={<IconCheck size={15} />}
                            leftSection={<IconDeviceFloppy size={15} />}
                            onClick={saveAll}
                            loading={saving}
                            disabled={Object.keys(dirty).length === 0}
                        >
                            حفظ التغييرات
                        </Button>
                    </Group>
                </Box>
            }
            styles={{ body: { backgroundColor: theme.colors.gray[1] } }}
        >
            <Box style={{ padding: 20 }}>
                <Group gap={10} align="center" mb={14}>
                    <ThemeIcon size={36} radius="md" variant="light" color="yellow">
                        <IconCards size={20} />
                    </ThemeIcon>
                    <Stack gap={2}>
                        <Text fw={700} c={theme.colors.gray[8]}>إدارة بطاقات المباراة</Text>
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

                {rows.length === 0 ? (
                    <Center py={40}>
                        <Stack align="center" gap={6}>
                            <IconCards size={40} color={theme.colors.gray[4]} />
                            <Text fw={600} c="gray.6">لا توجد بطاقات في هذه المباراة</Text>
                            <Text size="sm" c="gray.5">يمكنك إضافة بطاقة من قائمة المباراة.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Stack gap={10}>
                        {rows.map((r) => (
                            <Box
                                key={r.id}
                                bg={theme.white}
                                p={12}
                                style={{
                                    borderRadius: 10,
                                    border: dirty[r.id] ? `1px solid ${theme.colors.yellow[5]}` : "1px solid transparent",
                                    transition: "border-color .15s ease",
                                }}
                            >
                                <Grid gutter={12} align="flex-end">
                                    <Col span={3}>
                                        <Select
                                            label="الفريق"
                                            data={teams}
                                            value={r.teamId}
                                            onChange={(v) => v && update(r.id, { teamId: v })}
                                            withAsterisk
                                        />
                                    </Col>
                                    <Col span={2}>
                                        <Select
                                            label="النوع"
                                            data={CARD_TYPES}
                                            value={r.type}
                                            onChange={(v) => v && update(r.id, { type: v })}
                                            withAsterisk
                                        />
                                    </Col>
                                    <Col span={3}>
                                        <TextInput
                                            label="اللاعب"
                                            value={r.player}
                                            onChange={(e) => update(r.id, { player: e.currentTarget.value })}
                                            withAsterisk
                                        />
                                    </Col>
                                    <Col span={3}>
                                        <TextInput
                                            label="التوقيت"
                                            value={r.date}
                                            onChange={(e) => update(r.id, { date: e.currentTarget.value })}
                                            withAsterisk
                                        />
                                    </Col>
                                    <Col span={1}>
                                        <Group justify="flex-end">
                                            <Tooltip label="حذف البطاقة">
                                                <ActionIcon
                                                    variant="light"
                                                    color="red"
                                                    size="lg"
                                                    onClick={() => removeCard(r.id)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Col>
                                </Grid>
                                <Group justify="flex-start" mt={6} gap={6}>
                                    <Badge
                                        variant="filled"
                                        color={r.type === "red" ? "red" : "yellow"}
                                        size="sm"
                                        radius="sm"
                                    >
                                        {r.type === "red" ? "حمراء" : "صفراء"}
                                    </Badge>
                                    {dirty[r.id] && (
                                        <Badge variant="light" color="yellow" size="xs" radius="sm">
                                            تغيير غير محفوظ
                                        </Badge>
                                    )}
                                </Group>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>
        </Modal>
    );
};
