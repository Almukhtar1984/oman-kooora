import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Group, Menu, Pagination, Text} from '@mantine/core';
import {DotsVertical, Check, X, Id, FileCertificate, History, CalendarStats} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {getImageUrl} from "../../lib/helpers/image";
import dayjs from "dayjs";

const key = 'Pagination';

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
}

export const AssemblyTableTeam = ({ list }: Props) => {
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
            --data-table-library_grid-template-columns:  20% 10% 10% 12% 12% 10% 10% 10% 12% 15% ;
            min-height: 200px;
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

    const COLUMNS = [
        {label: 'الاسم الكامل', renderCell: (item) => `${item?.first_name} ${item?.second_name} ${item?.third_name} ${item?.tribe}`  },
        {label: 'تاريخ الميلاد', renderCell: (item) => dayjs(item?.date_birth).format("YYYY-MM-DD") },
        {label: 'الرقم المدني', renderCell: (item) => item?.card_number },
        {label: 'رقم الهاتف', renderCell: (item) => item?.phone },
        {label: 'العضوية', renderCell: (item) => item?.type },

        {label: 'تاريخ العضويه', renderCell: (item) => dayjs(item?.membership_date).format("YYYY-MM-DD") },
        {label: 'الجنس', renderCell: (item) => item?.gender == "male" ? "ذكر" : "أنثى" },

        {label: 'تاريخ الاشتراك', renderCell: (item) => dayjs(item?.subscription_date).format("YYYY-MM-DD") },
        {label: 'حالة الاشتراك', renderCell: (item) => {
            const year = dayjs(item?.subscription_date).format("YYYY")

            const date1 = new Date(`${parseInt(year)+1}-01-01`);
            const date2 = new Date();

            return date2 >= date1 ? <Badge color="red">منتهي</Badge> : <Badge color="teal">يعمل</Badge>
        } },

        {label: 'صورة البطاقة المدنية', renderCell: (item) => (
            item.nationalID && item.nationalID !== "" ?
                <Group position={"center"}>
                    <ActionIcon
                        color="green"
                        variant="light"
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={getImageUrl(item.nationalID)}
                    >
                        <Id size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>البطاقة</Text>
                </Group>
                : null
        )},
        {label: 'صورة البطاقة الخلفية', renderCell: (item) => (
            item.nationalIDBack && item.nationalIDBack !== "" ?
                <Group position={"center"}>
                    <ActionIcon
                        color="green"
                        variant="light"
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={getImageUrl(item.nationalIDBack)}
                    >
                        <Id size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>البطاقة</Text>
                </Group>
                : null
        )}
    ];

    return (
        <>
            <CompactTable columns={COLUMNS} data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }} />

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