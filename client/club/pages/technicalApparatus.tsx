import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Col, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {useAllTeams, useAllTechnicals} from "../graphql";
import useStore from "../store/useStore";
import {TechnicalsTable} from "../components/Tables";
import {ChangeStatusTechnicalsModal, DeleteTechnicalModal, UpdateTechnicalModal} from "../components/Modal";

export default function TechnicalApparatus() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);


    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allTechnicals, setAllTechnicals] = useState<object[]>([]);
    const [allTechnicalsSorting, setAllTechnicalsSorting] = useState<object[]>([]);
    const [newStatus, setNewStatus] = useState("");
    const [technicalsWaiting, setTechnicalsWaiting] = useState(0);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllTechnicals, { loading, error, data: dataAllTechnicals }] = useAllTechnicals();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTechnicals({variables: {idClub}})
            getAllTeam({variables: {idClub}})
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.technicals?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllTechnicals && "allTechnicalApparatusClub" in dataAllTechnicals) {
            setAllTechnicals([...dataAllTechnicals.allTechnicalApparatusClub])
        }
    }, [dataAllTechnicals])

    useEffect(() => {
        if (allTechnicals.length >= 0) {
            const filterAllTechnicals = sortedData(allTechnicals)

            setAllTechnicalsSorting([...filterAllTechnicals])
        }

        const filter = allTechnicals.filter((item: any) => item?.status === "waiting")

        setTechnicalsWaiting(filter.length)
    }, [allTechnicals])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllTechnicals = searchSortedData(
            allTechnicals,
            ['person.first_name', "person.second_name", "person.third_name",
                "person.tribe", "person.phone", "person.card_number",
                "occupation", "classification"],
            value
        )
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

    console.log({openDeleteModal});

    return (
        <Box>
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
                {technicalsWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {technicalsWaiting} اعضو جهاز فني جدد وهم قيد الاتظار يرجى تاكيدهم او رفضهم</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>


                        {hasPermission("6")
                            ? <Menu shadow="md" width={200}>
                                <Menu.Target>
                                    <Button rightIcon={<Printer size={18} />} color={"primary"}>
                                        طباعة قائمة اعضاء الجهاز فني
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>قائمة الفرق</Menu.Label>

                                    {dataAllTeams?.allTeam?.map((item: any) => (
                                        <Menu.Item
                                            key={item?.id}
                                            component={"a"}
                                            href={`https://print.omkooora.com/#/technicals/${item?.id}/team`}
                                            target={"_blank"}
                                        >{item?.name}</Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                            : null
                        }
                    </Group>
                </Box>

                <TechnicalsTable
                    list={allTechnicalsSorting}
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
            <ChangeStatusTechnicalsModal title="تعديل حالة عضو الجهاز فني" opened={openChangeStatusModal} id={selectedData} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>

            <UpdateTechnicalModal title="تعديل عضو الجهاز فني" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)} />
            <DeleteTechnicalModal title="حذف عضو" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
        </Box>
    );
}