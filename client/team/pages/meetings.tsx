import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {
    AddExpenseModal,
    AddMeetingModal, DeleteExpenseModal,
    DeleteMeetingModal,
    UpdateExpenseModal,
    UpdateMeetingModal
} from "../components/Modal";
import {useAllMeeting, } from "../graphql";
import useStore from "../store/useStore";
import {MeetingTable} from "../components/Tables";
import {useDisclosure} from "@mantine/hooks";

export default function Meetings() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [allMeetings, setAllMeetings] = useState<object[]>([]);
    const [allMeetingsSorting, setAllMeetingsSorting] = useState<object[]>([]);
    const [opened, { open, close }] = useDisclosure(false);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [getAllMeetings, { loading, error, data: dataAllMeetings }] = useAllMeeting();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllMeetings({
                variables: {idTeam}
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.meeting?.split(","))
        }
    }, [userData])

    useEffect(() => {
        console.log(dataAllMeetings)
        if (dataAllMeetings && "allMeetingsTeam" in dataAllMeetings) {
            setAllMeetings([...dataAllMeetings.allMeetingsTeam])
        }
    }, [dataAllMeetings])

    useEffect(() => {
        if (allMeetings.length >= 0) {
            const filterAllMeetings = sortedData(allMeetings)

            setAllMeetingsSorting([...filterAllMeetings])
        }
    }, [allMeetings])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllMeetings = searchSortedData(allMeetings,['name'], value)
        setAllMeetingsSorting([...filterAllMeetings])
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

                        {hasPermission("2")
                            ? <Button
                                rightIcon={<Plus size={16} strokeWidth="3" />}
                                sx={{ fontWeight: 500 }}
                                onClick={() => setOpenAddModal(true)}
                                color={"primary"}
                            >
                                إضافة اجتماع
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <MeetingTable
                    list={allMeetingsSorting}
                    search={searchValue}
                    setSelectedRow={setSelectedData}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <AddMeetingModal title="اضافة محضر اجتماع" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>

            <UpdateMeetingModal title="تعديل محضر الاجتماع" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteMeetingModal title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)}/>
        </Box>
    );
}
