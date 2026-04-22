import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Avatar, Badge, Group, Menu, Pagination} from '@mantine/core';
import {Check, DotsVertical, EditCircle, Trash, X} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
}


export const ProposalTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setSelectedRow }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });

    const handlePaginationChange = () => {};

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
            --data-table-library_grid-template-columns: 8% 8% 40% 30% 14%;
        `,
    });

    const pagination = usePagination(allMembers, {
        state: {
            page: 0,
            size: 10,
        },
        onChange: handlePaginationChange,
    });

    useEffect(() => {
        setAllMembers({nodes: list})
    }, [list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(
            list,
            [
                'person.first_name', "person.second_name", "person.third_name",
                "person.tribe", "person.phone", "person.card_number",
                "occupation", "classification"
            ],
            search
        )
        setAllMembers({nodes: [...filterAllMembers]})


    }, [search]);

    const openModelUpdate = (data: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (data: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
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
                            <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item)} >تعديل</Menu.Item>
                            <Menu.Item icon={<Check size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            )
        },
        {label: 'الحالة', renderCell: (item) => (
            item?.status == "done"
                ? <Badge fw={500} color="teal">منتهي</Badge>
                : item?.status == "accepted"
                    ? <Badge color="violet">مقبول قيد المعالجة</Badge>
                    : item?.status == "rejected"
                        ? <Badge color="red">مرفوض</Badge>
                        : <Badge color="yellow">قيد الانتظار</Badge>
        )},
        {label: 'المقترح', renderCell: (item) => `${item?.content}`  },
        {label: 'الملاحظة / سبب الرفض', renderCell: (item) => item?.note },
        {label: 'تاريخ الاقتراح', renderCell: (item) => dayjs(item?.createdAt).format("YYYY-MM-DD") },
    ];

    const VIRTUALIZED_OPTIONS = {
        rowHeight: (_item, _index) => 33,
    };

    return (
        <>
            <CompactTable
                columns={COLUMNS}
                // virtualizedOptions={VIRTUALIZED_OPTIONS}
                data={allMembers}
                theme={theme}
                pagination={pagination}
                layout={{ custom: true, horizontalScroll: true }}
            />

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
