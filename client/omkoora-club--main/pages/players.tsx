import { useTheme } from "@emotion/react";
import {ActionIcon, Alert, Box, Button, Container, Group, MantineTheme, Menu, Select, Stack, TextInput, Title, Pagination, Grid, Col, Text} from "@mantine/core";
import {Filter, Lock, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {IconDatabaseOff} from "@tabler/icons-react";
import {useAllPlayers, useAllTeams} from "../graphql";
import useStore from "../store/useStore";
import {PlayerCard1} from "../components/Card/PlayerCard";
import {
    AddAttachmentPlayerModal,
    ChangeStatusPlayersModal,
    DeleteAttachmentPlayerModal,
    DeletePlayersModal,
    PlayersLoanModal,
    PlayersTransferModal,
    PrintModal,
    ShowAttachments,
    UpdatePlayerModal,
    VerifyIdentityModal,
    AddSanctionModal,
    UpdateSanction,
    ShowStatPlayer,
    ShowStatPlayerList,
    UploadPlayerBySheetModal,
    ChangeClassificationModal
} from "../components/Modal";
import {useDisclosure} from "@mantine/hooks";
import {DrawerTransfer} from "../components/Drawer";
import dayjs from "dayjs";

export default function Players() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [openTransferModal, setOpenTransferModal] = useState<boolean>(false);
    const [openVerifyIdentityModal, setOpenVerifyIdentityModal] = useState<boolean>(false);
    const [openLoanModal, setOpenLoanModal] = useState<boolean>(false);
    const [openShowAttachmentPlayerModal, setOpenShowAttachmentPlayerModal] = useState<boolean>(false);
    const [openDeleteAttachmentModal, setOpenDeleteAttachmentModal] = useState<boolean>(false);
    const [openAddAttachmentPlayerModal, setOpenAddAttachmentPlayerModal] = useState<boolean>(false);
    const [openPrintModal, setOpenPrintModal] = useState<boolean>(false);
    const [openUploadPlayerBySheetModal, setOpenUploadPlayerBySheetModal    ] = useState<boolean>(false);
    const [openAddSanctionModal, setopenAddSanctionModal] = useState<boolean>(false);
    const [openUpdateSanctionModal, setopenUpdateSanctionModal] = useState<boolean>(false);
    const [StatPlayerModal, setStatPlayerModal] = useState<boolean>(false);
    const [StatPlayerListModal, setStatPlayerListModal] = useState<boolean>(false);
    const [openChangeClassificationModal, setOpenChangeClassificationModal] = useState<boolean>(false);
    
    
    const [selectedAttachment, setSelectedAttachment] = useState<any>("");
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>("");
    const [selectedDrawer, setSelectedDrawer] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [allPlayers, setAllPlayers] = useState<object[]>([]);
    const [allPlayersSorting, setAllPlayersSorting] = useState<object[]>([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [playersWaiting, setPlayersWaiting] = useState(0);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [ageCheck, setAgeCheck] = useState<string>("");
    const [age2Check, setAge2Check] = useState<string | null>("<");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [teamFilter, setTeamFilter] = useState<string | null>(null);
    const [classFilter, setClassFilter] = useState<string | null>(null);

    const [getAllPlayers, { loading, error, data: dataAllPlayers }] = useAllPlayers();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllPlayers({
                variables: {idClub},
                fetchPolicy: "network-only"
            })

            getAllTeam({variables: {idClub}})
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.players?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllPlayers && "allPlayersClub" in dataAllPlayers) {
            setAllPlayers([...dataAllPlayers.allPlayersClub])
        }
    }, [dataAllPlayers])

    useEffect(() => {
        if (allPlayers.length >= 0) {
            const filterAllPlayers = sortedData(allPlayers)

            setAllPlayersSorting([...filterAllPlayers])
        }

        const filter = allPlayers.filter((item: any) => item?.status === "waiting")

        setPlayersWaiting(filter.length)
    }, [allPlayers])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);
    useEffect(() => {
        console.log(openAddSanctionModal)
        console.log(selectedData)
    }, [openAddSanctionModal,selectedData]);


    
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        let filtered = sortedData(allPlayers);

        if (ageCheck !== "" && age2Check !== "") {
            filtered = filtered.filter((item: any) => {
                if (age2Check == ">") {
                    return dayjs().diff(dayjs(item?.person?.date_birth), 'year') >= parseInt(ageCheck)
                } else {
                    return dayjs().diff(dayjs(item?.person?.date_birth), 'year') <= parseInt(ageCheck)
                }
            })
        }

        if (statusFilter) {
            filtered = filtered.filter((item: any) => item?.status === statusFilter);
        }

        if (teamFilter) {
            filtered = filtered.filter((item: any) => item?.team?.name === teamFilter);
        }

        if (classFilter) {
            filtered = filtered.filter((item: any) => item?.class === classFilter);
        }

        setAllPlayersSorting([...filtered])
        setPage(1);
    }, [allPlayers, ageCheck, age2Check, statusFilter, teamFilter, classFilter]);

    const totalPages = Math.ceil(allPlayersSorting.length / itemsPerPage);
    const paginatedPlayers = allPlayersSorting.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllPlayers = searchSortedData(
            allPlayers,
            ['person.first_name', "person.second_name", "person.third_name",
            "person.tribe", "person.phone", "person.card_number",
            "occupation", "classification"],
            value
        )
        setAllPlayersSorting([...filterAllPlayers])
        setPage(1);
    };

    const handleEdit = (data: any) => { setSelectedData(data.id); setOpenEditModal(true); };
    const handleDelete = (id: string) => { setSelectedData(id); setOpenDeleteModal(true); };
    const handleChangeStatus = (id: string, status: string) => { setSelectedData({id}); setNewStatus(status); setOpenChangeStatusModal(true); };
    const handleVerifyIdentity = (data: any) => { setSelectedData(data); setOpenVerifyIdentityModal(true); };
    const handleShowAttachments = (data: any) => { setSelectedData(data); setOpenShowAttachmentPlayerModal(true); };
    const handleAddAttachment = (id: string) => { setSelectedData(id); setOpenAddAttachmentPlayerModal(true); };
    const handleStatPlayer = (data: any) => { setSelectedData(data); setStatPlayerListModal(true); };
    const handleTransferPlayer = (data: any) => { setSelectedData(data); setOpenTransferModal(true); };
    const handleLoanPlayer = (data: any) => { setSelectedData(data); setOpenLoanModal(true); };
    const handleOpenTransferHistory = (data: any) => { setSelectedDrawer(data); open(); };
    const handleAddSanction = (data: any) => { setSelectedData(data); setopenAddSanctionModal(true); };
    const handleUpdateSanction = (data: any) => { setSelectedData(data); setopenUpdateSanctionModal(true); };
    const handleChangeClassification = (data: any) => { setSelectedData(data); setOpenChangeClassificationModal(true); };

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
            <Box px="md">
                <Title order={2} mb="xl" color="#1E3A8A">إدارة اللاعبين</Title>
                {playersWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {playersWaiting} لاعبين جدد وهم قيد الاتظار يرجى تاكيدهم او رفضهم</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <Group position={"left"}>
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
                                        <Select
                                            label="الفئة"
                                            placeholder="اختر الفئة"
                                            clearable
                                            value={classFilter}
                                            onChange={setClassFilter}
                                            data={[
                                                { label: 'الفريق الاول', value: 'firstDegree' },
                                                { label: 'تحت 23 سنة', value: 'secondDegree' },
                                                { label: 'تحت 18 سنة', value: 'young' },
                                                { label: 'تحت 16 سنة', value: 'rookies' },
                                            ]}
                                        />
                                    </Stack>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    <div>
                        {hasPermission("9")
                            ? <Button rightIcon={<Printer size={18} />} color={"primary"} onClick={() => setOpenPrintModal(true)}>
                                طباعة قائمة اللاعبين
                            </Button>
                            : null
                        }
                         {hasPermission("9")
                            ? <Button rightIcon={<Printer size={18} />} color={"primary"} onClick={() => setOpenUploadPlayerBySheetModal(true)}>
                                رفع لاعبين عبر الاكسل
                            </Button>
                            : null
                        }
                    </div>
                    </Group>
                </Box>

                <Box mih={400}>
                    {paginatedPlayers.length > 0 ? (
                        <>
                            <Grid gutter="md">
                                {paginatedPlayers.map((item: any) => (
                                    <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                                        <PlayerCard1 
                                            data={item}
                                            hasPermission={hasPermission}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onChangeStatus={handleChangeStatus}
                                            onVerifyIdentity={handleVerifyIdentity}
                                            onShowAttachments={handleShowAttachments}
                                            onAddAttachment={handleAddAttachment}
                                            onStatPlayer={handleStatPlayer}
                                            onTransferPlayer={handleTransferPlayer}
                                            onLoanPlayer={handleLoanPlayer}
                                            onOpenTransferHistory={handleOpenTransferHistory}
                                            onAddSanction={handleAddSanction}
                                            onUpdateSanction={handleUpdateSanction}
                                            onChangeClassification={handleChangeClassification}
                                            onShowDetails={() => {
                                                setSelectedData(item);
                                                setStatPlayerModal(true);
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
            </Box>

            {/* Portal Components */}
            <ChangeStatusPlayersModal title="تعديل حالة لاعب" opened={openChangeStatusModal} id={selectedData?.id} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>


            <VerifyIdentityModal
                title="تحقق من هوية لاعب"
                opened={openVerifyIdentityModal}
                data={selectedData}
                onClose={() => setOpenVerifyIdentityModal(false)}
                setNewStatus={setNewStatus}
                setOpenChangeStatusModal={setOpenChangeStatusModal}
            />

            <UpdatePlayerModal title="تعديل اللاعب" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            
            <DrawerTransfer opened={opened} onClose={close} data={selectedDrawer} />
            <PlayersTransferModal title="نقل لاعب" opened={openTransferModal} data={selectedData} onClose={() => setOpenTransferModal(false)}/>
            <PlayersLoanModal title="إعارة اللاعب" opened={openLoanModal} data={selectedData} onClose={() => setOpenLoanModal(false)}/>
            <DeletePlayersModal title="حذف لاعب" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
            
            <ShowAttachments
                title="المرفقات"
                setSelectedData={setSelectedAttachment}
                setOpenDeleteAttachmentModal={setOpenDeleteAttachmentModal}
                opened={openShowAttachmentPlayerModal}
                data={selectedData}
                onClose={() => setOpenShowAttachmentPlayerModal(false)}
            />
            
            <AddAttachmentPlayerModal title="إضافة مرفقات" opened={openAddAttachmentPlayerModal} id={selectedData} onClose={() => setOpenAddAttachmentPlayerModal(false)}/>
            <DeleteAttachmentPlayerModal
                title=""
                opened={openDeleteAttachmentModal}
                id={selectedAttachment}
                onClose={() => setOpenDeleteAttachmentModal(false)}
            />

            <PrintModal title="طباعة قائمة اللاعبين" opened={openPrintModal} onClose={() => setOpenPrintModal(false)} />

            <UploadPlayerBySheetModal title="رفع لاعبين عبر الاكسل" opened={openUploadPlayerBySheetModal} onClose={() => setOpenUploadPlayerBySheetModal(false)}  />

            <AddSanctionModal opened={openAddSanctionModal} onClose={() => setopenAddSanctionModal(false)} player={selectedData} />
                
            <UpdateSanction playerId={selectedData?.id} opened={openUpdateSanctionModal} onClose={() => setopenUpdateSanctionModal(false)} />
            
            
            {<ShowStatPlayer
                    playerId={selectedData}
                    opened={StatPlayerModal}
                    onClose={() => setStatPlayerModal(false)}
                    setSelectedPlayer={() => {}}
                    setOpenEditPlayerModal={() => {}}
                />}

            {<ShowStatPlayerList
                    playerId={selectedData}
                    opened={StatPlayerListModal}
                    onClose={() => setStatPlayerListModal(false)}
                    setSelectedPlayer={() => {}}
                    setOpenEditPlayerModal={() => {}}
                />}

            <ChangeClassificationModal 
                opened={openChangeClassificationModal} 
                onClose={() => setOpenChangeClassificationModal(false)} 
                data={selectedData} 
                fromType="player" 
                idClub={userData?.person?.clubManagement?.club?.id}
                onSuccess={() => {
                    if (userData?.person?.clubManagement?.club?.id) {
                        getAllPlayers({
                            variables: {idClub: userData?.person?.clubManagement?.club?.id}
                        })
                    }
                }} 
            />
        </Box>
    );
}