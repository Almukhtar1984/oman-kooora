import * as React from 'react';
import {ActionIcon, Badge, Box, Group, Pagination, ScrollArea, Stack, Table, Text} from '@mantine/core';
import {Id} from "tabler-icons-react";
import {IconDatabaseOff} from '@tabler/icons-react';
import {useEffect, useState} from "react";
import {getImageUrl} from "../../lib/helpers/image";
import dayjs from "dayjs";

interface Props {
    list: any;
}

const PAGE_SIZE = 10;

const fullName = (item: any) =>
    [item?.first_name, item?.second_name, item?.third_name, item?.tribe].filter(Boolean).join(" ");

const formatDate = (value: any) => {
    const date = dayjs(value);
    return value && date.isValid() ? date.format("YYYY-MM-DD") : "-";
};

// Same rule as the assembly member card: a subscription runs until the end of
// its calendar year.
const isSubscriptionActive = (value: any) => {
    const date = dayjs(value);
    if (!value || !date.isValid()) return false;
    return new Date() < new Date(`${date.year() + 1}-01-01`);
};

const CardLink = ({file}: { file?: string }) => (
    file ?
        <Group spacing={6} noWrap>
            <ActionIcon
                color="green"
                variant="light"
                component="a"
                target="_blank"
                rel="noopener noreferrer"
                href={getImageUrl(file)}
            >
                <Id size={18} />
            </ActionIcon>
            <Text size={"sm"}>البطاقة</Text>
        </Group>
        : <Text size={"sm"} color={"dimmed"}>-</Text>
);

const COLUMNS: { label: string, width: number, render: (item: any) => React.ReactNode }[] = [
    {label: 'الاسم الكامل', width: 240, render: (item) => fullName(item) || "-"},
    {label: 'الرقم المدني', width: 120, render: (item) => item?.card_number || "-"},
    {label: 'رقم العضوية', width: 110, render: (item) => item?.membership_number || "-"},
    {label: 'رقم الهاتف', width: 120, render: (item) => item?.phone || "-"},
    {label: 'تاريخ الميلاد', width: 110, render: (item) => formatDate(item?.date_birth)},
    {label: 'الجنس', width: 70, render: (item) => item?.gender === "male" ? "ذكر" : item?.gender === "female" ? "أنثى" : "-"},
    {label: 'العضوية', width: 110, render: (item) => item?.type || "-"},
    {label: 'تاريخ العضوية', width: 110, render: (item) => formatDate(item?.membership_date)},
    {label: 'تاريخ الاشتراك', width: 110, render: (item) => formatDate(item?.subscription_date)},
    {label: 'حالة الاشتراك', width: 100, render: (item) => isSubscriptionActive(item?.subscription_date)
        ? <Badge color="teal">يعمل</Badge>
        : <Badge color="red">منتهي</Badge>},
    {label: 'صورة البطاقة المدنية', width: 130, render: (item) => <CardLink file={item?.nationalID} />},
    {label: 'صورة البطاقة الخلفية', width: 130, render: (item) => <CardLink file={item?.nationalIDBack} />},
];

export const AssemblyTableTeam = ({ list }: Props) => {
    const [page, setPage] = useState(1);
    const rows: any[] = Array.isArray(list) ? list : [];

    // A new team's list must start from its first page — otherwise a short list
    // opened while on page 3 of the previous one renders as an empty table.
    useEffect(() => {
        setPage(1);
    }, [list]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (rows.length === 0) {
        return (
            <Stack mih={200} align='center' justify='center'>
                <IconDatabaseOff size={"4rem"} strokeWidth={1} color={"#ADB5BD"} />
                <Text size={"md"} c={"gray.8"}>لا يوجد أعضاء لهذا الفريق</Text>
            </Stack>
        );
    }

    return (
        <Box>
            <ScrollArea type="auto" offsetScrollbars>
                <Table
                    verticalSpacing="sm"
                    horizontalSpacing="sm"
                    highlightOnHover
                    sx={{
                        minWidth: COLUMNS.reduce((sum, column) => sum + column.width, 0),
                        tableLayout: "fixed",
                        "& th, & td": {textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"},
                    }}
                >
                    <colgroup>
                        {COLUMNS.map((column) => <col key={column.label} style={{width: column.width}} />)}
                    </colgroup>
                    <thead>
                        <tr>
                            {COLUMNS.map((column) => <th key={column.label}>{column.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((item) => (
                            <tr key={item.id}>
                                {COLUMNS.map((column) => <td key={column.label}>{column.render(item)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </ScrollArea>

            <Group position="apart" mt={16} mx={10}>
                <Text size="sm" color="dimmed">{rows.length} عضو</Text>
                {totalPages > 1 ? <Pagination total={totalPages} value={page} onChange={setPage} /> : null}
            </Group>
        </Box>
    );
};
