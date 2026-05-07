import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {AddForm, DeleteForm, UpdateForm} from "../components/Modal";
import {useAllForm, } from "../graphql";
import useStore from "../store/useStore";
import CardForm from "../components/Card/CardForm";

export default function Forms() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [allForms, setAllForms] = useState<object[]>([]);
    const [allFormsSorting, setAllFormsSorting] = useState<object[]>([]);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllForms, { loading, error, data: dataAllForms }] = useAllForm();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllForms({
                variables: {idClub}
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.forms?.split(","))
        }
    }, [userData, getAllForms])

    useEffect(() => {
        if (dataAllForms && "allForms" in dataAllForms) {
            setAllForms([...dataAllForms.allForms])
        }
    }, [dataAllForms])

    useEffect(() => {
        if (allForms.length >= 0) {
            const filterAllForms = sortedData(allForms)

            setAllFormsSorting([...filterAllForms])
        }
    }, [allForms])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllForms = searchSortedData(allForms,['name'], value)
        setAllFormsSorting([...filterAllForms])
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
                                إضافة استمارة
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <Grid>
                    {allFormsSorting.map((item: any, index) => (
                        <Col key={index} span={4}>
                            <CardForm
                                data={item}
                                onEditModal={(data) => {
                                    setOpenEditModal(true);
                                    setSelectedData(data!());
                                }}
                                onDeleteModal={(data) => {
                                    setOpenDeleteModal(true);
                                    setSelectedData(data!());
                                }}

                                hasPermission={hasPermission}
                            />
                        </Col>
                    ))}
                </Grid>
            </Container>

            {/* Portal Components */}
            <AddForm title="اضافة استمارة" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <DeleteForm title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)}/>

            <UpdateForm title="تعديل الاستمارة" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
        </Box>
    );
}
