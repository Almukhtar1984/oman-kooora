import * as React from 'react';

import {ActionIcon, Badge, Button, Checkbox, Group, Menu, Pagination, Stack, Text} from '@mantine/core';
import {DotsVertical, ExternalLink, Message} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

import dayjs from "dayjs";
import { IconDatabaseOff } from '@tabler/icons-react';

import DataTable, {TableStyles} from 'react-data-table-component';
const customStyles: TableStyles = {
    table: {
        style: {
            minHeight: 300,
            background: "#f8f9fa"
        },
    },
    headRow: {
        style: {
            minHeight: 44,
            borderRadius: "6px 6px 0px 0px",
            background: "#E9ECEF",
            borderBottomWidth: "0px !important",
        }
    },
    headCells: {
        style: {
            fontWeight: 600,
            fontSize: 14,
        },
    },
    rows: {
        style: {
            minHeight: 64,
            marginTop: "20px",
            borderBottomWidth: "0px !important",
            borderRadius: "5px",
        }
    },
};

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
    const [allMembers, setAllMembers] = useState<any>([]);

    useEffect(() => {
        setAllMembers(list)
    }, [list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers([...filterAllMembers])
    }, [search, list]);

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

    const COLUMNS = [
        {name: 'الخيارات', selector: (item: any) => (
            <Group>
                <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        {hasPermission("3")
                            ? <Menu.Item icon={<ExternalLink size={14} />} onClick={() => openModelShow(item?.id)} >فتح</Menu.Item>
                            : null
                        }
                        {hasPermission("4")
                            ? <Menu.Item icon={<Message size={14} />} onClick={() => openModelComment(item?.id)} >التعليقات</Menu.Item>
                            : null
                        }
                        {/*<Menu.Item icon={<EditCircle size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item >*/}
                        {/*<Menu.Item icon={<Trash size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>*/}
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), width: '80px'},
        {name: 'الاولوية', selector: (item: any) => (
            item?.priority === "normal"
                ? <Badge color={"green"} >عادي</Badge>
                : item?.priority === "urgent"
                    ? <Badge color="violet">عاجل</Badge>
                    : <Badge color="red">عاجل جدا</Badge>
        ), width: '120px'},
        {name: 'الموضوع', selector: (item: any) => item?.subject, width: '120px'},
        {name: 'تاريخ الارسال', selector: (item: any) => dayjs(item?.createdAt).locale("ar").fromNow(), width: '200px'},
    ];
    return (
        <DataTable
            columns={COLUMNS}
            data={allMembers}
            customStyles={customStyles}
            highlightOnHover={false}
            pagination={true}
            paginationComponentOptions={{
                rowsPerPageText: "الاسطر في كل صفحة",
                rangeSeparatorText: "من"
            }}
            noDataComponent={
                <Stack mih={300} align='center' justify='center'>
                    <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
                    <Text size={"md"} c={"gray.8"} >لا يوجد بيانات</Text>
                </Stack>
            }
        />
    );
};
