import { useTheme } from "@emotion/react";
import {ActionIcon, Alert, Box, Button, Col, Container, Grid, Group, MantineTheme, Menu, Select, Stack, TextInput, Title} from "@mantine/core";
import {Filter, Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import { useMediaQuery } from "react-responsive";
import {useAllMembers, useAllTeams} from "../graphql";
import useStore from "../store/useStore";
import {MembersTable} from "../components/Tables";
import {ChangeStatusMembersModal, DeleteMembersModal, UpdateMemberModal, ChangeClassificationModal} from "../components/Modal";

import Players from "./players";
import Technicals from "./technicalApparatus";
import Assembly from "./assembly";
import { Tabs } from '@mantine/core';

function MembersContent() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [openChangeClassificationModal, setOpenChangeClassificationModal] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [teamFilter, setTeamFilter] = useState<string | null>(null);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allMembers, setAllMembers] = useState<object[]>([]);
    const [allMembersSorting, setAllMembersSorting] = useState<object[]>([]);
    const [newStatus, setNewStatus] = useState("");
    const [membersWaiting, setMembersWaiting] = useState(0);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllMembers, { loading, error, data: dataAllMembers }] = useAllMembers();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllMembers({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
            getAllTeam({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.members?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllMembers && "allMembersClub" in dataAllMembers) {
            setAllMembers([...dataAllMembers.allMembersClub])
        }
    }, [dataAllMembers])

    useEffect(() => {
        let filtered = sortedData(allMembers);

        if (statusFilter) {
            filtered = filtered.filter((item: any) => item?.status === statusFilter);
        }

        if (teamFilter) {
            filtered = filtered.filter((item: any) => item?.team?.name === teamFilter);
        }

        setAllMembersSorting([...filtered])

        const filter = allMembers.filter((item: any) => item?.status === "waiting")
        setMembersWaiting(filter.length)
    }, [allMembers, statusFilter, teamFilter]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllMembers = searchSortedData(
            allMembers,
            ['person.first_name', "person.second_name", "person.third_name",
                "person.tribe", "person.phone", "person.card_number",
                "occupation", "classification"],
            value
        )
        setAllMembersSorting([...filterAllMembers])
    };

    const hasPermission = (permission: string) => {
        if (role && role === "1") {
            return true
        } else {
            if (permissions && permissions.length > 0) {
                const permissionChacked = permissions.filter((item: string) => item === permission)
                return permissionChacked.length > 0
            } else return false
        }
    }

    if (!hasPermission("1")) {
        return (
            <Box>
                <Head>
                    <title>طموح</title>
                </Head>
                <Container size={"xl"}>
                    <Stack justify={"center"} align={"center"} h={"calc(100vh - 200px)"}>
                        <Lock color={theme.colors.gray[4]} size={100} strokeWidth={1.5} />
                        <Title size={"h5"} color={theme.colors.gray[5]} >ليس لديك الاذن بإكتشاف محتوى الصفحة</Title>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box>
            <Head>
                <title>طموح</title>
            </Head>
            <Container size={"xl"}>
                {membersWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {membersWaiting} اعضو فريق جدد وهم قيد الاتظار يرجى تاكيدهم او رفضهم</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <Group>
                            <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>
                            <Menu position={"right-start"} width={200} closeOnItemClick={false}>
                                <Menu.Target>
                                    <ActionIcon>
                                        <Filter size={18} color={"#4b5563"} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>فلترة إضافية</Menu.Label>
                                    <Stack p="xs">
                                        <Select
                                            label="الحالة"
                                            placeholder="اختر الحالة"
                                            clearable
                                            value={statusFilter}
                                            onChange={setStatusFilter}
                                            data={[
                                                { label: 'مقبول', value: 'accepted' },
                                                { label: 'مرفوض', value: 'rejected' },
                                                { label: 'قيد انتظار النادي', value: 'waiting_club' },
                                                { label: 'قيد انتظار الفريق', value: 'waiting' },
                                                { label: 'معاقب', value: 'suspended' },
                                            ]}
                                        />
                                        <Select
                                            label="الفريق"
                                            placeholder="اختر الفريق"
                                            clearable
                                            value={teamFilter}
                                            onChange={setTeamFilter}
                                            data={dataAllTeams?.allTeam?.map((t: any) => ({ label: t.name, value: t.name })) || []}
                                        />
                                    </Stack>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>


                        {hasPermission("6")
                            ? <Menu shadow="md" width={200}>
                                <Menu.Target>
                                        <Button rightIcon={<Printer size={18} />} color={"primary"}>
                                            طباعة قائمة اعضاء الفريق
                                        </Button>
                                        
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>قائمة الفرق</Menu.Label>

                                    {dataAllTeams?.allTeam?.map((item: any) => (
                                        <Menu.Item
                                            key={item?.id}
                                            component={"a"}
                                            href={`https://print.omkooora.com/#/members/${item?.id}/team`}
                                            target={"_blank"}
                                        >{item?.name}</Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                            : null
                        }
                    </Group>
                </Box>

                <MembersTable
                    list={allMembersSorting}
                    search={searchValue}
                    setOpenChangeStatusModal={setOpenChangeStatusModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}
                    setNewStatus={setNewStatus}
                    
                    hasPermission={hasPermission}
                    setOpenChangeClassificationModal={setOpenChangeClassificationModal}
                />
            </Container>

            {/* Portal Components */}
            <ChangeStatusMembersModal title="تعديل حالة عضو مجلس الأدارة" opened={openChangeStatusModal} id={selectedData} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>

            <UpdateMemberModal title="تعديل عضو مجلس الأدارة" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteMembersModal title="حذف عضو مجلس الأدارة" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
            <ChangeClassificationModal 
                opened={openChangeClassificationModal} 
                onClose={() => setOpenChangeClassificationModal(false)} 
                data={selectedData} 
                fromType="member" 
                idClub={userData?.person?.clubManagement?.club?.id}
                onSuccess={() => {
                    if (userData?.person?.clubManagement?.club?.id) {
                        getAllMembers({variables: {idClub: userData?.person?.clubManagement?.club?.id}})
                    }
                }} 
            />
        </Box>
    );
}

export default function Members() {
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
    return (
        <Container size="xl" pt="md">
            <Title order={2} mb="xl" color="#1E3A8A">إدارة الأعضاء</Title>
            <Tabs defaultValue="players" color="orange" sx={(theme) => ({
                '[data-active]': { borderColor: '#FBBF24', color: '#1E3A8A' }
            })}>
                <Tabs.List mb="md" grow sx={{ 
                    flexWrap: 'nowrap', 
                    overflowX: 'auto', 
                    overflowY: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                }}>
                    <Tabs.Tab value="players" fz={isMobile ? "xs" : "md"} fw={600}>اللاعبين</Tabs.Tab>
                    <Tabs.Tab value="technicals" fz={isMobile ? "xs" : "md"} fw={600}>الجهاز الفني</Tabs.Tab>
                    <Tabs.Tab value="members" fz={isMobile ? "xs" : "md"} fw={600}>مجلس الإدارة</Tabs.Tab>
                    <Tabs.Tab value="assembly" fz={isMobile ? "xs" : "md"} fw={600}>العمومية</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="players">
                    <Players />
                </Tabs.Panel>
                <Tabs.Panel value="technicals">
                    <Technicals />
                </Tabs.Panel>
                <Tabs.Panel value="members">
                    <MembersContent />
                </Tabs.Panel>
                <Tabs.Panel value="assembly">
                    <Assembly />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}