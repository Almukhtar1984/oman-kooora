import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {useAllRequests} from "../graphql";
import useStore from "../store/useStore";
import {RequestsTable} from "../components/Tables";
import {UpdateRequestStatusModal} from "../components/Modal";

export default function Requests() {
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
    const [requestsWaiting, setRequestsWaiting] = useState(0);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [getAllRequests, { loading, error, data: dataAllRequests }] = useAllRequests();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id;
            getAllRequests({
                variables: {idTeam},
                fetchPolicy: "network-only"
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.complaints?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllRequests && "allRequestsTeam" in dataAllRequests) {
            setAllRequests([...dataAllRequests.allRequestsTeam])
        }
    }, [dataAllRequests])

    useEffect(() => {
        if (allRequests.length >= 0) {
            const filterAllRequests = sortedData(allRequests)

            setAllRequestsSorting([...filterAllRequests])
        }

        const filter = allRequests.filter((item: any) => item?.status === "waiting")

        setRequestsWaiting(filter.length)
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
                {requestsWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {requestsWaiting} شكاوى قيد الاتظار يرجى تاكيدها او رفضها</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>
                    </Group>
                </Box>

                <RequestsTable
                    list={allRequestsSorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setSelectedRow={setSelectedData}
                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}

            <UpdateRequestStatusModal title="تعديل حالة الطلب" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
        </Box>
    );
}