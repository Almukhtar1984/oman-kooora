import React, {useEffect, useMemo, useState} from "react";
import {
    ActionIcon,
    Avatar,
    Badge,
    Box,
    Grid,
    Group,
    Menu,
    Pagination,
    Stack,
    Table,
    Text,
    Tooltip,
} from "@mantine/core";
import {DotsVertical, Edit, Key, Mail, Phone} from "tabler-icons-react";
import {IconDatabaseOff} from "@tabler/icons-react";
import dayjs from "dayjs";

import {getImageUrl} from "../../lib/helpers/image";

interface Manager {
    id: string;
    person?: any;
    team?: any;
    status?: string;
    createdAt?: string;
}

interface Props {
    list: Manager[];
    onEdit: (admin: any) => void;
    onResetPassword: (team: any) => void;
    hasPermission: (permission: string) => boolean;
}

const PAGE_SIZE = 12;

export const TeamManagersTable = ({list, onEdit, onResetPassword, hasPermission}: Props) => {
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [list.length]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(list.length / PAGE_SIZE)), [list.length]);
    const pageItems = useMemo(
        () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [list, page]
    );

    if (list.length === 0) {
        return (
            <Stack mih={300} align="center" justify="center">
                <IconDatabaseOff size="5rem" strokeWidth={1} color="#ADB5BD" />
                <Text size="md" c="gray.8">لا يوجد مدراء فرق</Text>
            </Stack>
        );
    }

    return (
        <Box>
            <Grid gutter="md">
                {pageItems.map((member: any) => {
                    const person = member?.person;
                    const user = person?.user;
                    const fullName = [
                        person?.first_name,
                        person?.second_name,
                        person?.third_name,
                        person?.tribe,
                    ]
                        .filter(Boolean)
                        .join(" ");
                    return (
                        <Grid.Col key={member.id} xs={12} sm={6} md={4} lg={3}>
                            <Box
                                p="md"
                                bg="white"
                                sx={({colors}) => ({
                                    border: `1px solid ${colors.gray[3]}`,
                                    borderRadius: 8,
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
                                <Group position="apart" align="flex-start" noWrap mb="xs">
                                    <Group spacing="sm" noWrap sx={{minWidth: 0, flex: 1}}>
                                        <Avatar
                                            src={getImageUrl(person?.personal_picture)}
                                            radius="md"
                                            size={48}
                                            color="blue"
                                        />
                                        <Stack spacing={2} sx={{minWidth: 0, flex: 1}}>
                                            <Tooltip label={fullName} withArrow disabled={!fullName}>
                                                <Text fw={600} size="sm" color="gray.8" truncate>
                                                    {fullName || "—"}
                                                </Text>
                                            </Tooltip>
                                            <Tooltip label={member?.team?.name} withArrow disabled={!member?.team?.name}>
                                                <Badge size="xs" variant="light" color="blue" radius="sm">
                                                    {member?.team?.name || "—"}
                                                </Badge>
                                            </Tooltip>
                                        </Stack>
                                    </Group>
                                    {(hasPermission("7") || hasPermission("3")) ? (
                                        <Menu withArrow shadow="md" position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle">
                                                    <DotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                {hasPermission("7") ? (
                                                    <Menu.Item
                                                        icon={<Edit size={14} />}
                                                        onClick={() => onEdit(user)}
                                                    >
                                                        تعديل البيانات
                                                    </Menu.Item>
                                                ) : null}
                                                {hasPermission("7") ? (
                                                    <Menu.Item
                                                        icon={<Key size={14} />}
                                                        onClick={() => onResetPassword(member?.team)}
                                                    >
                                                        إعادة تعيين كلمة المرور
                                                    </Menu.Item>
                                                ) : null}
                                            </Menu.Dropdown>
                                        </Menu>
                                    ) : null}
                                </Group>

                                <Stack spacing={6} sx={{flex: 1}}>
                                    {user?.email ? (
                                        <Group spacing={6} noWrap>
                                            <Mail size={14} color="#6B7280" />
                                            <Tooltip label={user.email} withArrow>
                                                <Text size="xs" color="gray.7" truncate>
                                                    {user.email}
                                                </Text>
                                            </Tooltip>
                                        </Group>
                                    ) : (
                                        <Text size="xs" color="orange.6">
                                            لا يوجد حساب دخول
                                        </Text>
                                    )}
                                    {person?.phone ? (
                                        <Group spacing={6} noWrap>
                                            <Phone size={14} color="#6B7280" />
                                            <Text size="xs" color="gray.7" truncate>
                                                {person.phone}
                                            </Text>
                                        </Group>
                                    ) : null}
                                    {person?.card_number ? (
                                        <Text size="xs" color="gray.6">
                                            البطاقة المدنية: {person.card_number}
                                        </Text>
                                    ) : null}
                                </Stack>

                                <Group position="apart" mt="sm" pt="xs" sx={({colors}) => ({borderTop: `1px solid ${colors.gray[2]}`})}>
                                    <Text size="xs" color="gray.5">
                                        {member?.createdAt ? dayjs(member.createdAt).locale("ar").fromNow() : ""}
                                    </Text>
                                    <Badge size="xs" radius="sm" variant="light" color={user ? "green" : "gray"}>
                                        {user ? "نشط" : "بدون حساب"}
                                    </Badge>
                                </Group>
                            </Box>
                        </Grid.Col>
                    );
                })}
            </Grid>

            {totalPages > 1 ? (
                <Group position="center" mt="xl">
                    <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
            ) : null}
        </Box>
    );
};
