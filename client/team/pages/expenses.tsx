import { useTheme } from "@emotion/react";
import {Alert, Box, Button, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {ExternalLink, Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";

import {useAllExpense} from "../graphql";
import useStore from "../store/useStore";
import {ExpenseTable} from "../components/Tables";
import {UpdateExpenseModal, AddExpenseModal, DeleteExpenseModal} from "../components/Modal";
import {useDisclosure} from "@mantine/hooks";

export default function Expenses() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allExpenses, setAllExpenses] = useState<object[]>([]);
    const [allExpensesSorting, setAllExpensesSorting] = useState<object[]>([]);
    const [playersWaiting, setExpensesWaiting] = useState(0);

    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState([]);

    const [getAllExpenses, { loading, error, data: dataAllExpenses }] = useAllExpense();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllExpenses({
                variables: {idTeam}
            })
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.expenses?.split(","))
        }
    }, [userData, getAllExpenses])

    useEffect(() => {
        if (dataAllExpenses && "allExpensesTeam" in dataAllExpenses) {
            setAllExpenses([...dataAllExpenses.allExpensesTeam])
        }
    }, [dataAllExpenses])

    useEffect(() => {
        if (allExpenses.length >= 0) {
            const filterAllExpenses = sortedData(allExpenses)

            setAllExpensesSorting([...filterAllExpenses])
        }

        const filter = allExpenses.filter((item: any) => item?.status === "waiting")

        setExpensesWaiting(filter.length)
    }, [allExpenses])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllExpenses = searchSortedData(allExpenses,['name'], value)
        setAllExpensesSorting([...filterAllExpenses])
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
                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>

                        {hasPermission("2")
                            ? <Button
                                rightIcon={<Plus size={18} />}
                                color={"primary"}
                                onClick={() => setOpenAddModal(true)}
                            >
                                اضافة صادر او وارد
                            </Button>
                            : null
                        }
                    </Group>
                </Box>

                <ExpenseTable
                    list={allExpensesSorting}
                    search={searchValue}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <AddExpenseModal title="اضافة مصروف" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>

            <UpdateExpenseModal title="تعديل مصروف" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteExpenseModal title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)}/>
        </Box>
    );
}
