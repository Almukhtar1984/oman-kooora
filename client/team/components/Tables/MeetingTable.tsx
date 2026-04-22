import * as React from 'react';

import {ActionIcon, Button, Group, Menu, Stack, Text} from '@mantine/core';
import {DotsVertical, ExternalLink, Message} from "tabler-icons-react";
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
    setSelectedRow?: (id: string) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenEditModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
}

export const MeetingTable = ({ list, search, setSelectedRow, setOpenDeleteModal, setOpenEditModal, hasPermission }: Props) => {
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

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelEdit = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
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
                        {hasPermission("3")
                            ? <Menu.Item icon={<ExternalLink size={14} />} onClick={() => openModelEdit(item?.id)} >تعديل</Menu.Item>
                            : null
                        }
                        {hasPermission("4")
                            ? <Menu.Item icon={<Message size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                            : null
                        }
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), width: '80px'},
        {name: 'الموضوع', selector: (item: any) => item?.subject},
        {name: 'الاعضاء الحضور', selector: (item: any) => item?.names_attending},
        {name: 'الوصف', selector: (item: any) => item?.description},
        {name: 'المرفقات', selector: (item: any) => (
            <Group spacing={5}>
                {item?.attachment?.map((item: any) => (
                    <Button size={"xs"} key={item?.id} component={"a"} target={"_blank"} rel="noopener noreferrer" href={`${process.env.NEXT_PUBLIC_API_URL}/files/${item.content}`} >
                        تحميل
                    </Button>
                ))}
            </Group>
        )},
        {name: 'التاريخ', selector: (item: any) => dayjs(item?.createdAt).locale("ar").fromNow(), width: '120px'},
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
