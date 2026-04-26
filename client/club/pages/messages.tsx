import { ActionIcon, Box, Button, Col, Container, Grid, Group, MantineTheme, Menu, Stack, TextInput, Title, Tabs, Paper, Text } from "@mantine/core";
import { Lock, Plus, Search, Inbox as InboxIcon, Send } from "tabler-icons-react";
import { useRouter } from "next/router";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { searchSortedData, sortedData } from "../lib/helpers/sort";
import {
    AddMessage,
    DeleteMessageModal,
    ShowMessage,
    UpdateMessage
} from "../components/Modal";
import { useAllMessageReceiver, useAllMessagesSender } from "../graphql";
import useStore from "../store/useStore";
import { useDisclosure } from "@mantine/hooks";
import { InboxTable, OutboxTable } from "../components/Tables";
import { CommentDrawer } from "../components/Drawer";
import { AddCommentModal } from "../components/Modal/AddCommentModal";

export default function Messages() {
    const router = useRouter();
    const { tab } = router.query;
    const userData = useStore((state: any) => state.userData);
    const theme = useStore((state: any) => state.theme) as MantineTheme;

    // Common states
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>("");
    const [selectedDrawer, setSelectedDrawer] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [opened, { open, close }] = useDisclosure(false);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState<any[]>([]);

    // Modal states
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openShowModal, setOpenShowModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [openCommentModal, setOpenCommentModal] = useState<boolean>(false);

    // Data states
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [inboxSorting, setInboxSorting] = useState<any[]>([]);
    const [outboxMessages, setOutboxMessages] = useState<any[]>([]);
    const [outboxSorting, setOutboxSorting] = useState<any[]>([]);

    // GraphQL Hooks
    const [getInbox, { loading: loadingInbox, data: dataInbox }] = useAllMessageReceiver();
    const [getOutbox, { loading: loadingOutbox, data: dataOutbox }] = useAllMessagesSender();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getInbox({ variables: { idClub } });
            getOutbox({ variables: { idClub } });
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role);
        }
        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission;
            setPermissions([...(permission?.inbox?.split(",") || []), ...(permission?.outbox?.split(",") || [])]);
        }
    }, [userData]);

    useEffect(() => {
        if (dataInbox && "allMessageClubReceiver" in dataInbox) {
            setInboxMessages([...dataInbox.allMessageClubReceiver]);
        }
    }, [dataInbox]);

    useEffect(() => {
        if (dataOutbox && "allMessageClubSender" in dataOutbox) {
            setOutboxMessages([...dataOutbox.allMessageClubSender]);
        }
    }, [dataOutbox]);

    useEffect(() => {
        setInboxSorting(sortedData(inboxMessages));
    }, [inboxMessages]);

    useEffect(() => {
        setOutboxSorting(sortedData(outboxMessages));
    }, [outboxMessages]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);
        if (tab === 'outbox') {
            setOutboxSorting(searchSortedData(outboxMessages, ['name'], value));
        } else {
            setInboxSorting(searchSortedData(inboxMessages, ['name'], value));
        }
    };

    const hasPermission = (permission: string) => {
        if (role && role === "1") return true;
        return permissions.some((p: string) => p === permission);
    };

    const activeTab = (tab as string) || "inbox";

    const handleTabChange = (value: string) => {
        router.push({ query: { ...router.query, tab: value } }, undefined, { shallow: true });
        setSearchValue("");
        setInboxSorting(sortedData(inboxMessages));
        setOutboxSorting(sortedData(outboxMessages));
    };

    if (!hasPermission("1")) {
        return (
            <Box>
                <Head><title>طموح</title></Head>
                <Container size={"xl"}>
                    <Stack justify={"center"} align={"center"} h={"calc(100vh - 200px)"}>
                        <Lock color="#ADB5BD" size={100} strokeWidth={1.5} />
                        <Title size={"h5"} color="#ADB5BD">ليس لديك الاذن بإكتشاف محتوى الصفحة</Title>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box py="xl" sx={{ backgroundColor: '#F9FAFB', minHeight: 'calc(100vh - 64px)' }}>
            <Head>
                <title>الرسائل | طموح</title>
            </Head>
            <Container size="xl">
                <Box mb="xl">
                    <Title order={2} color="#1E3A8A" weight={700}>الرسائل</Title>
                    <Text color="gray.6">إدارة الرسائل الواردة والصادرة</Text>
                </Box>

                <Paper shadow="sm" radius="md" p="xl" withBorder>
                    <Tabs value={activeTab} onTabChange={handleTabChange} styles={{
                        tabsList: { borderBottom: '2px solid #E5E7EB', marginBottom: '2rem' },
                        tab: { 
                            fontWeight: 600, 
                            fontSize: '1.1rem',
                            padding: '1rem 1.5rem',
                            '&[data-active]': { borderColor: '#2563EB', color: '#2563EB' }
                        }
                    }}>
                        <Tabs.List position="center">
                            <Tabs.Tab value="inbox" icon={<InboxIcon size={20} />}>صندوق الوارد</Tabs.Tab>
                            <Tabs.Tab value="outbox" icon={<Send size={20} />}>صندوق الصادر</Tabs.Tab>
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
                                {activeTab === "outbox" && hasPermission("2") && (
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
                                list={inboxSorting}
                                search={searchValue}
                                setOpenChangeStatusModal={setOpenChangeStatusModal}
                                setOpenCommentModal={setOpenCommentModal}
                                setSelectedRow={setSelectedData}
                                setNewStatus={setNewStatus}
                                openDrawer={open}
                                setSelectedDrawer={setSelectedDrawer}
                                setOpenDeleteModal={setOpenDeleteModal}
                                setOpenShowModal={setOpenShowModal}
                                hasPermission={hasPermission}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="outbox">
                            <OutboxTable
                                list={outboxSorting}
                                search={searchValue}
                                setOpenChangeStatusModal={setOpenChangeStatusModal}
                                setOpenEditModal={setOpenEditModal}
                                setSelectedRow={setSelectedData}
                                setNewStatus={setNewStatus}
                                openDrawer={open}
                                setSelectedDrawer={setSelectedDrawer}
                                setOpenDeleteModal={setOpenDeleteModal}
                                setOpenShowModal={setOpenShowModal}
                                hasPermission={hasPermission}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </Paper>
            </Container>

            {/* Portal Components */}
            <AddMessage title="إضافة رسالة" opened={openAddModal} onClose={() => setOpenAddModal(false)} />
            <ShowMessage title="الرسالة" data={selectedData} opened={openShowModal} onClose={() => setOpenShowModal(false)} />
            <UpdateMessage title="تعديل رسالة" data={selectedData} opened={openEditModal} onClose={() => setOpenEditModal(false)} />
            <DeleteMessageModal title="حذف رسالة" data={selectedData} opened={openDeleteModal} onClose={() => setOpenDeleteModal(false)} />
            <AddCommentModal title="إضافة تعليق" data={selectedData} opened={openCommentModal} onClose={() => setOpenCommentModal(false)} />
            <CommentDrawer data={selectedData} opened={opened} onClose={() => close()} setOpenCommentModal={setOpenCommentModal} />
        </Box>
    );
}
