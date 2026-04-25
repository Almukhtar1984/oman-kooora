import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllClubManagement, useAllTeams} from "../graphql";
import useStore from "../store/useStore";
import {ClubManagementTable} from "../components/Tables";
import {AddPowerModal, UpdatePowerModal,  } from "../components/Modal";

export default function Powers() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allClubManagement, setAllClubManagement] = useState<object[]>([]);
    const [allClubManagementSorting, setAllClubManagementSorting] = useState<object[]>([]);

    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllClubManagement, { loading, error, data: dataAllClubManagement }] = useAllClubManagement();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllClubManagement({
                variables: {idClub}
            })

            getAllTeam({variables: {idClub}})
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.permissions?.split(","))
        }
    }, [userData, getAllClubManagement, getAllTeam])

    useEffect(() => {
        if (dataAllClubManagement && "allClubManagement" in dataAllClubManagement) {
            setAllClubManagement([...dataAllClubManagement.allClubManagement])
        }
    }, [dataAllClubManagement])

    useEffect(() => {
        if (allClubManagement.length >= 0) {
            const filterAllClubManagement = sortedData(allClubManagement)

            setAllClubManagementSorting([...filterAllClubManagement])
        }
    }, [allClubManagement])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllClubManagement = searchSortedData(
            allClubManagement,
            ['person.first_name', "person.second_name", "person.third_name",
            "person.tribe", "person.phone", "person.card_number",
            "occupation", "classification"],
            value
        )
        setAllClubManagementSorting([...filterAllClubManagement])
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
                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        {hasPermission("2")
                            ? <Button
                                rightIcon={<Plus size={16} strokeWidth="3" />}
                                sx={{ fontWeight: 500 }}
                                onClick={() => setOpenAddModal(true)}
                                color={"primary"}
                            >
                                إضافة صلاحيات
                            </Button>
                            : null
                        }


                    </Group>
                </Box>

                <ClubManagementTable
                    list={allClubManagementSorting}
                    search={searchValue}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <AddPowerModal title="اضافة صلاحيات" opened={openAddModal} id={selectedData} onClose={() => setOpenAddModal(false)} />
            <UpdatePowerModal title="تعديل صلاحيات" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
        </Box>
    );
}
