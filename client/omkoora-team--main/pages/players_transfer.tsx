import { useTheme } from "@emotion/react";
import { Alert, Box, Container, Group, MantineTheme, Text, TextInput } from "@mantine/core";
import { InfoCircle, Search } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";

import { searchSortedData, sortedData } from "../lib/helpers/sort";
import useStore from "../store/useStore";
import { PlayersTableTransfer } from "../components/Tables";
import { useAllTransferTeam } from "../graphql/hooks/players/useAllTransferTeam";

// Read-only tracking of the team's player/technical transfers through the
// approval chain (team → own club → destination club → team). The team does not
// approve — its own club and the destination club do — so this page only shows
// where each request currently stands.
export default function PlayersTransfer() {
    const userData = useStore((state: any) => state.userData);
    const theme = useTheme() as MantineTheme;

    const [searchValue, setSearchValue] = useState<string>("");
    const [allTransfers, setAllTransfers] = useState<object[]>([]);
    const [allTransfersSorting, setAllTransfersSorting] = useState<object[]>([]);

    const idTeam = userData?.person?.member?.team?.id;

    const [getAllTransferTeam, { data }] = useAllTransferTeam();

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    useEffect(() => {
        if (idTeam) {
            getAllTransferTeam({
                variables: { idTeam, transitionType: ["transition"] },
                fetchPolicy: "cache-and-network",
            });
        }
    }, [idTeam]);

    useEffect(() => {
        if (data && "allTransferTeam" in data) {
            setAllTransfers([...data.allTransferTeam]);
        }
    }, [data]);

    useEffect(() => {
        setAllTransfersSorting([...sortedData(allTransfers)]);
    }, [allTransfers]);

    const pending = allTransfers.filter(
        (t: any) => t?.status === "waiting_club_from" || t?.status === "waiting_club_to"
    ).length;

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);
        const filtered = searchSortedData(
            allTransfers,
            [
                "player.person.first_name", "player.person.second_name", "player.person.third_name",
                "player.person.tribe", "player.person.phone", "player.person.card_number",
            ],
            value
        );
        setAllTransfersSorting([...filtered]);
    };

    return (
        <Box>
            <Head><title>انتقالات اللاعبين</title></Head>
            <Container size={"xl"}>
                <Alert color={"blue"} variant="light" icon={<InfoCircle size={18} />} mt={"20px"}>
                    متابعة الانتقالات: يمرّ كل طلب بموافقة <b>نادي اللاعب</b> ثم <b>النادي المستقبِل</b> قبل اكتماله.
                    {pending > 0 ? <Text span> لديك {pending} طلب قيد المراجعة.</Text> : null}
                </Alert>

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

                <PlayersTableTransfer
                    list={allTransfersSorting}
                    search={searchValue}
                    idTeam={idTeam}
                />
            </Container>
        </Box>
    );
}
