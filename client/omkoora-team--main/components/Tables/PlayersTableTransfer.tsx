import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {Badge, Group, Pagination} from '@mantine/core';
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {dateCell, gridTemplate, TRANSFER_SEARCH_KEYS} from "../../lib/helpers/tableGrid";

// Stage badge from the team's point of view — the team tracks where its request
// is in the chain (team → own club → destination club → team). Read-only.
export const transferStageBadge = (status: string) => {
    switch (status) {
        case "accepted": return <Badge fw={500} color="teal">مكتمل</Badge>;
        case "rejected": return <Badge fw={500} color="red">مرفوض</Badge>;
        case "waiting_club_from": return <Badge fw={500} color="yellow">بانتظار نادي اللاعب</Badge>;
        case "waiting_club_to": return <Badge fw={500} color="orange">بانتظار النادي المستقبِل</Badge>;
        // اتفق الناديان؛ بقي السداد والاعتماد النهائي، وعنده ينتقل اللاعب.
        case "waiting_payment": return <Badge fw={500} color="orange">بانتظار الرسوم والاعتماد</Badge>;
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
        const filterAllMembers = searchSortedData(list, TRANSFER_SEARCH_KEYS, search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const teamWithClub = (team: any) =>
        team?.name ? (team?.club?.name ? `${team.name} — ${team.club.name}` : team.name) : '';

    const member = (item: any) => item?.player || item?.technicalApparatus;

    const COLUMNS = [
        {label: 'حالة الانتقال', width: '180px', renderCell: (item) => transferStageBadge(item?.status) },
        // The club, not just the team: several clubs have a team of the same
        // name, so two rows reading "فريق الاتحاد" can be two different teams.
        {label: 'إسم الفريق القديم', width: '220px', renderCell: (item) => teamWithClub(item?.team_from) || '—' },
        {label: 'إسم الفريق الجديد', width: '220px', renderCell: (item) => teamWithClub(item?.team_to) || item?.club_to?.name || '—' },
        // Repeated rows for one player are its history; the date tells them apart.
        {label: 'تاريخ الانتقال', width: '120px', renderCell: (item) => dateCell(item?.date_start) },

        {label: '', width: '80px', renderCell: (item) => (
            item?.team_to?.id === idTeam ? <Badge fw={500} color="teal">قادم</Badge>
                : item?.team_from?.id === idTeam ? <Badge fw={500} color="red">طالع</Badge>
                    : null
        )},

        {label: 'الاسم الكامل', width: '240px', renderCell: (item) => { const s = member(item); return `${s?.person?.first_name ?? ''} ${s?.person?.second_name ?? ''} ${s?.person?.third_name ?? ''} ${s?.person?.tribe ?? ''}`; } },
        {label: 'النوع', width: '90px', renderCell: (item) => item?.technicalApparatus ? 'جهاز فني' : 'لاعب' },
        {label: 'رقم الهاتف', width: '130px', renderCell: (item) => member(item)?.person?.phone },
        {label: 'رقم البطاقه', width: '130px', renderCell: (item) => member(item)?.person?.card_number },
        {label: 'تاريخ الميلاد', width: '130px', renderCell: (item) => member(item)?.person?.date_birth },
        // These live on the player (or the staff member), not on the transfer.
        {label: 'النشاط', width: '120px', renderCell: (item) => item?.player?.activity ?? item?.technicalApparatus?.classification },
        {label: 'مركز لاعب', width: '120px', renderCell: (item) => item?.player?.player_center },
        {label: 'العمل', width: '120px', renderCell: (item) => item?.player?.job ?? item?.technicalApparatus?.occupation },
    ];

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
            --data-table-library_grid-template-columns: ${gridTemplate(COLUMNS)};
            min-height: 150px;
        `,
    });

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