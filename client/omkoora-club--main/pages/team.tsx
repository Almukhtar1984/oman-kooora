import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title, Card, Flex, Avatar, Text} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import CardTeam from "../components/Card/CardTeam";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {
    AddMembersModal,
    AddTeamModal,
    DeleteTeamModal,
    EditTeamModal,
    UpdateAdminMemberModal,
    AddListPlayers,
    ChangeStatusAddPlayerModal,
    ResetTeamPasswordModal
} from "../components/Modal";
import dayjs from "dayjs";
import {useAllAssembly, useAllTeams} from "../graphql";
import useStore from "../store/useStore";
import {ChangeStatusTeamModal} from "../components/Modal/ChangeStatusTeamModal";
import { getImageUrl } from "../lib/helpers/image";

export default function Home() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openAddAdminModal, setOpenAddAdminModal] = useState<boolean>(false);
    const [openEditAdminModal, setOpenEditAdminModal] = useState<boolean>(false);
    
    const [openAddListPlayersModal, setOpenAddListPlayersModal] = useState<boolean>(false);

    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [openChangeStatusAddPlayerModal, setOpenChangeStatusAddPlayerModal] = useState<boolean>(false);
    const [openResetPasswordModal, setOpenResetPasswordModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>({});
    const [allTeams, setAllTeams] = useState<object[]>([]);
    const [allTeamsSorting, setAllTeamsSorting] = useState<object[]>([]);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllTeam, { loading, error, data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTeam({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.teams?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllTeams && "allTeam" in dataAllTeams) {
            setAllTeams([...dataAllTeams.allTeam])
        }
    }, [dataAllTeams])

    useEffect(() => {
        if (allTeams.length >= 0) {
            const filterAllTeams = sortedData(allTeams)

            setAllTeamsSorting([...filterAllTeams])
        }
    }, [allTeams])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllTeams = searchSortedData(allTeams,['name'], value)
        setAllTeamsSorting([...filterAllTeams])
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
                {userData?.person?.clubManagement?.club && (
                    <Card
                        shadow="sm"
                        p="xl"
                        radius="md"
                        withBorder
                        mb="xl"
                        sx={(theme) => ({
                            borderColor: theme.colors.gray[3],
                            backgroundColor: theme.white,
                        })}
                    >
                        <Flex align="center" gap="xl">
                            <Avatar 
                                src={getImageUrl(userData.person.clubManagement.club.logo)} 
                                size={120} 
                                radius={120} 
                                sx={(theme) => ({ border: `2px solid ${theme.colors.gray[2]}` })}
                            />
                            <Stack spacing="xs">
                                <Title order={2} color="#1E3A8A">{userData.person.clubManagement.club.name}</Title>
                                <Text color="dimmed" size="sm">
                                    تاريخ التأسيس: {dayjs(userData.person.clubManagement.club.createdAt).format('YYYY')}
                                </Text>
                            </Stack>
                        </Flex>
                    </Card>
                )}

                <Box mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        {hasPermission("2")
                            ? <Button
                                rightIcon={<Plus size={16} strokeWidth="3" />}
                                sx={{ fontWeight: 500 }}
                                onClick={() => setOpenAddModal(true)}
                                color={"primary"}
                            >
                                إضافة فريق
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <Box mt="20px">
                    <Grid gutter={"xl"} className="grid-4-mobile">
                        {allTeamsSorting?.map((item: any) => (
                            <Col span={12}  xs={6} md={4} lg={3} key={item?.id}>
                                <CardTeam
                                    data={item}
                                    onEditModal={(data) => {
                                        setOpenEditModal(true);
                                        setSelectedData(data!());
                                    }}
                                    onChangeStatusModal={(data) => {
                                        setOpenChangeStatusModal(true);
                                        setSelectedData(data!());
                                    }}
                                    onChangeStatusAddPlayerModal={(data) => {
                                        setOpenChangeStatusAddPlayerModal(true);
                                        setSelectedData(data!());
                                    }}
                                    onDeleteModal={(data) => {
                                        setOpenDeleteModal(true);
                                        setSelectedData(data!());
                                    }}
                                    setOpenAddAdminModal={(data) => {
                                        setOpenAddAdminModal(true);
                                        setSelectedData(data!());
                                    }}

                                    setOpenEditAdminModal={(data) => {
                                        setOpenEditAdminModal(true);
                                        setSelectedData(data!());
                                    }}

                                    setOpenAddListPlayersModal={(data) => {
                                        setOpenAddListPlayersModal(true);
                                        setSelectedData(data!());
                                    }}

                                    setOpenResetPasswordModal={(data) => {
                                        setOpenResetPasswordModal(true);
                                        setSelectedData(data!());
                                    }}

                                    hasPermission={hasPermission}
                                />
                            </Col>
                        ))}
                    </Grid>
                </Box>
            </Container>

            {/* Portal Components */}
            <AddTeamModal title="إضافة فريق" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <EditTeamModal title="تعديل فريق" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteTeamModal title="حذف فريق" opened={openDeleteModal} data={selectedData?.id} onClose={() => setOpenDeleteModal(false)}/>
            <ChangeStatusTeamModal
                title={selectedData?.account_status ? "توقيف فريق" : "تفعيل فريق"}
                opened={openChangeStatusModal}
                data={selectedData}
                onClose={() => setOpenChangeStatusModal(false)}
            />
            <AddMembersModal title="إضافة مدير" opened={openAddAdminModal} id={selectedData?.id} onClose={() => setOpenAddAdminModal(false)}/>
            
            <UpdateAdminMemberModal title="تعديل معلومات المدير" opened={openEditAdminModal} id={selectedData?.person?.member?.id} onClose={() => setOpenEditAdminModal(false)}/>
            <AddListPlayers title="" opened={openAddListPlayersModal} data={selectedData?.id} onClose={() => setOpenAddListPlayersModal(false)}/>
        
            <ChangeStatusAddPlayerModal
                title={selectedData?.enableAddPlayer ? "توقيف اضافة لاعبين" : "تفعيل اضافة لاعبين"}
                opened={openChangeStatusAddPlayerModal}
                data={selectedData}
                onClose={() => setOpenChangeStatusAddPlayerModal(false)}
            />

            <ResetTeamPasswordModal
                title="إعادة تعيين كلمة مرور المدير"
                opened={openResetPasswordModal}
                data={selectedData}
                onClose={() => setOpenResetPasswordModal(false)}
            />
        </Box>
    );
}
