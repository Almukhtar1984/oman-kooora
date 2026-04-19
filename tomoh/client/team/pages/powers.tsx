import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllMembersHasAccount} from "../graphql";
import useStore from "../store/useStore";
import {TeamManagementTable} from "../components/Tables";
import {AddPowerModal, UpdatePowerModal,  } from "../components/Modal";

export default function Powers() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [existingMember, setExistingMember] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allMembers, setAllMembers] = useState<object[]>([]);
    const [allMembersSorting, setAllMembersSorting] = useState<object[]>([]);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [getAllMembersHasAccount, { loading, error, data: dataAllMembers }] = useAllMembersHasAccount();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllMembersHasAccount({
                variables: {idTeam}
            })
        }
        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.permissions?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllMembers && "allMembersHasAccount" in dataAllMembers) {
            setAllMembers([...dataAllMembers.allMembersHasAccount])
        }
    }, [dataAllMembers])

    useEffect(() => {
        if (allMembers.length >= 0) {
            const filterAllMembers = sortedData(allMembers)

            setAllMembersSorting([...filterAllMembers])
        }
    }, [allMembers])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllMembers = searchSortedData(
            allMembers,
            ['person.first_name', "person.second_name", "person.third_name",
            "person.tribe", "person.phone", "person.card_number",
            "occupation", "classification"],
            value
        )
        setAllMembersSorting([...filterAllMembers])
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
                            ? <Menu shadow="md" width={200}>
                                <Menu.Target>
                                    <Button
                                        rightIcon={<Plus size={16} strokeWidth="3" />}
                                        sx={{ fontWeight: 500 }}

                                        color={"primary"}
                                    >
                                        إضافة صلاحيات
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Item onClick={() => {
                                        setExistingMember(true)
                                        setOpenAddModal(true)
                                    }} >إضافة صلاحيات عضو موجود</Menu.Item>
                                    <Menu.Item onClick={() => setOpenAddModal(true)}>إضافة صلاحيات عضو غير موجود</Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                            : null
                        }

                    </Group>
                </Box>

                <TeamManagementTable
                    list={allMembersSorting}
                    search={searchValue}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <AddPowerModal title="اضافة صلاحيات" opened={openAddModal} existingMember={existingMember} setExistingMember={setExistingMember} id={selectedData} onClose={() => setOpenAddModal(false)} />
            <UpdatePowerModal title="تعديل صلاحيات" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
        </Box>
    );
}