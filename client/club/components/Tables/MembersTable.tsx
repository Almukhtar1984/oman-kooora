import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Avatar, Badge, Checkbox, Group, Menu, Pagination, Text} from '@mantine/core';
import {
    Check,
    DotsVertical,
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
    setOpenChangeStatusModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    hasPermission: (permission: string) => boolean;
    setOpenDeleteModal?: (open: boolean) => void;
}

export const MembersTable = ({ list, search, setOpenEditModal, setNewStatus, setOpenDeleteModal, setSelectedRow, setOpenChangeStatusModal, hasPermission, }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);

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
            --data-table-library_grid-template-columns: 80px 150px 15% 20% 12% 12% 12% 12% 12% 15% 30%;
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

        let distinct: any = []
        list.map((item: any) => {
            if (distinct.findIndex((item1: any) => item1 === item?.team?.name) == -1)
                distinct.push(item?.team?.name)
        })
        setAllTeams([...distinct])
    }, [list]);

    useEffect(() => {
        if (valueCheck.length > 0) {
            const filterAllMembers = list.filter((item: any) => valueCheck.includes(item?.team?.name) )

            setAllMembers({nodes: [...filterAllMembers]})
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [valueCheck, list]);

    function onPaginationChange() {
        return undefined;
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelChangeStatus = (id: string, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
    }

    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>الخيارات</HeaderCell>
                                <HeaderCell>الحالة</HeaderCell>
                                <HeaderCell>
                                    <Group position={"apart"} noWrap={true}>
                                        <Text>إسم الفريق</Text>
                                        <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                                            <Menu.Target>
                                                <ActionIcon>
                                                    <Filter size={18} />
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Checkbox.Group value={valueCheck} onChange={setValueCheck} defaultValue={[]}>
                                                    {allTeams.map((item: any, index) => (
                                                        <Menu.Item key={index} component={"div"}>
                                                            <Checkbox value={item} label={item} />
                                                        </Menu.Item>
                                                    ))}
                                                </Checkbox.Group>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </HeaderCell>
                                <HeaderCell>الاسم الكامل</HeaderCell>
                                <HeaderCell>رقم الهاتف</HeaderCell>
                                <HeaderCell>الرقم المدني</HeaderCell>
                                <HeaderCell>تاريخ الميلاد</HeaderCell>
                                <HeaderCell>الوظيفه</HeaderCell>
                                <HeaderCell>التصنيف</HeaderCell>
                                <HeaderCell>تاريخ العضويه</HeaderCell>
                                <HeaderCell>الملاحظة / سبب الرفض</HeaderCell>
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
                                                    {hasPermission("3")
                                                        ? <Menu.Item icon={<EditCircle size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                                                        : null
                                                    }
                                                    <Menu.Item icon={<Trash size={18} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                    
                                                    {item?.status == "accepted" ?
                                                        hasPermission("5") ? <Menu.Item icon={<X size={14} />} onClick={() => openModelChangeStatus(item?.id, "rejected")} >رفض</Menu.Item> : null
                                                        : item?.status == "rejected" ?
                                                            hasPermission("5") ? <Menu.Item icon={<Check size={14} />} onClick={() => openModelChangeStatus(item?.id, "accepted")} >قبول</Menu.Item> : null
                                                            : item?.status == "waiting_club" 
                                                                ? hasPermission("5") 
                                                                    ? <>
                                                                        <Menu.Item icon={<X size={14} />} onClick={() => openModelChangeStatus(item?.id, "rejected")} >رفض</Menu.Item>
                                                                        <Menu.Item icon={<Check size={14} />} onClick={() => openModelChangeStatus(item?.id, "accepted")} >قبول</Menu.Item>
                                                                    </>
                                                                    : null
                                                                : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </Cell>
                                    <Cell>
                                        {item?.status == "accepted"
                                            ? <Badge fw={500} color="teal">مقبول</Badge>
                                            : item?.status == "rejected"
                                                ? <Badge fw={500} color="red">مرفوض</Badge>
                                                : item?.status == "waiting"
                                                    ? <Badge fw={500} color="yellow">قيد انتظار تاكيد الفريق</Badge>
                                                    : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
                                        }
                                    </Cell>
                                    <Cell>{item?.team?.name}</Cell>
                                    <Cell>{`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}</Cell>
                                    <Cell>{item?.person?.phone}</Cell>
                                    <Cell>{item?.person?.card_number}</Cell>
                                    <Cell>{item?.person?.date_birth}</Cell>
                                    <Cell>{item?.occupation}</Cell>
                                    <Cell>{item?.classification}</Cell>
                                    <Cell>{dayjs(item?.membership_date).format("YYYY-MM-DD")}</Cell>
                                    <Cell>{item?.note}</Cell>
                                </Row>
                            ))}
                        </Body>
                    </>
                )}
            </Table>

            {/*<CompactTable*/}
            {/*    columns={COLUMNS}*/}
            {/*    // virtualizedOptions={VIRTUALIZED_OPTIONS}*/}
            {/*    data={allMembers}*/}
            {/*    theme={theme}*/}
            {/*    pagination={pagination}*/}
            {/*    layout={{ custom: true, horizontalScroll: true }}*/}
            {/*/>*/}

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
