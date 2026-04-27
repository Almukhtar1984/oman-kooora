import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Group, Menu, Pagination} from '@mantine/core';
import {DotsVertical, Check, X, Calendar, ArrowBack} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

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
            --data-table-library_grid-template-columns:  80px 150px 15% 15% 10% 12% 12% 10% 20% 12% 10% 10% 10% 12% 10% 25% ;
            min-height: 250px;
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

    const COLUMNS = [
        {label: 'الخيارات', renderCell: (item) => (
                <Group>
                    <Menu shadow="md" width={200} position={"bottom"}>
                        <Menu.Target>
                            <ActionIcon disabled={item?.status !== "waiting_club_1" && item?.status !== "waiting_team"} color="gray" variant="light" >
                                <DotsVertical size={18} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {item?.status == "waiting_club_1" && item?.team_to?.id === idTeam
                                ? <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item, "rejected")} >رفض</Menu.Item>
                                : item?.status == "waiting_team" && item?.team_to?.id === idTeam
                                    ? <>
                                        <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item, "rejected")} >رفض</Menu.Item>
                                        <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item, "waiting_club_1")} >قبول</Menu.Item>
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
        {label: 'حالة الانتقال', renderCell: (item) => (
            item?.status == "accepted" ? <Badge fw={500} color="teal">مقبول من النادي</Badge>
                : item?.status == "rejected" ? <Badge fw={500} color="red">مرفوض</Badge>
                    : item?.status == "waiting_club_1" ? <Badge fw={500} color="teal">مقبول من الفريق</Badge>
                        : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
        )},
        {label: 'إسم الفريق القديم', renderCell: (item) => `${item?.team_from?.name}`  },
        {label: 'إسم الفريق الجديد', renderCell: (item) => `${item?.team_to?.name}`  },
        {label: '', renderCell: (item) => (
            item?.team_to?.id === idTeam ? <Badge fw={500} color="teal">قادم</Badge>
                : item?.team_from?.id === idTeam ? <Badge fw={500} color="red">طالع</Badge>
                    : null
        )},
        {label: 'تاريح بداية الإعارة', renderCell: (item) => item?.date_start !== "1970-01-01" ? `${item?.date_start}` : null  },
        {label: 'تاريح نهاية الإعارة', renderCell: (item) => item?.date_end !== "1970-01-01" ? `${item?.date_end}` : null  },
        {label: 'حالة الإعارة', renderCell: (item) => (
            item?.date_end === "1970-01-01"
                ? null
                : new Date(item?.date_end) > new Date()
                    ? <Badge fw={500} color="green">مستمر</Badge>
                    : <Badge fw={500} color="red">منتهي</Badge>
        )},

        {label: 'الاسم الكامل', renderCell: (item) => `${item?.player?.person?.first_name} ${item?.player?.person?.second_name} ${item?.player?.person?.third_name} ${item?.player?.person?.tribe}` },
        {label: 'رقم الهاتف', renderCell: (item) => item?.player?.person?.phone },
        {label: 'رقم البطاقه', renderCell: (item) => item?.player?.person?.card_number },
        {label: 'تاريخ الميلاد', renderCell: (item) => item?.player?.person?.date_birth },
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