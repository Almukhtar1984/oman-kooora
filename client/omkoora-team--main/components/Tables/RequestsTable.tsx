import * as React from 'react';
import {ActionIcon, Badge, Group, Menu, Stack, Text} from '@mantine/core';
import {Check, DotsVertical, X} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';
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
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    hasPermission: (permission: string) => boolean;
}

export const RequestsTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setSelectedRow, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<any>([]);

    useEffect(() => {
        setAllMembers(list)
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
        setAllMembers([...filterAllMembers])
    }, [search]);

    const openModelUpdate = (data: any, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow({
            ...data,
            status
        })
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
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
                        {hasPermission("2")
                            ? item?.status == "accepted" ?
                                <>
                                    <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item, "done")} >تم النتهى</Menu.Item>
                                    <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item, "rejected")} >رفض</Menu.Item>
                                </>
                                : item?.status == "rejected" ?
                                    <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item, "accepted")} >قبول</Menu.Item>
                                    : <>
                                        <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item, "rejected")} >رفض</Menu.Item>
                                        <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item, "accepted")} >قبول</Menu.Item>
                                    </>
                            : null
                        }
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), width: '80px'},
        {name: 'الحالة', selector: (item: any) => (
            item?.status == "done"
                ? <Badge fw={500} color="teal">منتهي</Badge>
                : item?.status == "accepted"
                    ? <Badge fw={500} color="violet">مقبول</Badge>
                    : item?.status == "rejected"
                        ? <Badge fw={500} color="red">مرفوض</Badge>
                        : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
        ), width: '120px'},
        {name: 'النوع', selector: (item: any) => (
            item?.type == "request"
                ? <Badge fw={500} variant={"filled"} color="lime">طلب</Badge>
                : item?.type == "complaint"
                    ? <Badge fw={500} variant={"filled"} color="indigo">شكوى</Badge>
                    : <Badge fw={500} variant={"filled"} color="orange">مقترح</Badge>
        ), width: '120px'},
        {name: 'الطلب', selector: (item: any) => `${item?.content}`, width: '300px'  },
        {name: 'الملاحظة / سبب الرفض', selector: (item: any) => item?.note, width: '300px' },
        {name: 'تاريخ الطلب', selector: (item: any) => dayjs(item?.createdAt).format("YYYY-MM-DD"), width: '120px' },
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