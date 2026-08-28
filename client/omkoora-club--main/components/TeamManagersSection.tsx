import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Container,
    Group,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import {Search, Users} from "tabler-icons-react";

import useStore from "../store/useStore";
import {useAllTeamManagers, useAllTeams} from "../graphql";
import {TeamManagersTable} from "./Tables/TeamManagersTable";
import {ResetTeamPasswordModal, UpdateAdminMemberModal} from "./Modal";

/**
 * Stand-alone section that lists every team manager (Member with
 * classification = 'manager') belonging to teams in the current club, plus
 * the actions on each: edit profile / email / password and one-click
 * password reset. Pulled into the `إدارة الأعضاء` tabbed page so the club
 * admin no longer has to drill into each team card to manage its manager.
 */
export const TeamManagersSection = () => {
    const userData = useStore((state: any) => state.userData);
    const idClub = userData?.person?.clubManagement?.club?.id;

    const [getAllTeamManagers, {data, loading}] = useAllTeamManagers();
    const [getAllTeam] = useAllTeams();

    const [search, setSearch] = useState("");
    const [teamFilter, setTeamFilter] = useState<string | null>(null);

    const [openEdit, setOpenEdit] = useState(false);
    const [openReset, setOpenReset] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [selectedTeam, setSelectedTeam] = useState<any>(null);

    const role = userData?.person?.clubManagement?.role;
    const permissionFor = (userData?.permission?.members || "").split(",");
    const hasPermission = (p: string) => {
        if (role === "1") return true;
        return permissionFor.includes(p);
    };

    useEffect(() => {
        if (idClub) {
            getAllTeamManagers({variables: {idClub}, fetchPolicy: "network-only"});
            getAllTeam({variables: {idClub}, fetchPolicy: "network-only"});
        }
    }, [idClub]);

    const allManagers = useMemo(() => {
        const list = data?.allMembersClub || [];
        return list.filter((m: any) => m?.classification === "manager");
    }, [data]);

    const teamOptions = useMemo(() => {
        const set = new Set<string>();
        allManagers.forEach((m: any) => {
            if (m?.team?.name) set.add(m.team.name);
        });
        return Array.from(set).map((name) => ({label: name, value: name}));
    }, [allManagers]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return allManagers.filter((m: any) => {
            if (teamFilter && m?.team?.name !== teamFilter) return false;
            if (!needle) return true;
            const haystack = [
                m?.team?.name,
                m?.person?.first_name,
                m?.person?.second_name,
                m?.person?.third_name,
                m?.person?.tribe,
                m?.person?.phone,
                m?.person?.card_number,
                m?.person?.user?.email,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(needle);
        });
    }, [allManagers, search, teamFilter]);

    const onEdit = (adminUser: any) => {
        // UpdateAdminMemberModal expects the *member id*, not the user id.
        // The list rows know it from the member they were rendered from, so
        // grab it via the user → person → member chain stashed earlier.
        const mgr = allManagers.find((m: any) => m?.person?.user?.id === adminUser?.id);
        if (mgr?.id) {
            setSelectedMemberId(mgr.id);
            setOpenEdit(true);
        }
    };

    const onResetPassword = (team: any) => {
        if (team?.id) {
            setSelectedTeam(team);
            setOpenReset(true);
        }
    };

    return (
        <Container size="xl" p={0}>
            <Group position="apart" mb="md" align="flex-end">
                <Stack spacing={2}>
                    <Group spacing={6} align="center">
                        <Users size={20} color="#1E3A8A" />
                        <Title order={4} color="#1E3A8A">مدراء الفرق</Title>
                    </Group>
                    <Text size="xs" color="dimmed">
                        قائمة بكل مدراء الفرق المرتبطين بالنادي وحساباتهم.
                    </Text>
                </Stack>
                <Text size="sm" color="gray.7">
                    إجمالي: <Text span fw={600}>{allManagers.length}</Text>
                </Text>
            </Group>

            <Group mb="md" spacing="sm">
                <TextInput
                    placeholder="بحث بالاسم، الإيميل، الهاتف، البطاقة..."
                    icon={<Search size={14} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    sx={{flex: 1, minWidth: 240}}
                />
                <Select
                    placeholder="كل الفرق"
                    clearable
                    value={teamFilter}
                    onChange={setTeamFilter}
                    data={teamOptions}
                    sx={{minWidth: 200}}
                />
            </Group>

            {loading && allManagers.length === 0 ? (
                <Stack mih={200} align="center" justify="center">
                    <Text size="sm" color="dimmed">جاري التحميل...</Text>
                </Stack>
            ) : (
                <TeamManagersTable
                    list={filtered}
                    onEdit={onEdit}
                    onResetPassword={onResetPassword}
                    hasPermission={hasPermission}
                />
            )}

            <UpdateAdminMemberModal
                title="تعديل بيانات مدير الفريق"
                opened={openEdit}
                id={selectedMemberId}
                onClose={() => {
                    setOpenEdit(false);
                    if (idClub) getAllTeamManagers({variables: {idClub}, fetchPolicy: "network-only"});
                }}
            />
            <ResetTeamPasswordModal
                title="إعادة تعيين كلمة المرور"
                opened={openReset}
                data={selectedTeam}
                onClose={() => setOpenReset(false)}
            />
        </Container>
    );
};
