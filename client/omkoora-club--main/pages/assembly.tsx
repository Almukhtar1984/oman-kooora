import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import dayjs from "dayjs";
import {searchSortedData} from "../lib/helpers/sort";
import { exportToExcel } from "../lib/helpers/export";
import { DatePickerInput } from "@mantine/dates";
import { Calendar, Filter, Download } from "tabler-icons-react";

import {useAllAssembly} from "../graphql";
import useStore from "../store/useStore";
import {AssemblyTable} from "../components/Tables";
import {
    AddAssemblyModal,
    DeleteAssemblyModal,
    RenewAssemblyModal,
    SearchAssemblyModal,
    UpdateAssemblyModal,
    ShowAssemblyTeamModal
} from "../components/Modal";

export default function Assembly() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openRenewModal, setOpenRenewModal] = useState<boolean>(false);
    const [openSearchModal, setOpenSearchModal] = useState<boolean>(false);
    const [openShowAssemblyTeam, setOpenShowAssemblyTeam] = useState<boolean>(false);

    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [allAssembly, setAllAssembly] = useState<any[]>([]);
    const [allAssemblySorting, setAllAssemblySorting] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllAssembly, { loading, error, data: dataAllAssembly }] = useAllAssembly();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllAssembly({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.assembly?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllAssembly && "allAssemblyClub" in dataAllAssembly) {
            setAllAssembly([...dataAllAssembly.allAssemblyClub])
        }
    }, [dataAllAssembly])

    useEffect(() => {
        let filtered = [...allAssembly];

        // 1. Search Filter
        if (searchValue) {
            filtered = searchSortedData(filtered, ['first_name', 'second_name', 'third_name', 'tribe', 'card_number'], searchValue);
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((item: any) => {
                const year = dayjs(item?.subscription_date).format("YYYY");
                const date1 = new Date(`${parseInt(year) + 1}-01-01`);
                const date2 = new Date();
                const isExpired = date2 >= date1;
                return statusFilter === "active" ? !isExpired : isExpired;
            });
        }

        // 3. Date Range Filter (Subscription Date)
        if (dateFrom || dateTo) {
            filtered = filtered.filter((item: any) => {
                const subDate = dayjs(item?.subscription_date);
                if (dateFrom && subDate.isBefore(dayjs(dateFrom), 'day')) return false;
                if (dateTo && subDate.isAfter(dayjs(dateTo), 'day')) return false;
                return true;
            });
        }

        // 4. Sort
        filtered.sort((a: any, b: any) => {
            const dateA = dayjs(a.membership_date || a.createdAt);
            const dateB = dayjs(b.membership_date || b.createdAt);
            return sortOrder === "desc" 
                ? (dateB.isAfter(dateA) ? 1 : -1) 
                : (dateA.isAfter(dateB) ? 1 : -1);
        });

        setAllAssemblySorting([...filtered]);
    }, [allAssembly, searchValue, statusFilter, sortOrder, dateFrom, dateTo]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.currentTarget.value);
    };

    const handleExport = () => {
        exportToExcel(allAssemblySorting, `General_Assembly_${dayjs().format('YYYY-MM-DD')}`);
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
                    <Stack spacing="md">
                        <Group position={"apart"}>
                            <Group spacing="xs">
                                <TextInput 
                                    value={searchValue} 
                                    icon={<Search color={theme.colors.gray[4]} size={16} />} 
                                    placeholder="البحث بالاسم أو الرقم المدني" 
                                    onChange={handleSearchChange}
                                    sx={{ width: 250 }}
                                />
                                
                                <Menu shadow="md" width={300} position="bottom-start" closeOnItemClick={false}>
                                    <Menu.Target>
                                        <Button variant="outline" color="gray" leftIcon={<Filter size={16} />}>
                                            الفلترة والترتيب
                                        </Button>
                                    </Menu.Target>
                                    <Menu.Dropdown p="md">
                                        <Stack spacing="sm">
                                            <Menu.Label>الحالة</Menu.Label>
                                            <Group grow>
                                                <Button size="xs" variant={statusFilter === 'all' ? 'filled' : 'outline'} onClick={() => setStatusFilter('all')}>الكل</Button>
                                                <Button size="xs" variant={statusFilter === 'active' ? 'filled' : 'outline'} onClick={() => setStatusFilter('active')} color="teal">يعمل</Button>
                                                <Button size="xs" variant={statusFilter === 'expired' ? 'filled' : 'outline'} onClick={() => setStatusFilter('expired')} color="red">منتهي</Button>
                                            </Group>

                                            <Menu.Divider />
                                            <Menu.Label>تاريخ الاشتراك</Menu.Label>
                                            <Group grow>
                                                <DatePickerInput
                                                    clearable
                                                    placeholder="من"
                                                    value={dateFrom}
                                                    onChange={setDateFrom}
                                                    icon={<Calendar size={16} />}
                                                    size="xs"
                                                />
                                                <DatePickerInput
                                                    clearable
                                                    placeholder="إلى"
                                                    value={dateTo}
                                                    onChange={setDateTo}
                                                    icon={<Calendar size={16} />}
                                                    size="xs"
                                                />
                                            </Group>

                                            <Menu.Divider />
                                            <Menu.Label>الترتيب حسب تاريخ العضوية</Menu.Label>
                                            <Group grow>
                                                <Button size="xs" variant={sortOrder === 'desc' ? 'filled' : 'outline'} onClick={() => setSortOrder('desc')}>الأحدث</Button>
                                                <Button size="xs" variant={sortOrder === 'asc' ? 'filled' : 'outline'} onClick={() => setSortOrder('asc')}>الأقدم</Button>
                                            </Group>
                                        </Stack>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>

                            <Group position={"right"}>
                                <Button
                                    leftIcon={<Download size={18} />}
                                    variant="outline"
                                    color="primary"
                                    onClick={handleExport}
                                    disabled={allAssemblySorting.length === 0}
                                >
                                    تصدير إكسل
                                </Button>

                                {hasPermission("7")
                                    ? <Button
                                        rightIcon={<Search size={16} strokeWidth="3" />}
                                        sx={{ fontWeight: 500 }}
                                        onClick={() => setOpenShowAssemblyTeam(true)}
                                        color={"primary"}
                                    >
                                        عرض الجمعية العمومية لفريق
                                    </Button>
                                    : null
                                }

                                {hasPermission("2")
                                    ? <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <Button
                                                rightIcon={<Plus size={16} strokeWidth="3" />}
                                                sx={{ fontWeight: 500 }}
                                                color={"primary"}
                                            >
                                                إضافة عضو للجمعية
                                            </Button>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item onClick={() => setOpenAddModal(true)}>إضافة عضو غير موجود</Menu.Item>
                                            <Menu.Item onClick={() => setOpenSearchModal(true)} >إضافة عضو موجود</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                    : null
                                }
                            </Group>
                        </Group>
                    </Stack>
                </Box>

                <AssemblyTable
                    list={allAssemblySorting}
                    search={searchValue}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenRenewModal={setOpenRenewModal}
                    setSelectedRow={setSelectedData}
                    setNewStatus={setNewStatus}

                    hasPermission={hasPermission}
                />
            </Container>

            {/* Portal Components */}
            <SearchAssemblyModal
                title="البحث عن عضو"
                setOpenAddModal={setOpenAddModal}
                setSelectedData={setSelectedData}
                opened={openSearchModal}
                onClose={() => setOpenSearchModal(false)}
            />

            <AddAssemblyModal title="إضافة عضو للجمعية" setSelectedData={setSelectedData} data={selectedData} opened={openAddModal} onClose={() => setOpenAddModal(false)} />
            <UpdateAssemblyModal title="تعديل معلومات العضو" data={selectedData} opened={openEditModal} onClose={() => setOpenEditModal(false)} />
            <DeleteAssemblyModal title="" data={selectedData} opened={openDeleteModal} onClose={() => setOpenDeleteModal(false)} />
            <RenewAssemblyModal title="تجديد اشتراك العضو" data={selectedData} opened={openRenewModal} onClose={() => setOpenRenewModal(false)} />

            <ShowAssemblyTeamModal title="الجمعية العمومية للفريق" opened={openShowAssemblyTeam} onClose={() => setOpenShowAssemblyTeam(false)} hasPermission={hasPermission} />
        </Box>
    );
}