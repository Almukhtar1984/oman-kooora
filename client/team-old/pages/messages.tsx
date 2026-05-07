import { useTheme } from "@emotion/react";
import { ActionIcon, Box, Button, Col, Container, Grid, Group, MantineTheme, Menu, Stack, TextInput, Title, Tabs, Paper, Text } from "@mantine/core";
import { Lock, Plus, Search, Inbox as InboxIcon, Send } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { searchSortedData, sortedData } from "../lib/helpers/sort";
import {
    AddCommentModal,
    AddMessage,
    DeleteMessageModal,
    ShowMessage,
    UpdateMessage
} from "../components/Modal";
import { useAllMessageReceiver, useAllMessagesSender } from "../graphql";
import useStore from "../store/useStore";
import { InboxTable, OutboxTable } from "../components/Tables";
import { useDisclosure } from "@mantine/hooks";
import { CommentDrawer } from "../components/Drawer";

export default function Messages() {
    const userData = useStore((state: any) => state.userData);
    const theme = useTheme() as MantineTheme;
    
    // UI States
    const [activeTab, setActiveTab] = useState<string | null>("inbox");
    const [searchValue, setSearchValue] = useState<string>("");
    const [opened, { open, close }] = useDisclosure(false);

    // Modal States
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openShowModal, setOpenShowModal] = useState<boolean>(false);
    const [openCommentModal, setOpenCommentModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);

    // Data States
    const [selectedData, setSelectedData] = useState<any>("");
    const [newStatus, setNewStatus] = useState("");
    
    const [inboxMessages, setInboxMessages] = useState<object[]>([]);
    const [inboxFiltered, setInboxFiltered] = useState<object[]>([]);
    
    const [outboxMessages, setOutboxMessages] = useState<object[]>([]);
    const [outboxFiltered, setOutboxFiltered] = useState<object[]>([]);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState<any>(null);

    // Queries
    const [getInbox, { data: dataInbox, loading: loadingInbox }] = useAllMessageReceiver();
    const [getOutbox, { data: dataOutbox, loading: loadingOutbox }] = useAllMessagesSender();

    useEffect(() => {
        const teamId = userData?.person?.member?.team?.id;
        if (teamId) {
            getInbox({ variables: { idTeam: teamId } });
            getOutbox({ variables: { idTeam: teamId } });
        }

        if (userData?.person?.member?.classification) {
            setRole(userData.person.member.classification === "رئيس" ? "1" : "2");
        }

        if (userData?.permission) {
            setPermissions(userData.permission);
        }
    }, [userData]);

    // Handle Inbox Data
    useEffect(() => {
        if (dataInbox?.allMessageTeamReceiver) {
            const sorted = sortedData(dataInbox.allMessageTeamReceiver);
            setInboxMessages(dataInbox.allMessageTeamReceiver);
            setInboxFiltered(sorted);
        }
    }, [dataInbox]);

    // Handle Outbox Data
    useEffect(() => {
        if (dataOutbox?.allMessageTeamSender) {
            const sorted = sortedData(dataOutbox.allMessageTeamSender);
            setOutboxMessages(dataOutbox.allMessageTeamSender);
            setOutboxFiltered(sorted);
        }
    }, [dataOutbox]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);
        
        if (activeTab === "inbox") {
            setInboxFiltered(searchSortedData(inboxMessages, ['name', 'title'], value));
        } else {
            setOutboxFiltered(searchSortedData(outboxMessages, ['name', 'title'], value));
        }
    };

    const hasInboxPermission = (p: string) => {
        if (role === "1") return true;
        const perms = permissions?.inbox?.split(",") || [];
        return perms.includes(p);
    };

    const hasOutboxPermission = (p: string) => {
        if (role === "1") return true;
        const perms = permissions?.outbox?.split(",") || [];
        return perms.includes(p);
    };

    if (!hasInboxPermission("1") && !hasOutboxPermission("1")) {
        return (
            <Box dir="rtl">
                <Head><title>طموح - الرسائل</title></Head>
                <Container size="xl">
                    <Stack justify="center" align="center" h="calc(100vh - 200px)">
                        <Lock color="#ADB5BD" size={100} strokeWidth={1.5} />
                        <Title size="h5" color="#ADB5BD">ليس لديك الاذن بإكتشاف محتوى الصفحة</Title>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box py="xl" dir="rtl" sx={{ backgroundColor: '#F9FAFB', minHeight: 'calc(100vh - 64px)' }}>
            <Head>
                <title>الرسائل | طموح</title>
            </Head>
            <Container size="xl">
                <Box mb="xl">
                    <Title order={2} color="#1E3A8A" weight={700}>الرسائل</Title>
                    <Text color="gray.6">إدارة الرسائل الواردة والصادرة</Text>
                </Box>

                <Paper shadow="sm" radius="md" p="xl" withBorder>
                    <Tabs value={activeTab} onTabChange={setActiveTab} styles={{
                        tabsList: { borderBottom: '2px solid #E5E7EB', marginBottom: '2rem' },
                        tab: { 
                            fontWeight: 600, 
                            fontSize: '1.1rem',
                            padding: '1rem 1.5rem',
                            '&[data-active]': { borderColor: '#2563EB', color: '#2563EB' }
                        }
                    }}>
                        <Tabs.List position="center">
                            {hasInboxPermission("1") && <Tabs.Tab value="inbox" icon={<InboxIcon size={20} />}>البريد الوارد</Tabs.Tab>}
                            {hasOutboxPermission("1") && <Tabs.Tab value="outbox" icon={<Send size={20} />}>البريد الصادر</Tabs.Tab>}
                        </Tabs.List>

                        <Box mb="xl">
                            <Group position="apart">
                                <TextInput 
                                    value={searchValue} 
                                    icon={<Search size={16} color="#ADB5BD" />} 
                                    placeholder="بحث عن رسالة" 
                                    onChange={handleSearchChange}
                                    sx={{ width: 300 }}
                                />
                                {activeTab === "outbox" && hasOutboxPermission("2") && (
                                    <Button 
                                        rightIcon={<Plus size={16} strokeWidth={3} />} 
                                        onClick={() => setOpenAddModal(true)}
                                        color="blue"
                                    >
                                        إضافة رسالة
                                    </Button>
                                )}
                            </Group>
                        </Box>

                        <Tabs.Panel value="inbox">
                            <InboxTable
                                list={inboxFiltered}
                                search={searchValue}
                                setOpenChangeStatusModal={setOpenChangeStatusModal}
                                setOpenCommentModal={setOpenCommentModal}
                                setSelectedRow={setSelectedData}
                                setNewStatus={setNewStatus}
                                openDrawer={open}
                                setSelectedDrawer={() => {}} 
                                setOpenDeleteModal={setOpenDeleteModal}
                                setOpenShowModal={setOpenShowModal}
                                hasPermission={hasInboxPermission}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="outbox">
                            <OutboxTable
                                list={outboxFiltered}
                                search={searchValue}
                                setOpenChangeStatusModal={setOpenChangeStatusModal}
                                setOpenEditModal={setOpenEditModal}
                                setSelectedRow={setSelectedData}
                                setNewStatus={setNewStatus}
                                openDrawer={open}
                                setSelectedDrawer={() => {}}
                                setOpenDeleteModal={setOpenDeleteModal}
                                setOpenShowModal={setOpenShowModal}
                                hasPermission={hasOutboxPermission}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </Paper>
            </Container>

            {/* shared Portals */}
            <AddMessage title="إضافة رسالة" opened={openAddModal} onClose={() => setOpenAddModal(false)} />
            <ShowMessage title="عرض الرسالة" data={selectedData} opened={openShowModal} onClose={() => setOpenShowModal(false)} />
            <UpdateMessage title="تعديل الرسالة" data={selectedData} opened={openEditModal} onClose={() => setOpenEditModal(false)} />
            <DeleteMessageModal title="حذف الرسالة" data={selectedData} opened={openDeleteModal} onClose={() => setOpenDeleteModal(false)} />
            <AddCommentModal title="إضافة تعليق" data={selectedData} opened={openCommentModal} onClose={() => setOpenCommentModal(false)} />
            <CommentDrawer data={selectedData} opened={opened} onClose={close} setOpenCommentModal={setOpenCommentModal} />
        </Box>
    );
}
