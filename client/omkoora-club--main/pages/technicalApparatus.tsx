import { useTheme } from "@emotion/react";
import {ActionIcon, Alert, Box, Button, Col, Container, Group, MantineTheme, Menu, Stack, TextInput, Title} from "@mantine/core";
import {Filter, Lock, Plus, Printer, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import {searchSortedData, sortedData} from "../lib/helpers/sort";
import {AllTechnicals, useAllTeams, useAllTechnicals, useChangeStatusTechnicalApparatusBulk} from "../graphql";
import useStore from "../store/useStore";
import {TechnicalsTable} from "../components/Tables";
import {ChangeStatusTechnicalsModal, DeleteTechnicalModal, UpdateTechnicalModal, ChangeClassificationModal} from "../components/Modal";
import { Select } from "@mantine/core";
import {BulkActionToolbar, BulkStatusConfirmModal} from "../components/BulkSelection";
import {Notyf} from "notyf";

export default function TechnicalApparatus() {
    const userData = useStore((state: any) => state.userData);
    // states
    const theme = useTheme() as MantineTheme;
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openChangeStatusModal, setOpenChangeStatusModal] = useState<boolean>(false);
    const [openChangeClassificationModal, setOpenChangeClassificationModal] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [teamFilter, setTeamFilter] = useState<string | null>(null);


    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState("");
    const [allTechnicals, setAllTechnicals] = useState<object[]>([]);
    const [allTechnicalsSorting, setAllTechnicalsSorting] = useState<object[]>([]);
    const [newStatus, setNewStatus] = useState("");
    const [technicalsWaiting, setTechnicalsWaiting] = useState(0);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [getAllTechnicals, { loading, error, data: dataAllTechnicals }] = useAllTechnicals();
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();
    const [changeStatusBulk, { loading: bulkLoading }] = useChangeStatusTechnicalApparatusBulk();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pageIds, setPageIds] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<null | "accepted" | "rejected">(null);

    const handleToggleSelect = React.useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }, []);
    const handlePageItemsChange = React.useCallback((ids: string[]) => {
        setPageIds(ids);
    }, []);
    const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    const handleToggleSelectPage = (checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        } else {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
        }
    };
    const pendingIds = React.useMemo(
        () => allTechnicalsSorting
            .filter((it: any) => it?.status === "waiting" || it?.status === "waiting_club")
            .map((it: any) => it.id),
        [allTechnicalsSorting]
    );
    const handleSelectAllPending = () => setSelectedIds(pendingIds);
    const handleClearSelection = () => setSelectedIds([]);

    const handleConfirmBulk = (note: string) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!bulkAction || selectedIds.length === 0) return;
        changeStatusBulk({
            variables: { ids: selectedIds, status: bulkAction, note: note || undefined },
            refetchQueries: [AllTechnicals],
            awaitRefetchQueries: true,
        })
            .then((res) => {
                const r = res?.data?.changeStatusTechnicalApparatusBulk;
                notyf.success(`تم ${bulkAction === "accepted" ? "قبول" : "رفض"} ${r?.success ?? 0} من أصل ${r?.total ?? selectedIds.length}`);
                setSelectedIds([]);
                setBulkAction(null);
            })
            .catch((e) => {
                console.log(e);
                notyf.error("حدث خطأ أثناء التحديث الجماعي");
            });
    };

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTechnicals({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
            getAllTeam({
                variables: {idClub},
                fetchPolicy: "network-only"
            })
        }
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role)
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions(permission?.technicals?.split(","))
        }
    }, [userData])

    useEffect(() => {
        if (dataAllTechnicals && "allTechnicalApparatusClub" in dataAllTechnicals) {
            setAllTechnicals([...dataAllTechnicals.allTechnicalApparatusClub])
        }
    }, [dataAllTechnicals])

    useEffect(() => {
        let filtered = sortedData(allTechnicals);

        if (statusFilter) {
            filtered = filtered.filter((item: any) => item?.status === statusFilter);
        }

        if (teamFilter) {
            filtered = filtered.filter((item: any) => item?.team?.name === teamFilter);
        }

        setAllTechnicalsSorting([...filtered])

        const filter = allTechnicals.filter((item: any) => item?.status === "waiting")
        setTechnicalsWaiting(filter.length)
    }, [allTechnicals, statusFilter, teamFilter]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllTechnicals = searchSortedData(
            allTechnicals,
            ['person.first_name', "person.second_name", "person.third_name",
                "person.tribe", "person.phone", "person.card_number",
                "occupation", "classification"],
            value
        )
        setAllTechnicalsSorting([...filterAllTechnicals])
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

    console.log({openDeleteModal});

    return (
        <Box>
            <Head><title>طموح</title></Head>
            <Container size={"xl"}>
                {technicalsWaiting > 0
                    ? <Alert color={"red"} variant="light" style={{border: "1px solid red"}}>يوجد {technicalsWaiting} اعضو جهاز فني جدد وهم قيد الاتظار يرجى تاكيدهم او رفضهم</Alert>
                    : null
                }

                <Box mb={20} mt={"20px"}>
                    <Group position={"apart"}>
                        <Group>
                            <TextInput value={searchValue} icon={<Search color={theme.colors.gray[4]} size={16} />} placeholder="بحث" onChange={handleSearchChange}/>
                            <Menu position={"right-start"} width={200} closeOnItemClick={false}>
                                <Menu.Target>
                                    <ActionIcon>
                                        <Filter size={18} color={"#4b5563"} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>فلترة إضافية</Menu.Label>
                                    <Stack p="xs">
                                        <Select
                                            label="الحالة"
                                            placeholder="اختر الحالة"
                                            clearable
                                            value={statusFilter}
                                            onChange={setStatusFilter}
                                            data={[
                                                { label: 'مقبول', value: 'accepted' },
                                                { label: 'مرفوض', value: 'rejected' },
                                                { label: 'قيد انتظار النادي', value: 'waiting_club' },
                                                { label: 'قيد انتظار الفريق', value: 'waiting' },
                                                { label: 'معاقب', value: 'suspended' },
                                            ]}
                                        />
                                        <Select
                                            label="الفريق"
                                            placeholder="اختر الفريق"
                                            clearable
                                            value={teamFilter}
                                            onChange={setTeamFilter}
                                            data={dataAllTeams?.allTeam?.map((t: any) => ({ label: t.name, value: t.name })) || []}
                                        />
                                    </Stack>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>


                        {hasPermission("6")
                            ? <Menu shadow="md" width={200}>
                                <Menu.Target>
                                    <Button rightIcon={<Printer size={18} />} color={"primary"}>
                                        طباعة قائمة اعضاء الجهاز فني
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>قائمة الفرق</Menu.Label>

                                    {dataAllTeams?.allTeam?.map((item: any) => (
                                        <Menu.Item
                                            key={item?.id}
                                            component={"a"}
                                            href={`https://print.omkooora.com/#/technicals/${item?.id}/team`}
                                            target={"_blank"}
                                        >{item?.name}</Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                            : null
                        }
                    </Group>
                </Box>

                <BulkActionToolbar
                    totalOnPage={pageIds.length}
                    selectedCount={selectedIds.length}
                    waitingCount={pendingIds.length}
                    allOnPageSelected={allOnPageSelected}
                    onToggleSelectPage={handleToggleSelectPage}
                    onSelectAllPending={handleSelectAllPending}
                    onAcceptSelected={() => setBulkAction("accepted")}
                    onRejectSelected={() => setBulkAction("rejected")}
                    onClearSelection={handleClearSelection}
                    loading={bulkLoading}
                    canChangeStatus={hasPermission("5")}
                />

                <TechnicalsTable
                    list={allTechnicalsSorting}
                    search={searchValue}
                    setOpenChangeStatusModal={setOpenChangeStatusModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setSelectedRow={setSelectedData}
                    setNewStatus={setNewStatus}

                    hasPermission={hasPermission}
                    setOpenChangeClassificationModal={setOpenChangeClassificationModal}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onPageItemsChange={handlePageItemsChange}
                    selectionEnabled={hasPermission("5")}
                />
            </Container>

            {/* Portal Components */}
            <ChangeStatusTechnicalsModal title="تعديل حالة عضو الجهاز فني" opened={openChangeStatusModal} id={selectedData} onClose={() => setOpenChangeStatusModal(false)} status={newStatus}/>

            <UpdateTechnicalModal title="تعديل عضو الجهاز فني" opened={openEditModal} id={selectedData} onClose={() => setOpenEditModal(false)} />
            <DeleteTechnicalModal title="حذف عضو" opened={openDeleteModal} id={selectedData} onClose={() => setOpenDeleteModal(false)}/>
            <ChangeClassificationModal
                opened={openChangeClassificationModal}
                onClose={() => setOpenChangeClassificationModal(false)}
                data={selectedData}
                fromType="technical"
                idClub={userData?.person?.clubManagement?.club?.id}
                onSuccess={() => {
                    if (userData?.person?.clubManagement?.club?.id) {
                        getAllTechnicals({variables: {idClub: userData?.person?.clubManagement?.club?.id}})
                    }
                }}
            />

            <BulkStatusConfirmModal
                opened={bulkAction !== null}
                onClose={() => setBulkAction(null)}
                count={selectedIds.length}
                status={bulkAction || "accepted"}
                loading={bulkLoading}
                onConfirm={handleConfirmBulk}
            />
        </Box>
    );
}