import * as React from 'react';
import { usePagination } from '@table-library/react-table-library/pagination';
import { ActionIcon, Badge, Checkbox, Group, Menu, Pagination, Select, Stack, Text, TextInput, Grid, Col, Box } from '@mantine/core';
import { Filter } from "tabler-icons-react";
import { useEffect, useState } from "react";
import { searchSortedData } from "../../lib/helpers/sort";
import dayjs from "dayjs";
import { IconDatabaseOff } from '@tabler/icons-react';
import { PlayerCard1 } from '../Card/PlayerCard';
import { PlayerModel } from '../Modal/PlayerModel';

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
    setSelectedRow: (data: any) => void;
    setNewStatus?: (status: string) => void;
    openDrawer: () => void;
    setSelectedDrawer?: (data: any) => void;
    setOpenTransferModal?: (open: boolean) => void;
    setOpenLoanModal?: (open: boolean) => void;
    setOpenVerifyIdentityModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
    setOpenAddAttachmentPlayerModal: (open: boolean) => void;
    setOpenShowAttachmentPlayerModal: (open: boolean) => void;
    setopenAddSanctionModal: (open: boolean) => void;
    setopenUpdateSanctionModal: (open: boolean) => void;
    setStatPlayerModal: (open: boolean) => void;
    setOpenChangeClassificationModal?: (open: boolean) => void;
}

