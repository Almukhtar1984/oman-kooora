import * as React from 'react';
import { ActionIcon, Badge, Group, Menu, Pagination, Stack, Text, Grid, Col, Box } from '@mantine/core';
import { useEffect, useState } from "react";
import { searchSortedData } from "../../lib/helpers/sort";
import dayjs from "dayjs";
import { IconDatabaseOff } from '@tabler/icons-react';
import { MemberCard } from '../Card/MemberCard';

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenRenewModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    setSelectedDrawer?: (data: any) => void;
    hasPermission: (permission: string) => boolean;
}

export const AssemblyTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setOpenRenewModal, setSelectedRow, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        setAllMembers(list);
        setPage(1);
    }, [list]);

    const handleEdit = (data: any) => { setSelectedRow && setSelectedRow(data); setOpenEditModal && setOpenEditModal(true); };
    const handleDelete = (id: string) => { setSelectedRow && setSelectedRow(id); setOpenDeleteModal && setOpenDeleteModal(true); };
    const handleRenewSubscription = (data: any) => { setSelectedRow && setSelectedRow(data); setOpenRenewModal && setOpenRenewModal(true); };

    const totalPages = Math.ceil(allMembers.length / itemsPerPage);
    const paginatedNodes = allMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Box>
            {paginatedNodes.length > 0 ? (
                <>
                    <Grid gutter="md">
                        {paginatedNodes.map((item: any) => (
                            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                                <MemberCard 
                                    type="assembly" 
                                    data={item} 
                                    hasPermission={hasPermission} 
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onRenewSubscription={handleRenewSubscription}
                                />
                            </Col>
                        ))}
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