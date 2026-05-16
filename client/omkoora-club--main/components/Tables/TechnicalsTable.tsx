import * as React from 'react';
import { ActionIcon, Badge, Checkbox, Group, Menu, Pagination, Stack, Text, Grid, Col, Box } from '@mantine/core';
import { Filter } from "tabler-icons-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { IconDatabaseOff } from '@tabler/icons-react';
import { MemberCard } from '../Card/MemberCard';
import { SelectableCardWrapper } from '../BulkSelection';

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    hasPermission: (permission: string) => boolean;
    setOpenChangeClassificationModal?: (open: boolean) => void;
    selectedIds?: string[];
    onToggleSelect?: (id: string) => void;
    onPageItemsChange?: (ids: string[]) => void;
    selectionEnabled?: boolean;
}

export const TechnicalsTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setNewStatus, setSelectedRow, setOpenChangeStatusModal, hasPermission, setOpenChangeClassificationModal, selectedIds, onToggleSelect, onPageItemsChange, selectionEnabled }: Props) => {
    const [allMembers, setAllMembers] = useState<{ nodes: any }>({ nodes: [] });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [statusCheck, setStatusCheck] = useState<string[]>([]);
    const [page, setPage] = useState(1);
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
        let filterAllMembers = list;

        if (valueCheck.length > 0) {
            filterAllMembers = filterAllMembers.filter((item: any) => valueCheck.includes(item?.team?.name));
        }

        if (statusCheck.length > 0) {
            filterAllMembers = filterAllMembers.filter((item: any) => statusCheck.includes(item?.status));
        }

        setAllMembers({ nodes: filterAllMembers });
        setPage(1);
    }, [list, valueCheck, statusCheck]);

    const handleEdit = (data: any) => { setSelectedRow && setSelectedRow(data.id); setOpenEditModal && setOpenEditModal(true); };
    const handleDelete = (id: string) => { setSelectedRow && setSelectedRow(id); setOpenDeleteModal && setOpenDeleteModal(true); };
    const handleChangeStatus = (id: string, status: string) => { setSelectedRow && setSelectedRow(id); setNewStatus && setNewStatus(status); setOpenChangeStatusModal && setOpenChangeStatusModal(true); };
    const handleChangeClassification = (data: any) => { setSelectedRow && setSelectedRow(data); setOpenChangeClassificationModal && setOpenChangeClassificationModal(true); };

    // Pagination logic
    const totalPages = Math.ceil(allMembers.nodes.length / itemsPerPage);
    const paginatedNodes = allMembers.nodes.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    useEffect(() => {
        if (onPageItemsChange) {
            onPageItemsChange(paginatedNodes.map((it: any) => it.id));
        }
    }, [paginatedNodes, onPageItemsChange]);

    return (
        <Box>
            {paginatedNodes.length > 0 ? (
                <>
                    <Grid gutter="md">
                        {paginatedNodes.map((item: any) => {
                            const card = (
                                <MemberCard
                                    type="technical"
                                    data={item}
                                    hasPermission={hasPermission}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onChangeStatus={handleChangeStatus}
                                    onChangeClassification={handleChangeClassification}
                                />
                            );
                            return (
                                <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                                    {selectionEnabled && onToggleSelect ? (
                                        <SelectableCardWrapper
                                            selected={!!selectedIds?.includes(item.id)}
                                            onToggle={() => onToggleSelect(item.id)}
                                        >
                                            {card}
                                        </SelectableCardWrapper>
                                    ) : card}
                                </Col>
                            );
                        })}
                    </Grid>
                    <Group position="center" mt="xl">
                        <Pagination total={totalPages} value={page} onChange={setPage} />
                    </Group>
                </>
            ) : (
                <Stack mih={300} align='center' justify='center'>
                    <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
                    <Text size={"md"} c={"gray.8"}>لا يوجد بيانات</Text>
                </Stack>
            )}
        </Box>
    );
};