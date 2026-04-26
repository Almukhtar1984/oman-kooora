import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllClubManagement, useAllTeams, useAllActionLogsClub} from "../graphql";
import useStore from "../store/useStore";
import {ClubManagementTable,ActionLogsTable} from "../components/Tables";
import {AddPowerModal, UpdatePowerModal,  } from "../components/Modal";

export default function Powers() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allActionLogsClub, setAllActionLogsClub,] = useState<object[]>([]);
    const [allActionLogsSorting, setAllActionLogsSorting] = useState<object[]>([]);

    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllActionLogsClub, { loading, error, data: dataAllActionLogsClub }] = useAllActionLogsClub();
    
    
    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllActionLogsClub({
                variables: { idClub },
                onCompleted: (data) => {
                    console.log("Query completed successfully:");
                    console.log(data);
                }
            });
    

        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.permissions?.split(","))
        }
    }, [userData])

    useEffect(() => {
        console.log(dataAllActionLogsClub)

        if (dataAllActionLogsClub && "allActionLogsClub" in dataAllActionLogsClub) {
         
            setAllActionLogsClub([...dataAllActionLogsClub.allActionLogsClub])
        }
    }, [dataAllActionLogsClub])

    useEffect(() => {
        console.log("allClubManagement fnish: ",allActionLogsClub)

        if (allActionLogsClub.length >= 0) {
            const filterAllClubManagement = sortedData(allActionLogsClub)

            setAllActionLogsSorting([...filterAllClubManagement])
        }
    }, [allActionLogsClub])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);


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
                <Box mb={20} mt={"20px"}>
                
                </Box>

                <ActionLogsTable
                    list={allActionLogsSorting}
                    search={searchValue}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}

                    hasPermission={hasPermission}
                />
            </Container>

        </Box>
    );
}