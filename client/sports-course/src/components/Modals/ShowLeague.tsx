import {
    ActionIcon,
    Avatar,
    Badge,
    Box,
    Center,
    Divider,
    Group,
    Menu,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    useMantineTheme,
} from "@mantine/core";
import {
    IconDotsVertical,
    IconUsers,
    IconUserCog,
    IconUsersGroup,
    IconTrash,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";
import { AllLeagues, useDeleteParticipatingTeams } from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

type Props = {
    setSelectedData: (id: string) => void;
    data?: any;

    setOpenShowParticipatingPlayersModal: (status: boolean) => void;
    setOpenShowParticipatingTechnicalStaffModal: (status: boolean) => void;
} & ModalProps;

// Color palette per group letter — keeps the look stable across renders.
const GROUP_COLORS = ["cyan", "grape", "teal", "orange", "indigo", "pink", "lime", "violet"];
const TEAM_COLORS = ["cyan", "teal", "grape", "indigo", "orange", "pink", "lime", "violet", "blue", "red"];

const colorFor = (key: string, palette: string[]) => {
    if (!key) return palette[0];
    let sum = 0;
    for (let i = 0; i < key.length; i++) sum = (sum + key.charCodeAt(i)) % 9973;
    return palette[sum % palette.length];
};

const initials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    const first = parts[0].charAt(0);
    return first || "?";
};

