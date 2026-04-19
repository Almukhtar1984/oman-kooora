import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {AddTechnicalModal, ChangeStatusTechnicalsModal, DeleteTechnicalModal, UpdateTechnicalModal,} from "../components/Modal";
import {useAllTechnicals} from "../graphql";
import useStore from "../store/useStore";
import {TechnicalsTable} from "../components/Tables";

export default function TechnicalApparatus() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allTechnicals, setAllTechnicals] = useState<object[]>([]);
    const [allTechnicalsSorting, setAllTechnicalsSorting] = useState<object[]>([]);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [newStatus, setNewStatus] = useState("");

    const [getAllTechnicals, { loading, error, data: dataAllTechnicals }] = useAllTechnicals();

    useEffect(() => {
        // const idTeam = "974b1d64-c5e0-4ff9-beac-ed1f85340229";

        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllTechnicals({
                variables: {idTeam}
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.technicals?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllTechnicals && "allTechnicalApparatus" in dataAllTechnicals) {
            setAllTechnicals([...dataAllTechnicals.allTechnicalApparatus])
        }
    }, [dataAllTechnicals])

    useEffect(() => {
        if (allTechnicals.length >= 0) {
            const filterAllTechnicals = sortedData(allTechnicals)

            setAllTechnicalsSorting([...filterAllTechnicals])
        }
    }, [allTechnicals])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllTechnicals = searchSortedData(allTechnicals,['name'], value)
        setAllTechnicalsSorting([...filterAllTechnicals])
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
                                إضافة عضو جهاز فني
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <TechnicalsTable
                    list={allTechnicalsSorting}
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
            <ChangeStatusTechnicalsModal title="تعديل حالة عضو الجهاز فني" opened={openChangeStatusModal} id={selectedData} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>

            <AddTechnicalModal title="إضافة عضو" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <UpdateTechnicalModal title="تعديل عضو" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteTechnicalModal title="حذف عضو" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
        </Box>
    );
}