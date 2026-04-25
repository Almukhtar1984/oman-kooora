import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, TextInput} from "@mantine/core";
import {Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {useAllRequests} from "../graphql";
import useStore from "../store/useStore";
import {ProposalTable} from "../components/Tables";
import {
    AddComplaintModal,
    AddProposalModal,
    DeleteComplaintModal, DeleteProposalModal,
    UpdateComplaintModal,
    UpdateProposalModal
} from "../components/Modal";
// import {UpdateMembersModal} from "../components/Modal/UpdateMembersModal";

export default function Proposals () {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allRequests, setAllRequests] = useState<object[]>([]);
    const [allRequestsSorting, setAllRequestsSorting] = useState<object[]>([]);

    const [getAllRequests, { loading, error, data: dataAllRequests }] = useAllRequests();

    useEffect(() => {
        if (userData?.person?.player?.id) {
            const idPlayer = userData?.person?.player?.id;
            getAllRequests({
                variables: {idPlayer, type: "proposal"},
                fetchPolicy: "network-only"
            })
        }
    }, [userData, getAllRequests])

    useEffect(() => {
        if (dataAllRequests && "allRequests" in dataAllRequests) {
            setAllRequests([...dataAllRequests.allRequests])
        }
    }, [dataAllRequests])

    useEffect(() => {
        if (allRequests.length >= 0) {
            const filterAllRequests = sortedData(allRequests)

            setAllRequestsSorting([...filterAllRequests])
        }
    }, [allRequests])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllRequests = searchSortedData(allRequests,['name'], value)
        setAllRequestsSorting([...filterAllRequests])
    };

    return (
        <Box>
            <Head>
                <title>طموح</title>
            </Head>
            <Container size={"xl"}>
                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        <Button
                            rightIcon={<Plus size={16} strokeWidth="3" />}
                            sx={{ fontWeight: 500 }}
                            onClick={() => setOpenAddModal(true)}
                            color={"primary"}
                        >
                            إضافة مقترح
                        </Button>
                    </Group>
                </Box>

                <ProposalTable
                    list={allRequestsSorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setSelectedRow={setSelectedData}
                />
            </Container>

            {/* Portal Components */}
            <AddProposalModal title="إضافة إقتراح" opened={openAddModal} onClose={() => setOpenAddModal(false)} />
            <UpdateProposalModal title="تعديل الإقتراح" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)} />
            <DeleteProposalModal opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)} />
        </Box>
    );
}
