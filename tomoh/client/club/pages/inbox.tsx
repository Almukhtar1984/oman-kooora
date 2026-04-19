import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {
    AddMessage,
    AddTeamModal, DeleteMessageModal,
    DeleteTeamModal,
    EditTeamModal,
    ShowMessage,
    UpdateMessage
} from "../components/Modal";
import {useAllMessageReceiver, useAllMessagesSender} from "../graphql";
import useStore from "../store/useStore";
import {InboxTable} from "../components/Tables";
import {useDisclosure} from "@mantine/hooks";
import {CommentDrawer} from "../components/Drawer";
import {AddCommentModal} from "../components/Modal/AddCommentModal";

export default function Inbox() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openCommentModal, setOpenCommentModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openShowModal, setOpenShowModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [selectedDrawer, setSelectedDrawer] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [allMessages, setAllMessages] = useState<object[]>([]);
    const [allMessagesSorting, setAllMessagesSorting] = useState<object[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllMessages, { loading, error, data: dataAllMessages }] = useAllMessageReceiver();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllMessages({
                variables: {idClub}
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.inbox?.split(","))
        }
    }, [userData])

    useEffect(() => {
        console.log(dataAllMessages)
        if (dataAllMessages && "allMessageClubReceiver" in dataAllMessages) {
            setAllMessages([...dataAllMessages.allMessageClubReceiver])
        }
    }, [dataAllMessages])

    useEffect(() => {
        if (allMessages.length >= 0) {
            const filterAllMessages = sortedData(allMessages)

            setAllMessagesSorting([...filterAllMessages])
        }
    }, [allMessages])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllMessages = searchSortedData(allMessages,['name'], value)
        setAllMessagesSorting([...filterAllMessages])
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
                <Box mb={30} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        {/*<Button*/}
                        {/*    rightIcon={<Plus size={16} strokeWidth="3" />}*/}
                        {/*    sx={{ fontWeight: 500 }}*/}
                        {/*    onClick={() => setOpenAddModal(true)}*/}
                        {/*    color={"primary"}*/}
                        {/*>*/}
                        {/*    إضافة رسالة*/}
                        {/*</Button>*/}
                    </Group>
                </Box>

                <InboxTable
                    list={allMessagesSorting}
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
            </Container>

            {/* Portal Components */}
            <ShowMessage  title="الرسالة" data={selectedData} opened={openShowModal} onClose={() => setOpenShowModal(false)}/>


            <AddCommentModal title="إضافة تعليق" data={selectedData} opened={openCommentModal} onClose={() => setOpenCommentModal(false)}/>
            <CommentDrawer  data={selectedData} opened={opened} onClose={() => close()} setOpenCommentModal={setOpenCommentModal}/>
        </Box>
    );
}
