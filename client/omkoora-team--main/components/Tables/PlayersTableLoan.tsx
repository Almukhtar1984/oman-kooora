import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Group, Menu, Pagination} from '@mantine/core';
import {DotsVertical, Check, X, Calendar, ArrowBack} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {dateCell, gridTemplate, TRANSFER_SEARCH_KEYS} from "../../lib/helpers/tableGrid";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenReturningModal?: (open: boolean) => void;
    setOpenRenewModal?: (open: boolean) => void;
    setSelectedRow?: (data: any) => void;
    idTeam: string
}

export const PlayersTableLoan = ({ list, search, setOpenEditModal, setSelectedRow, setOpenRenewModal, setOpenReturningModal, idTeam }: Props) => {
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

    const openModelUpdate = (data: any, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow({
            ...data,
            status
        })
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelRenew = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow({...data})
        typeof setOpenRenewModal === "function" && setOpenRenewModal(true)
    }

    const openModelReturning = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow({...data})
        typeof setOpenReturningModal === "function" && setOpenReturningModal(true)
    }

    const member = (item: any) => item?.player || item?.technicalApparatus;

    const teamWithClub = (team: any) =>
        team?.name ? (team?.club?.name ? `${team.name} — ${team.club.name}` : team.name) : '';

    // «مستمر/منتهي» describes a loan that took effect — a pending or refused
    // request has no running loan, and a loan without an end date has no end.
    const loanState = (item: any) => {
        if (item?.status !== "accepted" || dateCell(item?.date_end) === "—") return "—";
        return new Date(item.date_end) > new Date()
            ? <Badge fw={500} color="green">مستمر</Badge>
            : <Badge fw={500} color="red">منتهي</Badge>;
    };

    const COLUMNS = [
        {label: 'الخيارات', width: '80px', renderCell: (item) => (
                <Group>
                    <Menu withinPortal shadow="md" width={200} position={"bottom"}>
                        <Menu.Target>
                            <ActionIcon disabled={item?.status !== "waiting" && item?.status !== "accepted"} color="gray" variant="light" >
                                <DotsVertical size={18} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {/* The receiving team accepts or rejects an incoming loan request. */}
                            {item?.status == "waiting" && item?.team_to?.id === idTeam
                                ? <>
                                    <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item, "rejected")} >رفض</Menu.Item>
                                    <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item, "accepted")} >قبول</Menu.Item>
                                </>
                                : null
                            }

                            {new Date(item?.date_end) > new Date() && item?.status == "accepted"
                                ? <>
                                    <Menu.Item icon={<Calendar size={14} />} onClick={() => openModelRenew(item)} >تجديد العقد</Menu.Item>
                                    <Menu.Item icon={<ArrowBack size={14} />} onClick={() => openModelReturning(item)} >رجوع الى النادي القديم</Menu.Item>
                                </>
                                : null
                            }
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            )
        },
        {label: 'حالة الطلب', width: '180px', renderCell: (item) => (
            item?.status == "accepted" ? <Badge fw={500} color="teal">مقبول</Badge>
                : item?.status == "rejected" ? <Badge fw={500} color="red">مرفوض</Badge>
                    : item?.status == "waiting_club_from" ? <Badge fw={500} color="yellow">بانتظار نادي اللاعب</Badge>
                        : item?.status == "waiting_club_to" ? <Badge fw={500} color="orange">بانتظار النادي المستقبِل</Badge>
                        : item?.status == "waiting_payment" ? <Badge fw={500} color="orange">بانتظار الرسوم والاعتماد</Badge>
                            : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
        )},
        {label: 'إسم الفريق القديم', width: '220px', renderCell: (item) => teamWithClub(item?.team_from) || '—' },
        {label: 'إسم الفريق الجديد', width: '220px', renderCell: (item) => teamWithClub(item?.team_to) || item?.club_to?.name || '—' },
        {label: '', width: '80px', renderCell: (item) => (
            item?.team_to?.id === idTeam ? <Badge fw={500} color="teal">قادم</Badge>
                : item?.team_from?.id === idTeam ? <Badge fw={500} color="red">طالع</Badge>
                    : null
        )},
        {label: 'تاريخ بداية الإعارة', width: '130px', renderCell: (item) => dateCell(item?.date_start) },
        {label: 'تاريخ نهاية الإعارة', width: '130px', renderCell: (item) => dateCell(item?.date_end) },
        {label: 'حالة الإعارة', width: '110px', renderCell: (item) => loanState(item) },

        {label: 'الاسم الكامل', width: '240px', renderCell: (item) => { const s = member(item); return `${s?.person?.first_name ?? ''} ${s?.person?.second_name ?? ''} ${s?.person?.third_name ?? ''} ${s?.person?.tribe ?? ''}`; } },
        {label: 'النوع', width: '90px', renderCell: (item) => item?.technicalApparatus ? 'جهاز فني' : 'لاعب' },
        {label: 'رقم الهاتف', width: '130px', renderCell: (item) => member(item)?.person?.phone },
        {label: 'رقم البطاقه', width: '130px', renderCell: (item) => member(item)?.person?.card_number },
        {label: 'تاريخ الميلاد', width: '130px', renderCell: (item) => member(item)?.person?.date_birth },
        // These live on the player (or the staff member), not on the loan.
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
            min-height: 250px;
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