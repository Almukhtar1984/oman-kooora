import * as React from 'react';
import {ActionIcon, Group, Menu, Stack, Text} from '@mantine/core';
import {DotsVertical, Check, X, File} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import dayjs from "dayjs";

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

export const ExpenseTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setSelectedRow, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<any>([]);

    useEffect(() => {
        setAllMembers(list)
    }, [list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers([...filterAllMembers])
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
                            ? <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                            : null
                        }
                        {hasPermission("4")
                            ? <Menu.Item icon={<Check size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                            : null
                        }
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), width: '80px'},
        {name: 'صادر / وارد', selector: (item: any) => <Text dir={"rtl"} color={item?.value > 0 ? "green" : "red"}>{item?.value > 0 ? item?.value :  item?.value * -1}</Text>, width: '150px'  },
        {name: 'المرفق', selector: (item: any) => (
            item.attachment && item.attachment !== "" ?
                <Group position={"center"} spacing={2}>
                    <ActionIcon
                        color="green"
                        variant="light"
                
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${process.env.NEXT_PUBLIC_API_URL}/images/${item.nationalID}`}
                    >
                        <File size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>المرفق</Text>
                </Group>
                : null
        ), width: '120px'},
        {name: 'السبب / الملاحظة', selector: (item: any) => item?.note },
        {name: 'تاريخ الانشاء', selector: (item: any) => dayjs(item?.createdAt).format("YYYY-MM-DD"), width: '150px' },
    ];

    return (
        <DataTable
            //@ts-ignore
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