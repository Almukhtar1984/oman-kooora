import {
    ActionIcon,
    Badge,
    Box,
    Divider,
    Flex,
    Group,
    Menu,
    Paper,
    Stack,
    Text,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import {
    IconCalendar,
    IconDotsVertical,
    IconEdit,
    IconHome,
    IconInfoCircle,
    IconPlus,
    IconTrash,
    IconTrophy,
    IconUsers,
    IconUsersGroup,
    IconWorld,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { GiSoccerBall } from "react-icons/gi";

type Props = {
    data: any;

    onShowMatches: (row: any) => void;
    onShowGroups: (row: any) => void;
    onAddMatch: (row: any) => void;
    onAddParticipating: (row: any) => void;
    onEditParticipating: (row: any) => void;
    onAddParticipatingPlayers: (row: any) => void;
    onAddParticipatingTechnicalStaff: (row: any) => void;
    onEdit: (row: any) => void;
    onDelete: (row: any) => void;
};

const formatDate = (d?: string | null) => {
    if (!d) return "—";
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY") : d;
};

const getStatus = (data: any) => {
    const start = data?.inscriptionStartDate ? dayjs(data.inscriptionStartDate) : null;
    const end = data?.inscriptionExpiryDate ? dayjs(data.inscriptionExpiryDate) : null;
    const now = dayjs();

    if (start && end && start.isValid() && end.isValid()) {
        if (now.isBefore(start)) {
            return { label: "لم يبدأ", color: "yellow" };
        }
        if (now.isAfter(end)) {
            return { label: "متوقف", color: "red" };
        }
        return { label: "مفتوح", color: "green" };
    }
    return { label: "متوقف", color: "red" };
};

const StatBox = ({
    value,
    label,
    color,
    icon,
}: {
    value: number | string;
    label: string;
    color: string;
    icon: React.ReactNode;
}) => (
    <Box
        style={{
            flex: 1,
            background: `var(--mantine-color-${color}-0)`,
            borderRadius: 10,
            padding: "10px 6px",
            textAlign: "center",
            border: `1px solid var(--mantine-color-${color}-1)`,
        }}
    >
        <Flex justify="center" align="center" gap={6} mb={2} c={`${color}.7`}>
            {icon}
            <Text fw={700} size="lg" lh={1}>
                {value ?? 0}
            </Text>
        </Flex>
        <Text size="xs" c="gray.6">
            {label}
        </Text>
    </Box>
);

export const LeagueCard = ({
    data,
    onShowMatches,
    onShowGroups,
    onAddMatch,
    onAddParticipating,
    onEditParticipating,
    onAddParticipatingPlayers,
    onAddParticipatingTechnicalStaff,
    onEdit,
    onDelete,
}: Props) => {
    const theme = useMantineTheme();
    const status = getStatus(data);
    const hasTeams = !!(data?.participatingTeams && data.participatingTeams.length > 0);
    const hasMatches = !!(data?.matchs && data.matchs.length > 0);

    return (
        <Paper
            radius="lg"
            shadow="xs"
            withBorder
            style={{
                overflow: "hidden",
                transition: "transform .15s ease, box-shadow .15s ease",
                background: "white",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = theme.shadows.md;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = theme.shadows.xs;
            }}
        >
            {/* Header: cyan gradient strip with title + status */}
            <Box
                style={{
                    background:
                        "linear-gradient(135deg, var(--mantine-color-cyan-6) 0%, var(--mantine-color-cyan-4) 100%)",
                    padding: "14px 16px",
                    color: "white",
                }}
            >
                <Flex justify="space-between" align="flex-start" gap={8}>
                    <Flex align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
                        <Box
                            style={{
                                background: "rgba(255,255,255,0.18)",
                                borderRadius: 10,
                                padding: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <IconTrophy size={20} />
                        </Box>
                        <Box style={{ minWidth: 0 }}>
                            <Text
                                fw={700}
                                size="md"
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                                title={data?.name}
                            >
                                {data?.name || "—"}
                            </Text>
                            <Text
                                size="xs"
                                opacity={0.9}
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                                title={data?.description}
                            >
                                {data?.description || ""}
                            </Text>
                        </Box>
                    </Flex>

                    <Badge
                        color={status.color}
                        variant="filled"
                        radius="sm"
                        style={{ flexShrink: 0 }}
                    >
                        {status.label}
                    </Badge>
                </Flex>
            </Box>

            {/* Body: stat boxes (only render boxes for values that are set) */}
            <Stack gap="sm" p="md" style={{ flex: 1 }}>
                {(data?.numberTeams > 0 || data?.numberGroups > 0) && (
                    <Flex gap={8}>
                        {data?.numberTeams > 0 && (
                            <StatBox
                                value={data.numberTeams}
                                label="الفرق"
                                color="cyan"
                                icon={<IconUsersGroup size={16} />}
                            />
                        )}
                        {data?.numberGroups > 0 && (
                            <StatBox
                                value={data.numberGroups}
                                label="المجموعات"
                                color="grape"
                                icon={<IconUsers size={16} />}
                            />
                        )}
                    </Flex>
                )}

                {(data?.internalplayer > 0 || data?.externalplayer > 0) && (
                    <Flex gap={8}>
                        {data?.internalplayer > 0 && (
                            <StatBox
                                value={data.internalplayer}
                                label="محترفين داخليين"
                                color="teal"
                                icon={<IconHome size={16} />}
                            />
                        )}
                        {data?.externalplayer > 0 && (
                            <StatBox
                                value={data.externalplayer}
                                label="محترفين خارجيين"
                                color="orange"
                                icon={<IconWorld size={16} />}
                            />
                        )}
                    </Flex>
                )}

                {/* Dates */}
                <Flex
                    align="center"
                    gap={8}
                    style={{
                        background: "var(--mantine-color-gray-0)",
                        padding: "8px 10px",
                        borderRadius: 8,
                    }}
                >
                    <IconCalendar size={16} color={theme.colors.gray[6]} />
                    <Text size="xs" c="gray.7" style={{ flex: 1 }}>
                        {formatDate(data?.startDate)}
                        <Text component="span" c="gray.5" mx={6}>
                            ←
                        </Text>
                        {formatDate(data?.expiryDate)}
                    </Text>
                </Flex>

                {/* Quick stats row */}
                <Group gap={6} wrap="wrap">
                    {hasTeams && (
                        <Badge
                            variant="light"
                            color="cyan"
                            size="sm"
                            leftSection={<IconUsersGroup size={12} />}
                        >
                            فرق مشاركة: {data.participatingTeams.length}
                        </Badge>
                    )}
                    {hasMatches && (
                        <Badge
                            variant="light"
                            color="green"
                            size="sm"
                            leftSection={<GiSoccerBall size={12} />}
                        >
                            مباريات: {data.matchs.length}
                        </Badge>
                    )}
                </Group>
            </Stack>

            <Divider />

            {/* Footer: actions */}
            <Flex p="xs" gap={4} align="center" justify="space-between">
                <Group gap={4}>
                    {hasMatches && (
                        <Tooltip label="عرض المباريات" withArrow>
                            <ActionIcon
                                variant="light"
                                color="cyan"
                                size="lg"
                                radius="md"
                                onClick={() => onShowMatches(data)}
                            >
                                <GiSoccerBall size={"1.15rem"} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {hasTeams && (
                        <Tooltip label="عرض المجموعات" withArrow>
                            <ActionIcon
                                variant="light"
                                color="grape"
                                size="lg"
                                radius="md"
                                onClick={() => onShowGroups(data)}
                            >
                                <IconInfoCircle size={"1.15rem"} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {!hasTeams && (
                        <Tooltip label="إضافة فرق" withArrow>
                            <ActionIcon
                                variant="light"
                                color="cyan"
                                size="lg"
                                radius="md"
                                onClick={() => onAddParticipating(data)}
                            >
                                <IconPlus size={"1.15rem"} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>

                <Menu shadow="md" width={210} position="bottom-end" withArrow>
                    <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="lg" radius="md">
                            <IconDotsVertical size="1.15rem" />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {hasTeams && (
                            <Menu.Item
                                leftSection={<IconInfoCircle size={14} />}
                                onClick={() => onShowGroups(data)}
                            >
                                عرض المجموعات
                            </Menu.Item>
                        )}
                        {hasMatches && (
                            <Menu.Item
                                leftSection={<IconInfoCircle size={14} />}
                                onClick={() => onShowMatches(data)}
                            >
                                عرض المباريات
                            </Menu.Item>
                        )}

                        {(hasTeams || hasMatches) && <Menu.Divider />}

                        {hasTeams && (
                            <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => onAddMatch(data)}
                            >
                                إضافة مباراة
                            </Menu.Item>
                        )}

                        {hasTeams ? (
                            <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => onEditParticipating(data)}
                            >
                                تعديل الفرق
                            </Menu.Item>
                        ) : (
                            <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => onAddParticipating(data)}
                            >
                                إضافة فرق
                            </Menu.Item>
                        )}

                        {hasTeams && (
                            <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => onAddParticipatingPlayers(data)}
                            >
                                إضافة لاعبين
                            </Menu.Item>
                        )}

                        {hasTeams && (
                            <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => onAddParticipatingTechnicalStaff(data)}
                            >
                                إضافة جهاز فني
                            </Menu.Item>
                        )}

                        <Menu.Divider />

                        <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => onEdit(data)}
                        >
                            تعديل
                        </Menu.Item>

                        <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => onDelete(data)}
                        >
                            حذف
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Flex>
        </Paper>
    );
};
