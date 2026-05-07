import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllPlayers, useAllPlayersClubLoan} from "../graphql";
import useStore from "../store/useStore";
import {PlayersTableLoan, PlayersTableTransfer} from "../components/Tables";
import {ChangeStatusPlayersModal, UpdatePlayersTransferModal} from "../components/Modal";

export default function PlayersLoan() {
    const userData = useStore((state: any) => state.userData);
    const clubId = userData?.person?.clubManagement?.club?.id;
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>(null);
    const [newStatus, setNewStatus] = useState("");
    const [allPlayers, setAllPlayers] = useState<object[]>([]);
    const [allPlayersSorting, setAllPlayersSorting] = useState<object[]>([]);
    const [playersWaiting, setPlayersWaiting] = useState(0);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllPlayersLoan, { loading, error, data: dataAllPlayersLoan }] = useAllPlayersClubLoan();

    useEffect(() => {
        if (clubId) {
            const idClub = clubId;
            getAllPlayersLoan({
                variables: {idClub}
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.loanPlayers?.split(","))
        }
    }, [userData, clubId, getAllPlayersLoan])

    useEffect(() => {
        if (dataAllPlayersLoan && "allPlayersClubLoaned" in dataAllPlayersLoan) {
            setAllPlayers([...dataAllPlayersLoan.allPlayersClubLoaned])
        }
    }, [dataAllPlayersLoan])

    useEffect(() => {
        if (allPlayers.length >= 0) {
            const filterAllPlayers = sortedData(allPlayers)

            setAllPlayersSorting([...filterAllPlayers])
        }

        const filter = allPlayers.filter((item: any) => {
            return (item?.lastLoan?.status == "waiting" && item?.lastLoan?.club_to?.id !== clubId)
        })

        setPlayersWaiting(filter.length)
    }, [allPlayers, clubId])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllPlayers = searchSortedData(allPlayers,['name'], value)
        setAllPlayersSorting([...filterAllPlayers])
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
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
                {playersWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {playersWaiting} انتقلات قيد الاتظار يرجى تاكيدها او رفضها</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"left"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>
                    </Group>
                </Box>

                <PlayersTableLoan
                    list={allPlayersSorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setSelectedRow={setSelectedData}
                    idClub={userData?.person?.clubManagement?.club?.id}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <UpdatePlayersTransferModal title="تعديل حالة لاعب" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
        </Box>
    );
}
