import { useTheme } from "@emotion/react";
import {
    ActionIcon,
    Avatar,
    Badge,
    Box,
    BoxProps,
    Button,
    Divider,
    Flex,
    Group,
    MantineTheme,
    Menu,
    Stack,
    Text,
    Tooltip,
} from "@mantine/core";
import {
    DotsVertical,
    Edit,
    Eye,
    Key,
    Lock,
    LockOpen,
    Mail,
    Plus,
    Trash,
    User,
} from "tabler-icons-react";
import React, { useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { getImageUrl } from "../../lib/helpers/image";

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    onChangeStatusModal: (callback?: () => any) => void;
    onChangeStatusAddPlayerModal: (callback?: () => any) => void;
    setOpenAddAdminModal: (callback?: () => any) => void;
    setOpenEditAdminModal: (callback?: () => any) => void;
    setOpenAddListPlayersModal: (callback?: () => any) => void;
    setOpenResetPasswordModal: (callback?: () => any) => void;
    hasPermission: (permission: string) => boolean;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CATEGORIES = ["الدرجة الاولى", "الدرجة الثاني", "الدرجة الثالثة"];

const CardTeam = ({
    data,
    onEditModal,
    onDeleteModal,
    onChangeStatusModal,
    onChangeStatusAddPlayerModal,
    setOpenAddAdminModal,
    setOpenEditAdminModal,
    setOpenAddListPlayersModal,
    setOpenResetPasswordModal,
    hasPermission,
    ...props
}: Props) => {
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const theme = useTheme() as MantineTheme;
    const router = useRouter();

    const admin = data?.admin;
    const adminName = admin
        ? [
              admin?.person?.first_name,
              admin?.person?.second_name,
              admin?.person?.third_name,
              admin?.person?.tribe,
          ]
              .filter(Boolean)
              .join(" ")
        : null;
    const categoryLabel = CATEGORIES[(data?.category ?? 1) - 1] || "—";

    return (
        <Box
            {...props}
            bg="white"
            sx={({ colors }) => ({
                borderRadius: 8,
                border: `1px solid ${colors.gray[3]}`,
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "box-shadow 150ms ease, border-color 150ms ease",
                "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    borderColor: colors.gray[4],
                },
            })}
        >
            {/* ── Header: logo + name + menu ───────────────────────── */}
            <Flex p="md" justify="space-between" align="flex-start" gap="sm">
                <Flex gap="sm" align="center" sx={{ minWidth: 0, flex: 1 }}>
                    <Avatar
                        src={getImageUrl(data?.logo as string)}
                        alt={data?.name || ""}
                        size={48}
                        radius="md"
                        sx={({ colors }) => ({
                            border: `1px solid ${colors.gray[2]}`,
                            flexShrink: 0,
                        })}
                    />
                    <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
                        <Tooltip label={data?.name} withArrow disabled={!data?.name}>
                            <Text size="sm" fw={600} color="gray.8" truncate>
                                {data?.name || "—"}
                            </Text>
                        </Tooltip>
                        <Group spacing={6}>
                            <Badge size="xs" variant="light" color="blue" radius="sm">
                                {categoryLabel}
                            </Badge>
                            {data?.activities ? (
                                <Badge size="xs" variant="outline" color="gray" radius="sm">
                                    {data.activities}
                                </Badge>
                            ) : null}
                        </Group>
                    </Stack>
                </Flex>

                <Menu
                    withArrow
                    shadow="md"
                    opened={menuOpen}
                    onOpen={() => setMenuOpen(true)}
                    onClose={() => setMenuOpen(false)}
                    closeOnClickOutside
                    position="bottom-end"
                >
                    <Menu.Target>
                        <ActionIcon variant="subtle">
                            <DotsVertical size={16} color={theme.colors.gray[6]} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {hasPermission("3") ? (
                            <Menu.Item
                                icon={<Edit size={14} />}
                                color="gray.6"
                                onClick={() => onEditModal(() => data)}
                            >
                                تعديل الفريق
                            </Menu.Item>
                        ) : null}
                        {hasPermission("5") ? (
                            <Menu.Item
                                icon={data?.account_status ? <Lock size={14} /> : <LockOpen size={14} />}
                                color="gray.6"
                                onClick={() => onChangeStatusModal(() => data)}
                            >
                                {data?.account_status ? "توقيف الفريق" : "تفعيل الفريق"}
                            </Menu.Item>
                        ) : null}

                        <Menu.Divider />

                        {admin ? (
                            <>
                                {hasPermission("7") ? (
                                    <Menu.Item
                                        icon={<Edit size={14} />}
                                        color="gray.6"
                                        onClick={() => setOpenEditAdminModal(() => admin)}
                                    >
                                        تعديل بيانات المدير
                                    </Menu.Item>
                                ) : null}
                                {hasPermission("7") ? (
                                    <Menu.Item
                                        icon={<Key size={14} />}
                                        color="gray.6"
                                        onClick={() => setOpenResetPasswordModal(() => data)}
                                    >
                                        إعادة تعيين كلمة المرور
                                    </Menu.Item>
                                ) : null}
                            </>
                        ) : hasPermission("6") ? (
                            <Menu.Item
                                icon={<Plus size={14} />}
                                color="gray.6"
                                onClick={() => setOpenAddAdminModal(() => data)}
                            >
                                اضافة مدير
                            </Menu.Item>
                        ) : null}

                        <Menu.Divider />

                        <Menu.Item
                            icon={<Plus size={14} />}
                            color="gray.6"
                            onClick={() => setOpenAddListPlayersModal(() => data)}
                        >
                            اضافة لاعبين
                        </Menu.Item>
                        <Menu.Item
                            icon={data?.enableAddPlayer ? <Lock size={14} /> : <LockOpen size={14} />}
                            color="gray.6"
                            onClick={() => onChangeStatusAddPlayerModal(() => data)}
                        >
                            {data?.enableAddPlayer ? "توقيف إضافة لاعبين" : "تفعيل إضافة لاعبين"}
                        </Menu.Item>

                        {hasPermission("4") ? (
                            <>
                                <Menu.Divider />
                                <Menu.Item
                                    color="red"
                                    icon={<Trash size={14} />}
                                    onClick={() => onDeleteModal(() => data)}
                                >
                                    حذف الفريق
                                </Menu.Item>
                            </>
                        ) : null}
                    </Menu.Dropdown>
                </Menu>
            </Flex>

            <Divider color={theme.colors.gray[2]} />

            {/* ── Manager block ────────────────────────────────────── */}
            <Box px="md" py="sm" sx={{ flex: 1 }}>
                {admin ? (
                    <Stack spacing={6}>
                        <Group spacing={6} noWrap>
                            <User size={14} color={theme.colors.gray[6]} />
                            <Tooltip label={adminName} withArrow disabled={!adminName}>
                                <Text size="xs" color="gray.7" fw={500} truncate>
                                    {adminName}
                                </Text>
                            </Tooltip>
                        </Group>
                        {admin?.email ? (
                            <Group spacing={6} noWrap>
                                <Mail size={14} color={theme.colors.gray[5]} />
                                <Tooltip label={admin.email} withArrow>
                                    <Text size="xs" color="gray.6" truncate>
                                        {admin.email}
                                    </Text>
                                </Tooltip>
                            </Group>
                        ) : null}
                    </Stack>
                ) : (
                    <Stack spacing={4} align="center" justify="center" py="xs">
                        <Text size="xs" color="orange.6" fw={500}>
                            لا يوجد مدير للفريق
                        </Text>
                        {hasPermission("6") ? (
                            <Button
                                size="xs"
                                variant="subtle"
                                color="blue"
                                leftIcon={<Plus size={12} />}
                                onClick={() => setOpenAddAdminModal(() => data)}
                            >
                                إضافة مدير
                            </Button>
                        ) : null}
                    </Stack>
                )}
            </Box>

            <Divider color={theme.colors.gray[2]} />

            {/* ── Status row ───────────────────────────────────────── */}
            <Group position="apart" px="md" py="xs">
                <Badge
                    radius="sm"
                    size="sm"
                    color={data?.account_status ? "green" : "red"}
                    variant="light"
                >
                    {data?.account_status ? "مفعل" : "متوقف"}
                </Badge>
                <Badge
                    radius="sm"
                    size="sm"
                    color={data?.enableAddPlayer ? "teal" : "gray"}
                    variant="light"
                >
                    {data?.enableAddPlayer ? "إضافة لاعبين مفتوحة" : "إضافة لاعبين موقوفة"}
                </Badge>
            </Group>

            <Box px="md" pb="xs">
                <Text size="xs" color="gray.5">
                    {dayjs(data?.createdAt).locale("ar").fromNow()}
                </Text>
            </Box>

            {/* ── Footer action ────────────────────────────────────── */}
            <Box p="sm" sx={({ colors }) => ({ backgroundColor: colors.gray[0] })}>
                <Button
                    variant="light"
                    color="blue"
                    fullWidth
                    leftIcon={<Eye size={14} />}
                    size="xs"
                    onClick={() => router.push(`/team/${data?.id}`)}
                >
                    عرض تفاصيل الفريق
                </Button>
            </Box>
        </Box>
    );
};

export default CardTeam;
