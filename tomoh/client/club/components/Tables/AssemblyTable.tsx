import * as React from 'react';
import {ActionIcon, Badge, Group, Menu, Stack, Text} from '@mantine/core';
import {DotsVertical, Check, X, Id, CalendarStats, Printer} from "tabler-icons-react";
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
    setOpenRenewModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    setSelectedDrawer?: (data: any) => void;
    hasPermission: (permission: string) => boolean;
}

export const AssemblyTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setOpenRenewModal, setSelectedRow, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<any>([]);

    useEffect(() => {
        setAllMembers(list)
    }, [list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers([...filterAllMembers])
    }, [search]);

    const openModelUpdate = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelRenew = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenRenewModal === "function" && setOpenRenewModal(true)
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
                            ? <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item)} >تعديل</Menu.Item>
                            : null
                        }
                        {hasPermission("4")
                            ? <Menu.Item icon={<Check size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                            : null
                        }

                        {new Date() > new Date(`${parseInt(dayjs(item?.subscription_date).format("YYYY"))+1}-01-01`) && hasPermission("5")
                            ? <Menu.Item icon={<CalendarStats size={14} />} onClick={() => openModelRenew(item)} >تجديد الاشتراك</Menu.Item>
                            : null
                        }
                        <Menu.Item 
                            component={"a"}
                            icon={<Printer size={18} />}
                            href={`https://print.omkooora.com/#/assembly-card/${item?.id}`}
                            target={"_blank"}
                        >طباعة البطاقة</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        )},
        {name: 'الاسم الكامل', selector: (item: any) => `${item?.first_name} ${item?.second_name} ${item?.third_name} ${item?.tribe}`  },
        {name: 'تاريخ الميلاد', selector: (item: any) => dayjs(item?.date_birth).format("YYYY-MM-DD") },
        {name: 'الرقم المدني', selector: (item: any) => item?.card_number },
        {name: 'رقم الهاتف', selector: (item: any) => item?.phone },
        {name: 'العضوية', selector: (item: any) => item?.type },

        {name: 'تاريخ العضويه', selector: (item: any) => dayjs(item?.membership_date).format("YYYY-MM-DD") },
        {name: 'الجنس', selector: (item: any) => item?.gender == "male" ? "ذكر" : "أنثى" },

        {name: 'تاريخ الاشتراك', selector: (item: any) => dayjs(item?.subscription_date).format("YYYY-MM-DD") },
        {name: 'حالة الاشتراك', selector: (item: any) => {
            const year = dayjs(item?.subscription_date).format("YYYY")

            const date1 = new Date(`${parseInt(year)+1}-01-01`);
            const date2 = new Date();

            return date2 >= date1 ? <Badge color="red">منتهي</Badge> : <Badge color="teal">يعمل</Badge>
        } },

        {name: 'صورة البطاقة المدنية', selector: (item: any) => (
            item.nationalID && item.nationalID !== "" ?
                <Group position={"center"}>
                    <ActionIcon
                        color="green"
                        variant="light"

                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${process.env.NEXT_PUBLIC_API_URL}/images/${item.nationalID}`}
                    >
                        <Id size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>البطاقة</Text>
                </Group>
                : null
        )}
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