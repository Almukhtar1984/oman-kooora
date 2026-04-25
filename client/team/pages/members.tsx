import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Key, KeyOff, Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {AddMembersModal, ChangeStatusMembersModal, DeleteMembersModal, UpdateMembersModal,} from "../components/Modal";
import {useAllMembers} from "../graphql";
import useStore from "../store/useStore";
import {MembersTable} from "../components/Tables";

export default function Members() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allMembers, setAllMembers] = useState<object[]>([]);
    const [allMembersSorting, setAllMembersSorting] = useState<object[]>([]);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [newStatus, setNewStatus] = useState("");

    const [getAllMembers, { loading, error, data: dataAllMembers }] = useAllMembers();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllMembers({
                variables: {idTeam}
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.members?.split(","))
        }
    }, [userData, getAllMembers])

    useEffect(() => {
        if (dataAllMembers && "allMembers" in dataAllMembers) {
            setAllMembers([...dataAllMembers.allMembers])
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

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllMembers = searchSortedData(allMembers,['name'], value)
        setAllMembersSorting([...filterAllMembers])
    };

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
                                إضافة عضو فريق
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <MembersTable
                    list={allMembersSorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setSelectedRow={setSelectedData}
                    setOpenChangeStatusModal={setOpenChangeStatusModal}

                    setNewStatus={setNewStatus}
                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <ChangeStatusMembersModal title="تعديل حالة عضو مجلس الأدارة" opened={openChangeStatusModal} id={selectedData} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>

            <AddMembersModal title="إضافة عضو مجلس الأدارة" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <UpdateMembersModal title="تعديل عضو مجلس الأدارة" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteMembersModal title="حذف عضو مجلس الأدارة" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
        </Box>
    );
}