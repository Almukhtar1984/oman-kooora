import * as React from 'react';

import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Checkbox, Group, Menu, Pagination, Text, Tooltip} from '@mantine/core';
import {
    DotsVertical,
    Check,
    X,
    Id,
    FileCertificate,
    History,
    EditCircle,
    Printer,
    Trash,
    ExternalLink, Message
} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Filter} from "tabler-icons-react";

import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";
import dayjs from "dayjs";
import {GiPlayerPrevious} from "react-icons/gi";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    openDrawer: () => void;
    setSelectedDrawer?: (data: any) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenShowModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
}

export const OutboxTable = ({ list, search, setOpenEditModal, setOpenChangeStatusModal, setNewStatus, setSelectedRow, openDrawer, setSelectedDrawer, setOpenDeleteModal, setOpenShowModal, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);

    const theme = useTheme({
        ...mantineTheme,
        HeaderRow: `
            .th {
                text-align: right;
                border-bottom: 1px solid #dee2e6;
                max-height: 62px;
            }
        `,
        BaseCell: `
            padding: 10px 10px;
            text-align: right;
        `,
        Table: `
            --data-table-library_grid-template-columns:  80px 10% 20% 50% 20% ;
            min-height: 250px;
        `,
        BaseRow: `
            .td {
                max-height: 75px;
            }
        `
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
    }, [valueCheck]);

    useEffect(() => {
        if (dateCheck.length > 0) {
            let listDates: string[] = []

            dateCheck.map((item: string) => {
                listDates = [...listDates, ...item.split("-")]
            })

            // @ts-ignore
            const dateMin = dayjs().subtract(Math.min(...listDates), 'year').format("YYYY-MM-DD")
            // @ts-ignore
            const dateMax = dayjs().subtract(Math.max(...listDates), 'year').format("YYYY-MM-DD")


            let filterAllMembers: any[] = []
            if (listDates.includes(">23")) {
                filterAllMembers = list.filter((item: any) => item?.person?.date_birth < dateMax )
            } else {
                filterAllMembers = list.filter((item: any) => dateMin > item?.person?.date_birth && item?.person?.date_birth > dateMax)
            }

            setAllMembers({nodes: [...filterAllMembers]})
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [dateCheck]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange() {
        return undefined;
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelShow = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenShowModal === "function" && setOpenShowModal(true)
    }

    const openModelComment = (id: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof openDrawer === "function" && openDrawer()
    }

    const openModelChangeStatus = (id: string, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
    }

    const onOpenDrawer = (data: any) => {
        typeof setSelectedDrawer === "function" && setSelectedDrawer(data)
        typeof openDrawer === "function" && openDrawer()
    }

    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>الخيارات</HeaderCell>
                                <HeaderCell>الاولوية</HeaderCell>
                                <HeaderCell>المرسل اليه</HeaderCell>
                                <HeaderCell>الموضوع</HeaderCell>
                                <HeaderCell>تاريخ الارسال</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>
                                        {<Group>
                                            <Menu shadow="md" width={200} position={"bottom"}>
                                                <Menu.Target>
                                                    <ActionIcon color="gray" variant="light" >
                                                        <DotsVertical size={18} />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    {hasPermission("4")
                                                        ? <Menu.Item icon={<ExternalLink size={14} />} onClick={() => openModelShow(item?.id)} >فتح</Menu.Item>
                                                        : null
                                                    }
                                                    {hasPermission("5")
                                                        ? <Menu.Item icon={<Message size={14} />} onClick={() => openModelComment(item?.id)} >التعليقات</Menu.Item>
                                                        : null
                                                    }
                                                    {hasPermission("3")
                                                        ? <Menu.Item icon={<Trash size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                        : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>}
                                    </Cell>
                                    <Cell>
                                        {item?.priority === "normal"
                                            ? <Badge color={"green"} >عادي</Badge>
                                            : item?.priority === "urgent"
                                                ? <Badge color="violet">عاجل</Badge>
                                                : <Badge color="red">عاجل جدا</Badge>
                                        }
                                    </Cell>
                                    <Cell>
                                        {item?.team_receiver
                                            ? item?.team_receiver?.name
                                            : "الى الجميع"
                                        }
                                    </Cell>
                                    <Cell>{item?.subject}</Cell>
                                    <Cell>
                                        {/*<Tooltip label={item?.createdAt}>*/}
                                            {dayjs(item?.createdAt).locale("ar").fromNow()}
                                        {/*</Tooltip>*/}
                                    </Cell>
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
