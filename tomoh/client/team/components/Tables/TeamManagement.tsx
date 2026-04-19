import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Avatar, Badge, Checkbox, Group, Menu, Pagination, Text} from '@mantine/core';
import {
    Check,
    DotsVertical, Edit,
    EditCircle,
    FileCertificate,
    Filter,
    History,
    Id,
    Printer,
    Trash,
    X
} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Body, Cell, Header, HeaderCell, HeaderRow, Row, Table} from "@table-library/react-table-library/table";
import {GiPlayerPrevious} from "react-icons/gi";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    hasPermission: (permission: string) => boolean;
}

export const TeamManagementTable = ({ list, setOpenEditModal, setOpenDeleteModal, setSelectedRow, hasPermission, }: Props) => {
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
            --data-table-library_grid-template-columns: 80px 20% 8% 12% 12% 12% 12% 12% 25%;
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

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>الخيارات</HeaderCell>
                                <HeaderCell>الاسم الكامل</HeaderCell>
                                <HeaderCell>التصنيف</HeaderCell>
                                <HeaderCell>رقم الهاتف</HeaderCell>
                                <HeaderCell>الرقم المدني</HeaderCell>
                                <HeaderCell>تاريخ الميلاد</HeaderCell>
                                <HeaderCell>تاريخ العضويه</HeaderCell>
                                <HeaderCell>تاريخ  نهاية العضويه</HeaderCell>
                                <HeaderCell>الصلاحيات</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>
                                        <Group>
                                            <Menu shadow="md" width={200} position={"bottom"}>
                                                <Menu.Target>
                                                    <ActionIcon color="gray" variant="light" >
                                                        <DotsVertical size={18} />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    <Menu.Item icon={<EditCircle size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                                                    {hasPermission("3")
                                                        ? <Menu.Item icon={<EditCircle size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                                                        : null
                                                    }
                                                    {hasPermission("4")
                                                        ? <Menu.Item icon={<X size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                        : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </Cell>
                                    <Cell>{`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}</Cell>
                                    <Cell>{ item?.classification }</Cell>
                                    <Cell>{item?.person?.phone}</Cell>
                                    <Cell>{item?.person?.card_number}</Cell>
                                    <Cell>{item?.person?.date_birth}</Cell>
                                    <Cell>{dayjs(item?.membership_date).format("YYYY-MM-DD")}</Cell>
                                    <Cell>{dayjs(item?.membership_date_end).format("YYYY-MM-DD")}</Cell>
                                    <Cell>{item?.classification === "رئيس" ? "كامل الصلاحيات" : "صلاحيات مخصصة"}</Cell>
                                </Row>
                            ))}
                        </Body>
                    </>
                )}
            </Table>

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