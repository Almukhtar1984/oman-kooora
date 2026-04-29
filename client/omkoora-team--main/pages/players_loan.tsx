import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Col, Container, Grid, Group, MantineTheme, TextInput} from "@mantine/core";
import {Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllPlayers} from "../graphql";
import useStore from "../store/useStore";
// import {PlayersTableLoan, PlayersTableTransfer} from "../components/Tables";
// import {
//     RenewLoanedModal,
//     ReturningPlayerModal,
//     UpdatePlayersModal,
//     UpdatePlayersTransferModal
// } from "../components/Modal";
// import {useAllTransferTeam} from "../graphql/hooks/players/useAllTransferTeam";

export default function PlayersLoan() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    /*const [openRenewModal, setOpenRenewModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openReturningModal, setOpenReturningModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>(null);
    const [newStatus, setNewStatus] = useState("");
    const [allPlayers, setAllPlayers] = useState<object[]>([]);
    const [allPlayersSorting, setAllPlayersSorting] = useState<object[]>([]);
    const [playersWaiting, setPlayersWaiting] = useState(0);

    const [getAllTransferTeam, { loading, error, data: dataAllTransferTeam }] = useAllTransferTeam();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id;
            getAllTransferTeam({
                variables: {idTeam, transitionType: ["loan", "returning"]}
            })
        }
    }, [userData])

    useEffect(() => {
        if (dataAllTransferTeam && "allTransferTeam" in dataAllTransferTeam) {
            setAllPlayers([...dataAllTransferTeam.allTransferTeam])
        }
    }, [dataAllTransferTeam])

    useEffect(() => {
        if (allPlayers.length >= 0) {
            const filterAllPlayers = sortedData(allPlayers)

            setAllPlayersSorting([...filterAllPlayers])
        }

        const idTeam = userData?.person?.member?.team?.id;
        const filter = allPlayers.filter((item: any) => ["waiting_club_1", "waiting_team"].includes(item?.status) && item?.team_to?.id === idTeam)

        setPlayersWaiting(filter.length)
    }, [allPlayers])*/

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    /*const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllPlayers = searchSortedData(
            allPlayers,
            [
                'player.person.first_name', "player.person.second_name", "player.person.third_name",
                "player.person.tribe", "player.person.phone", "player.person.card_number"
            ],
            value
        )
        setAllPlayersSorting([...filterAllPlayers])
    };*/

    return (
        <Box>
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
                {/*{playersWaiting > 0*/}
                {/*    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {playersWaiting} انتقلات قيد الاتظار يرجى تاكيدها او رفضها</Alert>*/}
                {/*    : null*/}
                {/*}*/}

                {/*<Box mb={20} mt={"20px"}>*/}
                {/*    <Group position={"left"}>*/}
                {/*        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>*/}

                {/*        /!*<Button*!/*/}
                {/*        /!*    rightIcon={<Plus size={16} strokeWidth="3" />}*!/*/}
                {/*        /!*    sx={{ fontWeight: 500 }}*!/*/}
                {/*        /!*    onClick={() => setOpenAddModal(true)}*!/*/}
                {/*        /!*    color={"primary"}*!/*/}
                {/*        /!*>*!/*/}
                {/*        /!*    إضافة لاعب*!/*/}
                {/*        /!*</Button>*!/*/}
                {/*    </Group>*/}
                {/*</Box>*/}

                {/*<PlayersTableLoan*/}
                {/*    list={allPlayersSorting}*/}
                {/*    search={searchValue}*/}
                {/*    setOpenReturningModal={setOpenReturningModal}*/}
                {/*    setOpenEditModal={setOpenEditModal}*/}
                {/*    setOpenRenewModal={setOpenRenewModal}*/}
                {/*    setSelectedRow={setSelectedData}*/}
                {/*    idTeam={userData?.person?.member?.team?.id}*/}
                {/*/>*/}
            </Container>

            {/* Portal Components */}
            {/*<UpdatePlayersTransferModal title="تعديل حالة لاعب" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>*/}
            {/*<RenewLoanedModal title="تجديد عقد الاعارة" opened={openRenewModal} data={selectedData} onClose={() => setOpenRenewModal(false)}/>*/}
            {/*<ReturningPlayerModal title="" opened={openReturningModal} data={selectedData} onClose={() => setOpenReturningModal(false)}/>*/}
        </Box>
    );
}