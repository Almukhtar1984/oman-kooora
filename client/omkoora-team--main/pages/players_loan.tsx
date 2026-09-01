import { useTheme } from "@emotion/react";
import { Alert, Box, Container, Group, MantineTheme, TextInput } from "@mantine/core";
import { Search } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";

import { searchSortedData, sortedData } from "../lib/helpers/sort";
import useStore from "../store/useStore";
import { PlayersTableLoan } from "../components/Tables";
import {
    RenewLoanedModal,
    ReturningPlayerModal,
    UpdatePlayersTransferModal,
} from "../components/Modal";
import { useAllTransferTeam } from "../graphql/hooks/players/useAllTransferTeam";

export default function PlayersLoan() {
    const userData = useStore((state: any) => state.userData);
    const theme = useTheme() as MantineTheme;

    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openRenewModal, setOpenRenewModal] = useState<boolean>(false);
    const [openReturningModal, setOpenReturningModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>(null);
    const [allLoans, setAllLoans] = useState<object[]>([]);
    const [allLoansSorting, setAllLoansSorting] = useState<object[]>([]);
    const [loansWaiting, setLoansWaiting] = useState(0);

    const idTeam = userData?.person?.member?.team?.id;

    const [getAllTransferTeam, { data: dataAllTransferTeam }] = useAllTransferTeam();

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    useEffect(() => {
        if (idTeam) {
            getAllTransferTeam({
                variables: { idTeam, transitionType: ["loan", "returning"] },
                fetchPolicy: "cache-and-network",
            });
        }
    }, [idTeam]);

    useEffect(() => {
        if (dataAllTransferTeam && "allTransferTeam" in dataAllTransferTeam) {
            setAllLoans([...dataAllTransferTeam.allTransferTeam]);
        }
    }, [dataAllTransferTeam]);

    useEffect(() => {
        setAllLoansSorting([...sortedData(allLoans)]);

        // Pending incoming requests that THIS team must accept or reject.
        const waiting = allLoans.filter(
            (item: any) => item?.status === "waiting" && item?.team_to?.id === idTeam
        );
        setLoansWaiting(waiting.length);
    }, [allLoans, idTeam]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filtered = searchSortedData(
            allLoans,
            [
                "player.person.first_name", "player.person.second_name", "player.person.third_name",
                "player.person.tribe", "player.person.phone", "player.person.card_number",
            ],
            value
        );
        setAllLoansSorting([...filtered]);
    };

    return (
        <Box>
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
                {loansWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{ border: "1px solid red" }}>
                        يوجد {loansWaiting} طلب إعارة قيد الانتظار يرجى قبوله أو رفضه
                    </Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"left"}>
                        <TextInput
                            value={searchValue}
                            icon={<Search color={theme.colors.gray[4]} size={16} />}
                            placeholder="بحث"
                            onChange={handleSearchChange}
                        />
                    </Group>
                </Box>

                <PlayersTableLoan
                    list={allLoansSorting}
                    search={searchValue}
                    setOpenReturningModal={setOpenReturningModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenRenewModal={setOpenRenewModal}
                    setSelectedRow={setSelectedData}
                    idTeam={idTeam}
                />
            </Container>

            {/* Accept / reject an incoming loan request */}
            <UpdatePlayersTransferModal
                title="تأكيد الإعارة"
                opened={openEditModal}
                data={selectedData}
                onClose={() => setOpenEditModal(false)}
            />
            <RenewLoanedModal
                title="تجديد عقد الإعارة"
                opened={openRenewModal}
                data={selectedData}
                onClose={() => setOpenRenewModal(false)}
            />
            <ReturningPlayerModal
                title="رجوع اللاعب إلى فريقه"
                opened={openReturningModal}
                data={selectedData}
                onClose={() => setOpenReturningModal(false)}
            />
        </Box>
    );
}
