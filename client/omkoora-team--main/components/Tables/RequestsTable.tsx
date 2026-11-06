import * as React from 'react';
import {ActionIcon, Badge, Box, Menu, Tooltip} from '@mantine/core';
import {Check, DotsVertical, X} from "tabler-icons-react";
import { formatDay } from "../../lib/helpers/date";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';
import { DataLoading, DataEmpty } from "../Loading/DataState";
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

export const REQUEST_SEARCH_KEYS = [
    "content",
    "player.person.first_name", "player.person.second_name", "player.person.third_name",
    "player.person.tribe", "player.person.phone",
];

interface Props {
    loading?: boolean;
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    hasPermission: (permission: string) => boolean;
}

export const RequestsTable = ({ loading, list, search, setOpenEditModal, setOpenDeleteModal, setSelectedRow, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<any>([]);

    useEffect(() => {
        setAllMembers(searchSortedData(list, REQUEST_SEARCH_KEYS, search))
    }, [list, search]);

    const openModelUpdate = (data: any, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow({
            ...data,
            status
        })
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    // ما يجوز على الطلب الآن. كانت القائمة تُفتح فارغةً بلا كلمة لمن لا يملك القبول
    // والرفض — خطٌّ رفيع تحت الزر، فبدا الزر معطّلاً («الخيارات ما تشتغل»، العميل).
    const actionsFor = (item: any) => {
        if (!hasPermission("2") || item?.status === "done") return [];
        if (item?.status === "accepted") {
            return [
                { label: "تم الانتهاء", status: "done", icon: <Check size={14} /> },
                { label: "رفض", status: "rejected", icon: <X size={14} /> },
            ];
        }
        if (item?.status === "rejected") {
            return [{ label: "قبول", status: "accepted", icon: <Check size={14} /> }];
        }
        return [
            { label: "رفض", status: "rejected", icon: <X size={14} /> },
            { label: "قبول", status: "accepted", icon: <Check size={14} /> },
        ];
    };

    const COLUMNS = [
        {name: 'الخيارات', selector: (item: any) => {
            const actions = actionsFor(item);
            if (actions.length === 0) {
                return (
                    <Tooltip
                        withinPortal
                        label={hasPermission("2")
                            ? "انتهى هذا الطلب"
                            : "لا تملك صلاحية قبول الطلبات ورفضها — تُمنح من صفحة «الصلاحيات»"}
                    >
                        <Box component="span">
                            <ActionIcon color="gray" variant="light" disabled aria-label="لا إجراء على هذا الطلب">
                                <DotsVertical size={18} />
                            </ActionIcon>
                        </Box>
                    </Tooltip>
                );
            }
            return (
                <Menu shadow="md" width={200} position={"bottom"} withinPortal>
                    <Menu.Target>
                        <ActionIcon color="gray" variant="light" aria-label="خيارات الطلب">
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {actions.map((action) => (
                            <Menu.Item key={action.status} icon={action.icon} onClick={() => openModelUpdate(item, action.status)}>
                                {action.label}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            );
        }, width: '100px'},
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
        {name: 'اللاعب', selector: (item: any) => {
            const person = item?.player?.person;
            return [person?.first_name, person?.second_name, person?.third_name, person?.tribe].filter(Boolean).join(" ");
        }, width: '220px' },
        {name: 'الطلب', selector: (item: any) => `${item?.content}`, width: '300px'  },
        {name: 'الملاحظة / سبب الرفض', selector: (item: any) => item?.note, width: '300px' },
        {name: 'تاريخ الطلب', selector: (item: any) => formatDay(item?.createdAt), width: '120px' },
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
            noDataComponent={loading ? <DataLoading variant="rows" /> : <DataEmpty label="لا يوجد بيانات" />}
        />
    );
};