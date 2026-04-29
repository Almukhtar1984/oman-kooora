import { useTheme } from "@emotion/react";
import { Box, Button, Container, Group, MantineTheme, Stack, TextInput, Title, Menu, Table,Text,ActionIcon } from "@mantine/core";
import { Lock, Plus, Search } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { searchSortedData, sortedData } from "../lib/helpers/sort";
import { useAllExpense, useExpenseSummary } from "../graphql";  // Import the new hook
import useStore from "../store/useStore";
import { ExpenseTable } from "../components/Tables";
import { UpdateExpenseModal, AddExpenseModal, DeleteExpenseModal } from "../components/Modal";
import { useDisclosure } from "@mantine/hooks";
import { PaymentHandler } from "../thawani/index";
import {Filter,Calendar,Refresh} from "tabler-icons-react";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";
export default function Expenses() {
    const userData = useStore((state: any) => state.userData);
    const theme = useTheme() as MantineTheme;

    // states
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allExpenses, setAllExpenses] = useState<object[]>([]);
    const [allExpensesSorting, setAllExpensesSorting] = useState<object[]>([]);
    const [playersWaiting, setExpensesWaiting] = useState(0);
    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState<string[]>([]);
    const [visible, { open, close }] = useDisclosure(false);

    const [getAllExpenses, { loading, error, data: dataAllExpenses }] = useAllExpense();
    const [getExpenseSummary, { data: dataExpenseSummary }] = useExpenseSummary(); // Hook for expense summary
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const resetDateFilter = () => {
        setFromDate(null);
        setToDate(null);
        if (allExpenses.length >= 0) {
            const filterAllExpenses = sortedData(allExpenses);
            setAllExpensesSorting([...filterAllExpenses]);
        } // Reset table data
    };
    useEffect(() => {
                if (!fromDate && !toDate) {
                    setAllExpensesSorting([...allExpensesSorting]);
                    return;
                }
    
                const filteredList = allExpenses.filter((item: any) => { 
                    const createdAt = dayjs(item.createdAt);
                    const fromCondition = fromDate ? createdAt.isAfter(dayjs(fromDate).subtract(1, 'day')) : true;
                    const toCondition = toDate ? createdAt.isBefore(dayjs(toDate).add(1, 'day')) : true;
                    return fromCondition && toCondition;
                });
    
                setAllExpensesSorting(filteredList);
            }, [fromDate, toDate, allExpenses]);
    
    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id;
            getAllExpenses({
                variables: { idTeam }
            });
            getExpenseSummary({ variables: { idTeam } }); // Fetch expense summary
        }

        if (userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2");
        }

        if (userData?.permission) {
            setPermissions(userData.permission.expenses?.split(","));
        }
    }, [userData]);

    useEffect(() => {
        if (dataAllExpenses?.allExpensesTeam) {
            setAllExpenses([...dataAllExpenses.allExpensesTeam]);
        }
    }, [dataAllExpenses]);

    useEffect(() => {
        if (allExpenses.length >= 0) {
            const filterAllExpenses = sortedData(allExpenses);
            setAllExpensesSorting([...filterAllExpenses]);
        }

        const filter = allExpenses.filter((item: any) => item?.status === "waiting");
        setExpensesWaiting(filter.length);
    }, [allExpenses]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllExpenses = searchSortedData(allExpenses, ['name'], value);
        setAllExpensesSorting([...filterAllExpenses]);
    };

    const hasPermission = (permission: string) => {
        if (role === "1") {
            return true;
        } else {
            return permissions.includes(permission);
        }
    };

    if (!hasPermission("1")) {
        return (
            <Box>
                <Head>
                    <title>طموح</title>
                </Head>
                <Container size={"xl"}>
                    <Stack justify={"center"} align={"center"} h={"calc(100vh - 200px)"}>
                        <Lock color={theme.colors.gray[4]} size={100} strokeWidth={1.5} />
                        <Title size={"h5"} color={theme.colors.gray[5]}>ليس لديك الاذن بإكتشاف محتوى الصفحة</Title>
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
        {/* Search Input */}
        <TextInput 
            value={searchValue} 
            icon={<Search color={theme.colors.gray[4]} size={16} />} 
            placeholder="بحث" 
            onChange={handleSearchChange} 
        />

        <Group>
            {/* Payment Handler */}
            <PaymentHandler
                Amount={22}
                idTeam={userData?.person?.member?.team?.id}
                clientReferenceId={"dsdsds"}
                customerName={"paymentProps.customerName"}
                productsName={"paymentProps.productsName"}
                unitAmount={2}
                quantity={2}
                orderId={11}
            />

            {/* Add Expense Button */}
            {hasPermission("2") && (
                <Button
                    rightIcon={<Plus size={18} />}
                    color={"primary"}
                    onClick={() => setOpenAddModal(true)}
                >
                    اضافة صادر او وارد
                </Button>
            )}

            {/* Date Filter Component */}
            <Group position={"apart"} noWrap={true} p={10}>
                <Text>تاريخ الإنشاء</Text>
                <Menu position={"bottom-end"} width={220} closeOnItemClick={false}>
                    <Menu.Target>
                        <ActionIcon>
                            <Filter/>
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown p={5}>
                        {/* Date Range Inputs */}
                        <DateInput
                            label="من"
                            placeholder="من"
                            valueFormat="MM/DD/YYYY"
                            icon={<Calendar size={16} />}
                            value={fromDate}
                            onChange={setFromDate}
                            clearable
                            p={5}
                        />
                        <DateInput
                            label="إلى"
                            placeholder="إلى"
                            valueFormat="MM/DD/YYYY"
                            icon={<Calendar size={16} />}
                            value={toDate}
                            onChange={setToDate}
                            clearable
                            p={5}
                        />

                        {/* Reset Button */}
                        <Button
                            leftIcon={<Refresh size={16} />}
                            fullWidth
                            mt="sm"
                            onClick={resetDateFilter}
                        >
                            إعادة تعيين
                        </Button>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Group>
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

                {/* Expense Summary Table */}
                {dataExpenseSummary && (
                    <Box mt={40}>
                        <Title size={"h5"}>ملخص المصاريف</Title>
                        <Table mt={20}>
                            <thead>
                                <tr>
                                    <th>الإيرادات</th>
                                    <th>النفقات</th>
                                    <th>الصافي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{dataExpenseSummary?.expenseSummary?.profits}</td>
                                    <td>{dataExpenseSummary?.expenseSummary?.expenses}</td>
                                    <td>{dataExpenseSummary?.expenseSummary?.net}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </Box>
                )}
            </Container>

            
            {/* Portal Components */}
            <AddExpenseModal title="اضافة مصروف" opened={openAddModal} onClose={() => setOpenAddModal(false)} />
            <UpdateExpenseModal title="تعديل مصروف" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)} />
            <DeleteExpenseModal title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)} />
        </Box>
    );
}
