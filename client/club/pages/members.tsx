import { useTheme } from "@emotion/react";
import {
    Alert,
    Box,
    Button,
    Col,
    Container,
    Grid,
    Group,
    MantineTheme,
    Menu,
    Stack,
    TextInput,
    Title
} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {useAllMembers, useAllTeams} from "../graphql";
import useStore from "../store/useStore";
import {MembersTable} from "../components/Tables";
import {ChangeStatusMembersModal, DeleteMembersModal, UpdateMemberModal} from "../components/Modal";
import {printUrl} from "../lib/config";

export default function Members() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allMembers, setAllMembers] = useState<object[]>([]);
    const [allMembersSorting, setAllMembersSorting] = useState<object[]>([]);
    const [newStatus, setNewStatus] = useState("");
    const [membersWaiting, setMembersWaiting] = useState(0);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllMembers, { loading, error, data: dataAllMembers }] = useAllMembers();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllMembers({variables: {idClub}})
            getAllTeam({variables: {idClub}})
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.members?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllMembers && "allMembersClub" in dataAllMembers) {
            setAllMembers([...dataAllMembers.allMembersClub])
        }
    }, [dataAllMembers])

    useEffect(() => {
        if (allMembers.length >= 0) {
            const filterAllMembers = sortedData(allMembers)

            setAllMembersSorting([...filterAllMembers])
        }

        const filter = allMembers.filter((item: any) => item?.status === "waiting")

        setMembersWaiting(filter.length)
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
            <Head>
                <title>طموح</title>
            </Head>
            <Container size={"xl"}>
                {membersWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {membersWaiting} اعضو فريق جدد وهم قيد الاتظار يرجى تاكيدهم او رفضهم</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>


                        {hasPermission("6")
                            ? <Menu shadow="md" width={200}>
                                <Menu.Target>
                                        <Button rightIcon={<Printer size={18} />} color={"primary"}>
                                            طباعة قائمة اعضاء الفريق
                                        </Button>
                                        
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>قائمة الفرق</Menu.Label>

                                    {dataAllTeams?.allTeam?.map((item: any) => (
                                        <Menu.Item
                                            key={item?.id}
                                            component={"a"}
                                            href={`${printUrl}/#/members/${item?.id}/team`}
                                            target={"_blank"}
                                        >{item?.name}</Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                            : null
                        }
                    </Group>
                </Box>

                <MembersTable
                    list={allMembersSorting}
                    search={searchValue}
                    setOpenChangeStatusModal={setOpenChangeStatusModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}
                    setNewStatus={setNewStatus}
                    
                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <ChangeStatusMembersModal title="تعديل حالة عضو مجلس الأدارة" opened={openChangeStatusModal} id={selectedData} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>

            <UpdateMemberModal title="تعديل عضو مجلس الأدارة" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteMembersModal title="حذف عضو مجلس الأدارة" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
        </Box>
    );
}
