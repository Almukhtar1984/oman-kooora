import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {AddBlog, ShowBlog, DeleteBlog, UpdateBlog} from "../components/Modal";
import {useAllBlog, } from "../graphql";
import useStore from "../store/useStore";
import CardBlog from "../components/Card/CardBlog";

export default function Blog() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openShowModal, setOpenShowModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [allBlogs, setAllBlogs] = useState<object[]>([]);
    const [allBlogsSorting, setAllBlogsSorting] = useState<object[]>([]);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllBlogs, { loading, error, data: dataAllBlogs }] = useAllBlog();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllBlogs({
                variables: {idTeam}
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            // @ts-ignore
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }
        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.blogs?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllBlogs && "allBlogsTeam" in dataAllBlogs) {
            setAllBlogs([...dataAllBlogs.allBlogsTeam])
        }
    }, [dataAllBlogs])

    useEffect(() => {
        if (allBlogs.length >= 0) {
            const filterAllBlogs = sortedData(allBlogs)

            setAllBlogsSorting([...filterAllBlogs])
        }
    }, [allBlogs])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllBlogs = searchSortedData(allBlogs,['name'], value)
        setAllBlogsSorting([...filterAllBlogs])
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
                                إضافة اخبار
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <Grid>
                    {allBlogsSorting.map((item: any, index) => (
                        <Col key={index} span={4}>
                            <CardBlog
                                data={item}
                                onEditModal={(data) => {
                                    setOpenEditModal(true);
                                    setSelectedData(data!());
                                }}
                                onDeleteModal={(data) => {
                                    setOpenDeleteModal(true);
                                    setSelectedData(data!());
                                }}
                                setOpenShowModal={(data) => {
                                    setOpenShowModal(true);
                                    setSelectedData(data!());
                                }}

                                hasPermission={hasPermission}
                            />
                        </Col>
                    ))}
                </Grid>
            </Container>

            {/* Portal Components */}
            <AddBlog title="اضافة اخبار" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <ShowBlog title="" opened={openShowModal} data={selectedData} onClose={() => setOpenShowModal(false)}/>
            <DeleteBlog title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)}/>

            <UpdateBlog title="تعديل الاخبار" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
        </Box>
    );
}