export const PlayersTable = ({ list, search, setOpenEditModal, setOpenVerifyIdentityModal, setOpenDeleteModal, setOpenChangeStatusModal, setNewStatus, setSelectedRow, openDrawer, setSelectedDrawer, setOpenTransferModal, setOpenLoanModal, hasPermission, setOpenAddAttachmentPlayerModal, setOpenShowAttachmentPlayerModal, setopenAddSanctionModal, setopenUpdateSanctionModal, setStatPlayerModal, setOpenChangeClassificationModal }: Props) => {
    const [allMembers, setAllMembers] = useState<{ nodes: any }>({ nodes: [] });
    // Keep filter states to maintain parent behavior compatibility if filters were exposed, 
    // but PlayersTable locally handled some filters previously.
    // We'll simplify to just use the sorted/filtered list passed from parent,
    // since the parent filters search term. Wait, PlayersTable handles status/class/date filters inside it.
    
    // We will apply the same filtering logic as before:
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [allstatus, setAllStatus] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [valueClasseCheck, setValueClasseCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [detailsOpened, setDetailsOpened] = useState(false);
    const [selectedItemForDetails, setSelectedItemForDetails] = useState<any>(null);
    const itemsPerPage = 12;

    useEffect(() => {
        let distinct: any = []
        list.map((item: any) => {
            if (distinct.findIndex((item1: any) => item1 === item?.team?.name) == -1)
                distinct.push(item?.team?.name)
        })
        setAllTeams([...distinct])
    }, [list]);

    useEffect(() => {
        let filtered = [...list];

        // Status filter
        if (allstatus.length > 0) {
            filtered = filtered.filter(item => allstatus.includes(item?.status));
        }

        // Team filter
        if (valueCheck.length > 0) {
            filtered = filtered.filter(item => valueCheck.includes(item?.team?.name));
        }

        // Class filter
        if (valueClasseCheck.length > 0) {
            filtered = filtered.filter(item => valueClasseCheck.includes(item?.class));
        }

        // Date filter
        if (dateCheck.length > 0) {
            filtered = dateFilter(dateCheck, filtered);
        }

        setAllMembers({ nodes: filtered });
        setPage(1); // Reset page on filter change
    }, [list, allstatus, valueCheck, valueClasseCheck, dateCheck]);

    const dateFilter = (dateCheck: any, list: any) => {
        let listDates: string[] = []
        dateCheck.map((item: string) => {
            listDates = [...listDates, ...item.split("-")]
        })
        const dateMin = dayjs().subtract(Math.min(...listDates as any), 'year').format("YYYY-MM-DD")
        const dateMax = dayjs().subtract(Math.max(...listDates as any), 'year').format("YYYY-MM-DD")

        if (listDates.includes(">23")) {
            return list.filter((item: any) => item?.person?.date_birth < dateMax)
        } else {
            return list.filter((item: any) => dateMin > item?.person?.date_birth && item?.person?.date_birth > dateMax)
        }
    }

    // Pagination logic
    const totalPages = Math.ceil(allMembers.nodes.length / itemsPerPage);
    const paginatedNodes = allMembers.nodes.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // Handlers mapped to MemberCard props
    const handleEdit = (data: any) => { setSelectedRow(data.id); setOpenEditModal && setOpenEditModal(true); };
    const handleDelete = (id: string) => { setSelectedRow(id); setOpenDeleteModal && setOpenDeleteModal(true); };
    const handleChangeStatus = (id: string, status: string) => { setSelectedRow(id); setNewStatus && setNewStatus(status); setOpenChangeStatusModal && setOpenChangeStatusModal(true); };
    const handleVerifyIdentity = (data: any) => { setSelectedRow(data); setOpenVerifyIdentityModal && setOpenVerifyIdentityModal(true); };
    const handleShowAttachments = (data: any) => { setSelectedRow(data); setOpenShowAttachmentPlayerModal && setOpenShowAttachmentPlayerModal(true); };
    const handleAddAttachment = (id: string) => { setSelectedRow(id); setOpenAddAttachmentPlayerModal && setOpenAddAttachmentPlayerModal(true); };
    const handleStatPlayer = (data: any) => { setSelectedRow(data); setStatPlayerModal(true); };
    const handleTransferPlayer = (data: any) => { setSelectedRow(data.id); setOpenTransferModal && setOpenTransferModal(true); };
    const handleLoanPlayer = (data: any) => { setSelectedRow(data.id); setOpenLoanModal && setOpenLoanModal(true); };
    const handleOpenTransferHistory = (data: any) => { setSelectedDrawer && setSelectedDrawer(data); openDrawer && openDrawer(); };
    const handleAddSanction = (data: any) => { setSelectedRow(data.id); setopenAddSanctionModal && setopenAddSanctionModal(true); };
    const handleUpdateSanction = (data: any) => { setSelectedRow(data.id); setopenUpdateSanctionModal && setopenUpdateSanctionModal(true); };
    const handleChangeClassification = (data: any) => { setSelectedRow(data); setOpenChangeClassificationModal && setOpenChangeClassificationModal(true); };

    return (
        <Box>
            {paginatedNodes.length > 0 ? (
                <>
                    <Grid gutter="md">
                        {paginatedNodes.map((item: any) => (
                            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                                <PlayerCard1 
                                    data={item} 
                                    hasPermission={hasPermission} 
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onChangeStatus={handleChangeStatus}
                                    onVerifyIdentity={handleVerifyIdentity}
                                    onShowAttachments={handleShowAttachments}
                                    onAddAttachment={handleAddAttachment}
                                    onStatPlayer={handleStatPlayer}
                                    onTransferPlayer={handleTransferPlayer}
                                    onLoanPlayer={handleLoanPlayer}
                                    onOpenTransferHistory={handleOpenTransferHistory}
                                    onAddSanction={handleAddSanction}
                                    onUpdateSanction={handleUpdateSanction}
                                    onChangeClassification={handleChangeClassification}
                                    onShowDetails={() => {
                                        setSelectedItemForDetails(item);
                                        setDetailsOpened(true);
                                    }}
                                />
                            </Col>
                        ))}
                    </Grid>
                    {selectedItemForDetails && (
                        <PlayerModel 
                            item={selectedItemForDetails} 
                            opened={detailsOpened} 
                            onClose={() => setDetailsOpened(false)} 
                        />
                    )}
                    <Group position="center" mt="xl">
                        <Pagination total={totalPages} value={page} onChange={setPage} />
                    </Group>
                </>
            ) : (
                <Stack mih={300} align='center' justify='center'>
                    <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
                    <Text size={"md"} c={"gray.8"}>لا توجد بيانات ليتم عرضها</Text>
                </Stack>
            )}
        </Box>
    );
};