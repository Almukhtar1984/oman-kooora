import { useTheme } from "@emotion/react";
import {ActionIcon, Alert, Box, Button, Container, Group, MantineTheme, Menu, Select, Stack, TextInput, Title} from "@mantine/core";
import {Filter, Lock, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllPlayers, useAllTeams} from "../graphql";
import useStore from "../store/useStore";
import {PlayersTable} from "../components/Tables";
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
    VerifyIdentityModal
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

    const [getAllPlayers, { loading, error, data: dataAllPlayers }] = useAllPlayers();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllPlayers({
                variables: {idClub}
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
    }, [userData, getAllPlayers, getAllTeam])

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
        if (ageCheck !== ""  && age2Check !== "") {
            let filterAllPlayers = allPlayers.filter((item: any) => {
                if (age2Check == ">") {
                    return dayjs(item?.person?.date_birth).fromNow(true) >= ageCheck
                } else {
                    return dayjs(item?.person?.date_birth).fromNow(true) <= ageCheck
                }
            })

            setAllPlayersSorting([...filterAllPlayers])
        } else {
            const filterAllPlayers = sortedData(allPlayers)
            setAllPlayersSorting([...filterAllPlayers])
        }
    }, [ageCheck, age2Check, allPlayers]);

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
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
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
                                    <Menu.Label>فلترة الفئة العمرية</Menu.Label>
                                    <Stack>
                                        <Select
                                            value={age2Check}
                                            onChange={setAge2Check}
                                            data={[
                                                {label: "اقل من", value: "<"},
                                                {label: "اكبر من", value: ">"}
                                            ]}
                                        />
                                        <TextInput
                                            placeholder="العمر"
                                            value={ageCheck}
                                            onChange={(event) => setAgeCheck(event.currentTarget.value)}
                                        />
                                    </Stack>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>

                        {hasPermission("9")
                            ? <Button rightIcon={<Printer size={18} />} color={"primary"} onClick={() => setOpenPrintModal(true)}>
                                طباعة قائمة اللاعبين
                            </Button>
                            : null
                        }

                    </Group>
                </Box>

                <PlayersTable
                    list={allPlayersSorting}
                    search={searchValue}
                    setOpenChangeStatusModal={setOpenChangeStatusModal}
                    setOpenVerifyIdentityModal={setOpenVerifyIdentityModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}
                    setNewStatus={setNewStatus}
                    openDrawer={open}
                    setSelectedDrawer={setSelectedDrawer}
                    setOpenTransferModal={setOpenTransferModal}
                    setOpenLoanModal={setOpenLoanModal}
                    setOpenAddAttachmentPlayerModal={setOpenAddAttachmentPlayerModal}
                    setOpenShowAttachmentPlayerModal={setOpenShowAttachmentPlayerModal}
                    
                    hasPermission={hasPermission}
                />
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
        </Box>
    );
}
