import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Group, Menu, Pagination, Text} from '@mantine/core';
import {DotsVertical, Check, X, Id, CalendarStats} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import dayjs from "dayjs";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;

    setSelectedRow?: (id: string) => void;
}

export const ExpenseTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setSelectedRow }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });

    const theme = useTheme({
        ...mantineTheme,
        HeaderRow: `
            .th {
                text-align: right;
                border-bottom: 1px solid #dee2e6;
            }
        `,
        BaseCell: `
            padding: 10px 10px;
            text-align: right;
        `,
        Table: `
            --data-table-library_grid-template-columns:  10% 10% 70% 10% ;
            min-height: 200px;
        `,
    });

    const pagination = usePagination(allMembers, {
        state: {
            page: 0,
            size: 10,
        },
        onChange: onPaginationChange,
    });

    useEffect(() => {
        setAllMembers({nodes: list})
    }, [list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const openModelUpdate = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }


    const COLUMNS = [
        {label: 'الخيارات', renderCell: (item) => (
            <Group>
                <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                        <Menu.Item icon={<Check size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        )},
        {label: 'صادر / وارد', renderCell: (item) => <Text dir={"rtl"} color={item?.value > 0 ? "green" : "red"}>{item?.value > 0 ? item?.value :  item?.value * -1}</Text>  },

        {label: 'السبب / الملاحظة', renderCell: (item) => item?.note },

        {label: 'تاريخ الانشاء', renderCell: (item) => dayjs(item?.createdAt).format("YYYY-MM-DD") },
    ];

    return (
        <>
            <CompactTable columns={COLUMNS} data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }} />

            <br />
            <Group position="right" mx={10}>
                <Pagination
                    total={pagination.state.getTotalPages(allMembers.nodes)}
                    value={pagination.state.page + 1}
                    onChange={(page) => pagination.fns.onSetPage(page - 1)}
                />
            </Group>
        </>
    );
};