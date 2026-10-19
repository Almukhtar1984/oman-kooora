import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {Badge, Group, Pagination} from '@mantine/core';
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

// Stage badge from the team's point of view — the team tracks where its request
// is in the chain (team → own club → destination club → team). Read-only.
export const transferStageBadge = (status: string) => {
    switch (status) {
        case "accepted": return <Badge fw={500} color="teal">مكتمل</Badge>;
        case "rejected": return <Badge fw={500} color="red">مرفوض</Badge>;
        case "waiting_club_from": return <Badge fw={500} color="yellow">بانتظار نادي اللاعب</Badge>;
        case "waiting_club_to": return <Badge fw={500} color="orange">بانتظار النادي المستقبِل</Badge>;
        default: return <Badge fw={500} color="yellow">قيد الانتظار</Badge>;
    }
};

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    idTeam: string
}

export const PlayersTableTransfer = ({ list, search, idTeam }: Props) => {
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
            --data-table-library_grid-template-columns:  170px 15% 15% 90px 20% 90px 12% 12% 12% 10% 10% 10% 20% ;
            min-height: 150px;
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

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const COLUMNS = [
        {label: 'حالة الانتقال', renderCell: (item) => transferStageBadge(item?.status) },
        {label: 'إسم الفريق القديم', renderCell: (item) => `${item?.team_from?.name ?? ''}`  },
        {label: 'إسم الفريق الجديد', renderCell: (item) => `${item?.team_to?.name ?? ''}`  },

        {label: '', renderCell: (item) => (
            item?.team_to?.id === idTeam ? <Badge fw={500} color="teal">قادم</Badge>
                : item?.team_from?.id === idTeam ? <Badge fw={500} color="red">طالع</Badge>
                    : null
        )},

        {label: 'الاسم الكامل', renderCell: (item) => { const s = item?.player || item?.technicalApparatus; return `${s?.person?.first_name ?? ''} ${s?.person?.second_name ?? ''} ${s?.person?.third_name ?? ''} ${s?.person?.tribe ?? ''}`; } },
        {label: 'النوع', renderCell: (item) => item?.technicalApparatus ? 'جهاز فني' : 'لاعب' },
        {label: 'رقم الهاتف', renderCell: (item) => (item?.player || item?.technicalApparatus)?.person?.phone },
        {label: 'رقم البطاقه', renderCell: (item) => (item?.player || item?.technicalApparatus)?.person?.card_number },
        {label: 'تاريخ الميلاد', renderCell: (item) => (item?.player || item?.technicalApparatus)?.person?.date_birth },
        {label: 'النشاط', renderCell: (item) => item?.activity },
        {label: 'مركز لاعب', renderCell: (item) => item?.player_center },
        {label: 'العمل', renderCell: (item) => item?.job },
        {label: 'الملاحظة / سبب الرفض', renderCell: (item) => item?.note },
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