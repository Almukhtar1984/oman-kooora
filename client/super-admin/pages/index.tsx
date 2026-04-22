import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, TextInput} from "@mantine/core";
import {IconPlus, IconSearch,} from "@tabler/icons";
import Head from "next/head";
import React, { useEffect } from "react";
import CardClub from "../components/Card/CardClub";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {
    AddClubModal,
    AddMembersModal,
    DeleteClubModal,
    EditClubModal,
    UpdateAdminMembersModal
} from "../components/Modal";
import {useAllClubs} from "../graphql";
import useStore from "../store/useStore";
import {ChangeStatusClubModal} from "../components/Modal/ChangeStatusClubModal";

export default function Home() {
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openAddAdminModal, setOpenAddAdminModal] = useState<boolean>(false);
    const [openEditAdminModal, setOpenEditAdminModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>({});
    const [allClubs, setAllClubs] = useState<object[]>([]);
    const [allClubsSorting, setAllClubsSorting] = useState<object[]>([]);

    const { loading, error, data: dataAllClubs } = useAllClubs();

    useEffect(() => {
        if (dataAllClubs && "allClub" in dataAllClubs) {
            setAllClubs([...dataAllClubs.allClub])
        }
    }, [dataAllClubs])

    useEffect(() => {
        if (allClubs.length > 0) {
            const filterAllClubs = sortedData(allClubs)

            setAllClubsSorting([...filterAllClubs])
        }
    }, [allClubs])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllClubs = searchSortedData(allClubs,['name'], value)
        setAllClubsSorting([...filterAllClubs])
    };

    return (
        <Box>
            <Head>
                <title>طموح</title>
            </Head>
            <Container size={"xl"}>
                <Box mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<IconSearch color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        <Button
                            rightIcon={<IconPlus size={16} strokeWidth="3" />}
                            sx={{ fontWeight: 500 }}
                            onClick={() => setOpenAddModal(true)}
                            color={"primary"}
                        >
                            إضافة نادي
                        </Button>
                    </Group>
                </Box>

                <Box mt="20px">
                    <Grid gutter={"xl"}>
                        {allClubsSorting?.map((item: any) => (
                            <Col span={3} key={item?.id}>
                                <CardClub
                                    data={item}
                                    onEditModal={(data) => {
                                        setOpenEditModal(true);
                                        setSelectedData(data!());
                                    }}
                                    onChangeStatusModal={(data) => {
                                        setOpenChangeStatusModal(true);
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
                                />
                            </Col>
                        ))}
                    </Grid>
                </Box>
            </Container>

            {/* Portal Components */}
            <AddClubModal title="إضافة نادي" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <EditClubModal title="تعديل نادي" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteClubModal title="حذف نادي" opened={openDeleteModal} data={selectedData?.id} onClose={() => setOpenDeleteModal(false)}/>
            <ChangeStatusClubModal
                title={selectedData?.account_status ? "توقيف النادي" : "تفعيل النادي"}
                opened={openChangeStatusModal}
                data={selectedData}
                onClose={() => setOpenChangeStatusModal(false)}
            />
            <AddMembersModal title="إضافة مدير" opened={openAddAdminModal} id={selectedData?.id} onClose={() => setOpenAddAdminModal(false)}/>

            <UpdateAdminMembersModal title="تعديل معلومات المدير" opened={openEditAdminModal} id={selectedData?.person?.clubManagement?.id} onClose={() => setOpenEditAdminModal(false)}/>
        </Box>
    );
}
