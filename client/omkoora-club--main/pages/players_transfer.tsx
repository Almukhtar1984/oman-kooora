import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title, Pagination, Text} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllPlayers, useAllPlayersClubTransferred, useBackToOldTeamTransfer} from "../graphql";
import useStore from "../store/useStore";
import {MemberCard} from "../components/Card/MemberCard";
import {IconDatabaseOff} from "@tabler/icons-react";
import {ChangeStatusPlayersModal, UpdatePlayersTransferModal, UpdatePlayerModal, DeleteConfirmationModal} from "../components/Modal";
import { Notyf } from "notyf";

export default function PlayersTransfer() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>(null);
    const [newStatus, setNewStatus] = useState("");
    const [allPlayers, setAllPlayers] = useState<object[]>([]);
    const [allPlayersSorting, setAllPlayersSorting] = useState<object[]>([]);
    const [playersWaiting, setPlayersWaiting] = useState(0);
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [updatePlayerModalOpened, setUpdatePlayerModalOpened] = useState(false);
    const [selectedPlayerToEdit, setSelectedPlayerToEdit] = useState<any>(null);

    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [selectedTransferToDelete, setSelectedTransferToDelete] = useState<any>(null);

    const [getAllPlayersTransferred, { refetch, loading, error, data: dataAllPlayersTransferred }] = useAllPlayersClubTransferred();
    const [deleteTransfer] = useBackToOldTeamTransfer();

    const handleRefresh = async () => {
        try {
            await refetch();
        } catch (error) {
            console.error("Error refreshing players data:", error);
        }
    };

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllPlayersTransferred({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.transferPlayers?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllPlayersTransferred && "allPlayersClubTransferred" in dataAllPlayersTransferred) {
            const fresh = dataAllPlayersTransferred.allPlayersClubTransferred.filter(
                (p: any) => p?.lastTransfer?.status !== "rejected"
            )
            setAllPlayers([...fresh])
        }
    }, [dataAllPlayersTransferred])

    useEffect(() => {
        if (allPlayers.length >= 0) {
            const filterAllPlayers = sortedData(allPlayers)

            setAllPlayersSorting([...filterAllPlayers])
        }

        const filter = allPlayers.filter((item: any) => {
            return (item?.lastTransfer?.status == "waiting" && item?.lastTransfer?.team_to?.club?.id !== userData?.person?.clubManagement?.club?.id)
        })

        setPlayersWaiting(filter.length)
    }, [allPlayers])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllPlayers = searchSortedData(allPlayers,[
            'person.first_name', 'person.second_name', 'person.third_name', 'person.tribe', 'person.card_number',
            'lastTransfer.team_from.name', 'lastTransfer.team_to.name', 'lastTransfer.club_to.name',
            'lastTransfer.team_from.club.name', 'lastTransfer.team_to.club.name'
        ], value)
        setAllPlayersSorting([...filterAllPlayers])
        setPage(1);
    };

    const totalPages = Math.ceil(allPlayersSorting.length / itemsPerPage);
    const paginatedPlayers = allPlayersSorting.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleOpenEditModal = (data: any, status: string) => {
        setSelectedData({
            ...data,
            status
        });
        setOpenEditModal(true);
    };

    const handleDeleteTransfer = async () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        try {
            await deleteTransfer({
                variables: { id: selectedTransferToDelete?.id },
            });
            handleRefresh();
            setDeleteModalOpened(false);
            notyf.success("تم إلغاء الانتقال بنجاح");
        } catch (error) {
            console.error("Error deleting transfer:", error);
            notyf.error("حدث خطأ أثناء إلغاء الانتقال");
        }
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
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
                {playersWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {playersWaiting} انتقلات قيد الاتظار يرجى تاكيدها او رفضها</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"left"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>
                    </Group>
                </Box>

                <Box mih={400}>
                    {paginatedPlayers.length > 0 ? (
                        <>
                            <Grid gutter="md">
                                {paginatedPlayers.map((item: any) => (
                                    <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                                        <MemberCard 
                                            type="transfer"
                                            data={item}
                                            hasPermission={hasPermission}
                                            onChangeStatus={(id, status) => {
                                                // Find the transfer data within the item
                                                handleOpenEditModal(item.lastTransfer, status);
                                            }}
                                            onEdit={(data) => {
                                                setSelectedPlayerToEdit(data.id);
                                                setUpdatePlayerModalOpened(true);
                                            }}
                                            onDelete={() => {
                                                setSelectedTransferToDelete(item?.lastTransfer);
                                                setDeleteModalOpened(true);
                                            }}
                                        />
                                    </Col>
                                ))}
                            </Grid>
                            <Group position="center" mt="xl">
                                <Pagination total={totalPages} value={page} onChange={setPage} />
                            </Group>
                        </>
                    ) : (
                        <Stack mih={300} align='center' justify='center'>
                            <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
                            <Text size={"md"} c={"gray.8"}>لا توجد بيانات ليتم عرضها</Text>
                        </Stack>
                    )}
                </Box>
            </Container>

            {/* Portal Components */}
            <UpdatePlayersTransferModal title="تعديل حالة لاعب" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
            
            <UpdatePlayerModal title="تعديل اللاعب" opened={updatePlayerModalOpened} id={selectedPlayerToEdit} onClose={() => setUpdatePlayerModalOpened(false)}/>

            <DeleteConfirmationModal
                opened={deleteModalOpened}
                onClose={() => setDeleteModalOpened(false)}
                onConfirm={handleDeleteTransfer}
            />
        </Box>
    );
}