export const ShowLeague = ({
    data,
    setSelectedData,
    setOpenShowParticipatingPlayersModal,
    setOpenShowParticipatingTechnicalStaffModal,
    ...props
}: Props) => {
    const theme = useMantineTheme();
    const [groupedData, setGroupedData] = useState<any[][]>([]);
    const [deleteParticipatingTeam] = useDeleteParticipatingTeams();

    const handleDeleteTeam = (row: any) => {
        const notyf = typeof window !== "undefined" ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
        if (!row?.id) return;
        const teamName = row?.team?.name || "هذا الفريق";
        if (!window.confirm(`هل تريد حذف «${teamName}» من البطولة؟ سيُلغى انضمامه نهائياً.`)) return;
        deleteParticipatingTeam({
            variables: { id: row.id },
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: false,
            onCompleted: (res: any) => {
                if (res?.deleteParticipatingTeams?.status) {
                    // Optimistically drop the team from the on-screen groups.
                    setGroupedData((prev) =>
                        prev
                            .map((g) => g.filter((t: any) => t?.id !== row.id))
                            .filter((g) => g.length > 0)
                    );
                    notyf?.success("تم حذف الفريق من البطولة");
                } else {
                    notyf?.error("تعذّر حذف الفريق");
                }
            },
            onError: (err: any) => {
                notyf?.error(err?.message || "فشل حذف الفريق من البطولة");
            },
        });
    };

    useEffect(() => {
        if (data && props.opened) {
            const groups = new Map<string, any[]>();
            for (let i = 0; i < (data?.participatingTeams?.length || 0); i++) {
                const item = data.participatingTeams[i];
                const g = item?.group || "—";
                if (!groups.has(g)) groups.set(g, []);
                groups.get(g)!.push(item);
            }
            setGroupedData(
                Array.from(groups.values()).sort((a, b) =>
                    String(a[0]?.group || "").localeCompare(String(b[0]?.group || ""))
                )
            );
        }
    }, [data, props.opened]);

    const totalTeams = useMemo(
        () => groupedData.reduce((acc, g) => acc + g.length, 0),
        [groupedData]
    );

    const statusCounts = useMemo(() => {
        const all = data?.participatingTeams || [];
        return {
            accepted: all.filter((t: any) => t?.status === "accepted").length,
            waiting: all.filter((t: any) => !t?.status || t?.status === "waiting").length,
            rejected: all.filter((t: any) => t?.status === "rejected").length,
        };
    }, [data]);

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            size={"85%"}
            footer={<></>}
            styles={{ body: { backgroundColor: theme.colors.gray[1] } }}
        >
            <Box style={{ padding: 20 }}>
                {/* Header summary */}
                <Group justify="space-between" align="center" mb={16} wrap="wrap">
                    <Group gap={10} align="center">
                        <Avatar radius="md" size={36} color="cyan" variant="light">
                            <IconUsersGroup size={20} />
                        </Avatar>
                        <Stack gap={2}>
                            <Text fw={700} c={theme.colors.gray[8]}>توزيع الفرق على المجموعات</Text>
                            <Text size="xs" c={theme.colors.gray[5]}>{data?.name || ""}</Text>
                        </Stack>
                    </Group>

                    <Group gap={8}>
                        <Badge variant="light" color="grape" radius="sm">
                            {groupedData.length} مجموعات
                        </Badge>
                        <Badge variant="light" color="cyan" radius="sm">
                            {totalTeams} فرق
                        </Badge>
                        {statusCounts.accepted > 0 && (
                            <Badge variant="light" color="green" radius="sm">
                                مقبولة: {statusCounts.accepted}
                            </Badge>
                        )}
                        {statusCounts.waiting > 0 && (
                            <Badge variant="light" color="yellow" radius="sm">
                                بانتظار: {statusCounts.waiting}
                            </Badge>
                        )}
                        {statusCounts.rejected > 0 && (
                            <Badge variant="light" color="red" radius="sm">
                                مرفوضة: {statusCounts.rejected}
                            </Badge>
                        )}
                    </Group>
                </Group>

                {groupedData.length === 0 ? (
                    <Center py={50}>
                        <Stack align="center" gap={6}>
                            <IconUsersGroup size={48} color={theme.colors.gray[4]} />
                            <Text fw={600} c="gray.6">لا توجد مجموعات بعد</Text>
                            <Text size="sm" c="gray.5">أضف الفرق المشاركة من قائمة البطولة.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" verticalSpacing="md">
                        {groupedData.map((teams, gi) => {
                            const groupName = teams[0]?.group || "—";
                            const color = colorFor(groupName, GROUP_COLORS);
                            return (
                                <Paper
                                    key={`g-${gi}`}
                                    radius="lg"
                                    withBorder
                                    shadow="xs"
                                    style={{ overflow: "hidden", background: "white" }}
                                >
                                    {/* Group header strip */}
                                    <Box
                                        style={{
                                            background: `linear-gradient(135deg, var(--mantine-color-${color}-6) 0%, var(--mantine-color-${color}-4) 100%)`,
                                            padding: "12px 14px",
                                            color: "#fff",
                                        }}
                                    >
                                        <Group justify="space-between" align="center" wrap="nowrap">
                                            <Group gap={10} align="center">
                                                <Box
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 10,
                                                        background: "rgba(255,255,255,0.22)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 800,
                                                        fontSize: 16,
                                                        backdropFilter: "blur(6px)",
                                                    }}
                                                >
                                                    {groupName}
                                                </Box>
                                                <Stack gap={0}>
                                                    <Text fw={700} size="sm">{`المجموعة ${groupName}`}</Text>
                                                    <Text size="xs" opacity={0.9}>{teams.length} فرق</Text>
                                                </Stack>
                                            </Group>
                                        </Group>
                                    </Box>

                                    {/* Teams list */}
                                    <Stack gap={0}>
                                        {teams.map((row: any, ti: number) => {
                                            const teamName = row?.team?.name || "—";
                                            const clubName = row?.team?.club?.name || "";
                                            const teamColor = colorFor(teamName, TEAM_COLORS);
                                            const status = row?.status || "waiting";
                                            const isRejected = status === "rejected";
                                            const isWaiting = status === "waiting";
                                            return (
                                                <Box
                                                    key={row?.id || ti}
                                                    style={{
                                                        backgroundColor: isRejected ? "var(--mantine-color-red-0)" : undefined,
                                                    }}
                                                >
                                                    {ti > 0 && <Divider />}
                                                    <Group
                                                        wrap="nowrap"
                                                        justify="space-between"
                                                        align="center"
                                                        px={12}
                                                        py={10}
                                                        gap={8}
                                                        style={{
                                                            transition: "background-color .15s ease",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (isRejected) return;
                                                            (e.currentTarget as HTMLElement).style.backgroundColor =
                                                                theme.colors.gray[0];
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                                        }}
                                                    >
                                                        <Group gap={10} align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                                                            <Text
                                                                size="xs"
                                                                fw={700}
                                                                c={isRejected ? "red.7" : "gray.5"}
                                                                style={{ width: 18, textAlign: "center" }}
                                                            >
                                                                {ti + 1}
                                                            </Text>
                                                            <Avatar
                                                                size={34}
                                                                radius="md"
                                                                color={isRejected ? "red" : teamColor}
                                                                variant="light"
                                                            >
                                                                {initials(teamName)}
                                                            </Avatar>
                                                            <Stack gap={0} style={{ minWidth: 0 }}>
                                                                <Group gap={6} align="center" wrap="nowrap">
                                                                    <Text
                                                                        size="sm"
                                                                        fw={600}
                                                                        c={isRejected ? "red.8" : theme.colors.gray[8]}
                                                                        td={isRejected ? "line-through" : undefined}
                                                                        lineClamp={1}
                                                                        title={teamName}
                                                                    >
                                                                        {teamName}
                                                                    </Text>
                                                                    {isRejected && (
                                                                        <Badge size="xs" color="red" variant="filled" radius="sm">مرفوضة</Badge>
                                                                    )}
                                                                    {isWaiting && (
                                                                        <Badge size="xs" color="yellow" variant="light" radius="sm">بانتظار</Badge>
                                                                    )}
                                                                </Group>
                                                                {clubName && (
                                                                    <Text size="xs" c={isRejected ? "red.6" : "gray.5"} lineClamp={1}>
                                                                        {clubName}
                                                                    </Text>
                                                                )}
                                                            </Stack>
                                                        </Group>

                                                        <Menu shadow="md" width={220} position="bottom-end" withArrow>
                                                            <Menu.Target>
                                                                <ActionIcon variant="subtle" color="gray" radius="md">
                                                                    <IconDotsVertical size={16} />
                                                                </ActionIcon>
                                                            </Menu.Target>
                                                            <Menu.Dropdown>
                                                                <Menu.Item
                                                                    leftSection={<IconUsers size={14} />}
                                                                    onClick={() => {
                                                                        setSelectedData(row?.id);
                                                                        setOpenShowParticipatingPlayersModal(true);
                                                                    }}
                                                                >
                                                                    عرض اللاعبين
                                                                </Menu.Item>
                                                                <Menu.Item
                                                                    leftSection={<IconUserCog size={14} />}
                                                                    onClick={() => {
                                                                        setSelectedData(row?.id);
                                                                        setOpenShowParticipatingTechnicalStaffModal(true);
                                                                    }}
                                                                >
                                                                    عرض الجهاز الفني
                                                                </Menu.Item>
                                                                <Menu.Divider />
                                                                <Menu.Item
                                                                    color="red"
                                                                    leftSection={<IconTrash size={14} />}
                                                                    onClick={() => handleDeleteTeam(row)}
                                                                >
                                                                    حذف من البطولة
                                                                </Menu.Item>
                                                            </Menu.Dropdown>
                                                        </Menu>
                                                    </Group>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </SimpleGrid>
                )}
            </Box>
        </Modal>
    );
};
