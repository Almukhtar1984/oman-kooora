import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllAssembly} from "../graphql";
import useStore from "../store/useStore";
import {AssemblyTable} from "../components/Tables";
import {
    AddAssemblyModal,
    DeleteAssemblyModal,
    RenewAssemblyModal,
    SearchAssemblyModal,
    UpdateAssemblyModal,
    ShowAssemblyTeamModal
} from "../components/Modal";

export default function Assembly() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openRenewModal, setOpenRenewModal] = useState<boolean>(false);
    const [openSearchModal, setOpenSearchModal] = useState<boolean>(false);
    const [openShowAssemblyTeam, setOpenShowAssemblyTeam] = useState<boolean>(false);

    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [allAssembly, setAllAssembly] = useState<object[]>([]);
    const [allAssemblySorting, setAllAssemblySorting] = useState<object[]>([]);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllAssembly, { loading, error, data: dataAllAssembly }] = useAllAssembly();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllAssembly({
                variables: {idClub}
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.assembly?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllAssembly && "allAssemblyClub" in dataAllAssembly) {
            setAllAssembly([...dataAllAssembly.allAssemblyClub])
        }
    }, [dataAllAssembly])

    useEffect(() => {
        if (allAssembly.length >= 0) {
            const filterAllAssembly = sortedData(allAssembly)

            setAllAssemblySorting([...filterAllAssembly])
        }
    }, [allAssembly])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllAssembly = searchSortedData(allAssembly,['name'], value)
        setAllAssemblySorting([...filterAllAssembly])
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

                        <Group position={"right"}>
                            {hasPermission("7")
                                ? <Button
                                    rightIcon={<Search size={16} strokeWidth="3" />}
                                    sx={{ fontWeight: 500 }}
                                    onClick={() => setOpenShowAssemblyTeam(true)}
                                    color={"primary"}
                                >
                                    عرض الجمعية العمومية لفريق
                                </Button>
                                : null
                            }

                            {hasPermission("2")
                                ? <Menu shadow="md" width={200}>
                                    <Menu.Target>
                                        <Button
                                            rightIcon={<Plus size={16} strokeWidth="3" />}
                                            sx={{ fontWeight: 500 }}

                                            color={"primary"}
                                        >
                                            إضافة عضو للجمعية
                                        </Button>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        <Menu.Item onClick={() => setOpenAddModal(true)}>إضافة عضو غير موجود</Menu.Item>
                                        <Menu.Item onClick={() => setOpenSearchModal(true)} >إضافة عضو موجود</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                                : null
                            }

                        </Group>
                    </Group>
                </Box>

                <AssemblyTable
                    list={allAssemblySorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenRenewModal={setOpenRenewModal}
                    setSelectedRow={setSelectedData}
                    setNewStatus={setNewStatus}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <SearchAssemblyModal
                title="البحث عن عضو"
                setOpenAddModal={setOpenAddModal}
                setSelectedData={setSelectedData}
                opened={openSearchModal}
                onClose={() => setOpenSearchModal(false)}
            />

            <AddAssemblyModal title="إضافة عضو للجمعية" setSelectedData={setSelectedData} data={selectedData} opened={openAddModal} onClose={() => setOpenAddModal(false)} />
            <UpdateAssemblyModal title="تعديل معلومات العضو" data={selectedData} opened={openEditModal} onClose={() => setOpenEditModal(false)} />
            <DeleteAssemblyModal title="" data={selectedData} opened={openDeleteModal} onClose={() => setOpenDeleteModal(false)} />
            <RenewAssemblyModal title="تجديد اشتراك العضو" data={selectedData} opened={openRenewModal} onClose={() => setOpenRenewModal(false)} />

            <ShowAssemblyTeamModal title="الجمعية العمومية للفريق" opened={openShowAssemblyTeam} onClose={() => setOpenShowAssemblyTeam(false)} hasPermission={hasPermission} />
        </Box>
    );
}