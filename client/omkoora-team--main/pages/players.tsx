import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {
    AddAttachmentPlayerModal,
    AddImagePlayersModal,
    AddPlayersModal,
    ChangeStatusPlayersModal,
    DeleteAttachmentPlayerModal,
    DeletePlayersModal,
    PlayersLoanModal,
    PlayersTransferModal,
    ShowAttachments,
    UpdatePlayersModal, 
    VerifyIdentityModal,
    ShowStatPlayer,
    ConvertPlayerToTechnicalModal,
    FreePlayerModal
} from "../components/Modal";
import {useAllPlayers} from "../graphql";
import useStore from "../store/useStore";
import {PlayersTable,PlayersTableMobile} from "../components/Tables";
import { useMediaQuery } from "react-responsive";


export default function Players() {
    const userData = useStore((state: any) => state.userData);
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openFreeModal, setopenFreeModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openAddImageModal, setOpenAddImageModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openConvertToTichnicaleModal, setopenConvertToTichnicaleModal] = useState<boolean>(false);
    const [openTransferModal, setOpenTransferModal] = useState<boolean>(false);
    const [openLoanModal, setOpenLoanModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [openVerifyIdentityModal, setOpenVerifyIdentityModal] = useState<boolean>(false);
    const [openAddAttachmentPlayerModal, setOpenAddAttachmentPlayerModal] = useState<boolean>(false);
    const [StatPlayerModal, setStatPlayerModal] = useState<boolean>(false);
    
    const [openShowAttachmentPlayerModal, setOpenShowAttachmentPlayerModal] = useState<boolean>(false);
    const [openDeleteAttachmentModal, setOpenDeleteAttachmentModal] = useState<boolean>(false);
    const [newStatus, setNewStatus] = useState("");

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>(null);

    const [selectedAttachment, setSelectedAttachment] = useState<any>("");
    const [allPlayers, setAllPlayers] = useState<object[]>([]);
    const [allPlayersSorting, setAllPlayersSorting] = useState<object[]>([]);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [getAllPlayers, { loading, error, data: dataAllPlayers }] = useAllPlayers();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllPlayers({
                variables: {idTeam}
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.players?.split(","))
        }
        
    }, [userData])

    useEffect(() => {
        if (dataAllPlayers && "allPlayers" in dataAllPlayers) {
            const fresh = dataAllPlayers.allPlayers
            setAllPlayers([...fresh])

            // Keep modals (e.g. ShowAttachments) in sync after add/delete-attachment refetches.
            if (selectedData && typeof selectedData === "object" && selectedData?.id) {
                const refreshed = fresh.find((p: any) => p.id === selectedData.id)
                if (refreshed) setSelectedData(refreshed)
            }
        }
    }, [dataAllPlayers])

    useEffect(() => {
        if (allPlayers.length >= 0) {
            const filterAllPlayers = sortedData(allPlayers)

            setAllPlayersSorting([...filterAllPlayers])
        }
    }, [allPlayers])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

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
                {!userData?.person?.member?.team?.enableAddPlayer
                    ? <Alert variant="light" color="yellow">قام النادي بتوقيف اضافة اللاعبين</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        <Group position={"right"}>
                            {hasPermission("6")
                                ? <Button
                                    rightIcon={<Printer size={18} />}
                                    color={"primary"}

                                    component={"a"}
                                    href={`https://print.omkooora.com/#/players/${userData?.person?.member?.team?.id}/team`}
                                    target={"_blank"}
                                >
                                    طباعة قائمة اللاعبين
                                </Button>
                                : null
                            }
                            {hasPermission("2") && userData?.person?.member?.team?.enableAddPlayer
                                ? <Button
                                            rightIcon={<Plus size={16} strokeWidth="3" />}
                                            sx={{ fontWeight: 500 }}
                                    onClick={() => setOpenAddModal(true)}
                                    color={"primary"}
                                >
                                    إضافة لاعب
                                </Button>
                                :null
                            }
                        </Group>
                    </Group>
                </Box>
                {isMobile ? (
                    <PlayersTableMobile
                    list={allPlayersSorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setSelectedRow={setSelectedData}
                    setOpenVerifyIdentityModal={setOpenVerifyIdentityModal}
                    setOpenAddImageModal={setOpenAddImageModal}
                    setOpenTransferModal={setOpenTransferModal}
                    setOpenLoanModal={setOpenLoanModal}
                    hasPermission={hasPermission}
                    setStatPlayerModal={setStatPlayerModal}
                    setOpenAddAttachmentPlayerModal={setOpenAddAttachmentPlayerModal}
                    setOpenShowAttachmentPlayerModal={setOpenShowAttachmentPlayerModal}
                    setopenConvertToTichnicaleModal={setopenConvertToTichnicaleModal}
                />
                ):(
                <PlayersTable
                    list={allPlayersSorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setSelectedRow={setSelectedData}
                    setOpenVerifyIdentityModal={setOpenVerifyIdentityModal}
                    setOpenAddImageModal={setOpenAddImageModal}
                    setOpenTransferModal={setOpenTransferModal}
                    setOpenLoanModal={setOpenLoanModal}
                    hasPermission={hasPermission}
                    setStatPlayerModal={setStatPlayerModal}
                    setOpenAddAttachmentPlayerModal={setOpenAddAttachmentPlayerModal}
                    setOpenShowAttachmentPlayerModal={setOpenShowAttachmentPlayerModal}
                    setopenConvertToTichnicaleModal={setopenConvertToTichnicaleModal}
                    setopenFreeModal={setopenFreeModal}
                />)}
            </Container>

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


                {<ShowStatPlayer
                    playerId={selectedData}
                    opened={StatPlayerModal}
                    onClose={() => setStatPlayerModal(false)}
                    setSelectedPlayer={() => {}}
                    setOpenEditPlayerModal={() => {}}
                />}
            
            <AddPlayersModal title="إضافة لاعب" data={selectedData} opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <FreePlayerModal title="تحرير اللاعب" id={selectedData} opened={openFreeModal} onClose={() => setopenFreeModal(false)}/>
            
            <UpdatePlayersModal title="تعديل لاعب" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <AddImagePlayersModal title="اضافة صورة للاعب" opened={openAddImageModal} id={selectedData} onClose={() => setOpenAddImageModal(false)}/>
            <DeletePlayersModal title="حذف لاعب" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
            <ConvertPlayerToTechnicalModal title="نفل اللاعب للجهاز الفني" opened={openConvertToTichnicaleModal} id={selectedData} onClose={() => setopenConvertToTichnicaleModal(false)}/>
             
            <PlayersTransferModal title="نقل لاعب" opened={openTransferModal} id={selectedData} onClose={() => setOpenTransferModal(false)}/>
            <PlayersLoanModal title="إعارة اللاعب" opened={openLoanModal} id={selectedData} onClose={() => setOpenLoanModal(false)}/>
        
            <AddAttachmentPlayerModal title="إضافة مرفقات" opened={openAddAttachmentPlayerModal} id={selectedData} onClose={() => setOpenAddAttachmentPlayerModal(false)}/>
            <DeleteAttachmentPlayerModal
                title=""
                opened={openDeleteAttachmentModal}
                id={selectedAttachment}
                onClose={() => setOpenDeleteAttachmentModal(false)}
            />
            
            <ShowAttachments
                title="المرفقات"
                setSelectedData={setSelectedAttachment}
                setOpenDeleteAttachmentModal={setOpenDeleteAttachmentModal}
                opened={openShowAttachmentPlayerModal}
                data={selectedData}
                onClose={() => setOpenShowAttachmentPlayerModal(false)}
            />
        </Box>
        
    );
}