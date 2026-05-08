import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllPlayers, useAllPlayersClubLoan} from "../graphql";
import useStore from "../store/useStore";
import {MemberCard} from "../components/Card/MemberCard";
import {IconDatabaseOff} from "@tabler/icons-react";
import {Pagination, Text} from "@mantine/core";
import {ChangeStatusPlayersModal, UpdatePlayersTransferModal, UpdatePlayerModal} from "../components/Modal";
import {UpdateLoanModal} from "../components/Modal/UpdateLoanModal";
import {DeleteConfirmationModal} from "../components/Modal/DeleteConfirmationModal";
import {useBackToOldTeamTransfer} from "../graphql";
import { Notyf } from "notyf";

export default function PlayersLoan() {
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
    const [updatePlayerModalOpened, setUpdatePlayerModalOpened] = useState(false);
    const [selectedPlayerToEdit, setSelectedPlayerToEdit] = useState<any>(null);
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    const [updateLoanModalOpened, setUpdateLoanModalOpened] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllPlayersLoan, {refetch,loading, error, data: dataAllPlayersLoan }] = useAllPlayersClubLoan();
    const [deleteTransfer] = useBackToOldTeamTransfer();
    const handleRefresh = async () => {
        try {
            console.log("refresh")
            await refetch(); // This will re-fetch the data
        } catch (error) {
            console.error("Error refreshing players data:", error);
        }
    };
    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllPlayersLoan({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.loanPlayers?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllPlayersLoan && "allPlayersClubLoaned" in dataAllPlayersLoan) {
            const fresh = dataAllPlayersLoan.allPlayersClubLoaned.filter(
                (p: any) => p?.lastLoan?.status !== "rejected"
            )
            setAllPlayers([...fresh])
        }
    }, [dataAllPlayersLoan])

    useEffect(() => {
        if (allPlayers.length >= 0) {
            const filterAllPlayers = sortedData(allPlayers)

            setAllPlayersSorting([...filterAllPlayers])
        }

        const filter = allPlayers.filter((item: any) => {
            return (item?.lastLoan?.status == "waiting" && item?.lastLoan?.team_to?.club?.id !== userData?.person?.clubManagement?.club?.id)
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
            'lastLoan.team_from.name', 'lastLoan.team_to.name', 'lastLoan.club_to.name',
            'lastLoan.team_from.club.name', 'lastLoan.team_to.club.name'
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

    const handleDeleteLoan = async () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        try {
            await deleteTransfer({
                variables: { id: selectedTransfer?.id },
            });
            handleRefresh();
            setDeleteModalOpened(false);
            notyf.success("تم إلغاء الإعارة بنجاح");
        } catch (error) {
            console.error("Error deleting loan:", error);
            notyf.error("حدث خطأ أثناء إلغاء الإعارة");
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
                                            type="loan"
                                            data={item}
                                            hasPermission={hasPermission}
                                            onChangeStatus={(id, status) => {
                                                handleOpenEditModal(item.lastLoan, status);
                                            }}
                                            onEdit={(data) => {
                                                setSelectedPlayerToEdit(data.id);
                                                setUpdatePlayerModalOpened(true);
                                            }}

                                            onRenewSubscription={(loan) => {
                                                setSelectedLoan(loan);
                                                setUpdateLoanModalOpened(true);
                                            }}
                                            onDelete={(loan) => {
                                                setSelectedTransfer(loan);
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

            <UpdateLoanModal
                data={selectedLoan}
                opened={updateLoanModalOpened}
                onClose={() => {
                    setUpdateLoanModalOpened(false);
                    handleRefresh();
                }}
            />

            <DeleteConfirmationModal
                opened={deleteModalOpened}
                onClose={() => setDeleteModalOpened(false)}
                onConfirm={handleDeleteLoan}
            />
        </Box>
    );
}