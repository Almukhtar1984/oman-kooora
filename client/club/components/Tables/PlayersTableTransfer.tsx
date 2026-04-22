import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Group, Menu, Pagination, Tooltip} from '@mantine/core';
import {DotsVertical, Check, X} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {GiPlayerNext, GiPlayerPrevious} from "react-icons/gi";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (data: any) => void;
    idClub?: string;
    hasPermission: (permission: string) => boolean;
}

export const PlayersTableTransfer = ({ idClub, list, search, setOpenEditModal, setSelectedRow, hasPermission }: Props) => {
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
            --data-table-library_grid-template-columns:  80px 200px 60px 12% 12% 20% 10% 10% 10% 10% 10% 10% 10% 30% ;
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

    const openModelUpdate = (data: any, status: string) => {
        console.log({data, status})
        typeof setSelectedRow === "function" && setSelectedRow({
            ...data,
            status
        })
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const COLUMNS = [
        {label: 'الخيارات', renderCell: (item) => (
            <Group>
                <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon disabled={item?.lastTransfer?.status !== "waiting"} color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {item?.lastTransfer?.status == "waiting" && item?.lastTransfer?.club_to?.id === idClub && hasPermission("2")
                            ? <>
                                <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item?.lastTransfer, "rejected")} >رفض</Menu.Item>
                                <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item?.lastTransfer, "accepted")} >قبول</Menu.Item>
                            </>
                            : null
                        }
                    </Menu.Dropdown>
                </Menu>
            </Group>
        )},
        {label: 'حالة الانتقال', renderCell: (item) => (
            item?.lastTransfer?.status == "accepted" ? <Badge fw={400} color="teal">مقبول</Badge>
                : item?.lastTransfer?.status == "rejected" ? <Badge fw={400} color="red">مرفوض</Badge>
                    : item?.lastTransfer?.status == "waiting" && item?.lastTransfer?.club_to?.id === idClub
                        ? <Badge fw={400} color="yellow">بانتظار تاكيدك</Badge>
                        : <Badge fw={400} color="yellow">بانتظار تاكيد النادي المستقبل</Badge>
        )},

        {label: '', renderCell: (item) => (
            item?.lastTransfer?.team_from?.club?.id !== idClub
                ? <Tooltip label={"لاعب ذاهب"}><GiPlayerPrevious size={22} color={"red"} /></Tooltip>
                : item?.lastTransfer?.team_to?.club?.id !== idClub
                    ? <Tooltip label={"لاعب قادم"}><GiPlayerNext size={22} color={"green"} /></Tooltip>
                    : null
        )},
        {label: 'إسم الفريق القديم', renderCell: (item) => `${item?.lastTransfer?.team_from?.name}`  },
        {label: 'إسم الفريق الجديد', renderCell: (item) => `${item?.lastTransfer?.team_to?.name}`  },
        {label: 'الاسم الكامل', renderCell: (item) => `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`  },
        {label: 'رقم الهاتف', renderCell: (item) => item?.person?.phone },
        {label: 'الرقم المدني', renderCell: (item) => item?.person?.card_number },
        {label: 'الفئة العمرية', renderCell: (item) => (
            item?.class == "firstDegree"
                ? <Badge color="lime">الدرجة الاولى</Badge>
                : item?.class == "young"
                    ? <Badge color="grape">الشباب</Badge>
                    :  item?.class == "rookies"
                        ? <Badge color="indigo">الناشئين</Badge>
                        : null

        )},
        {label: 'تاريخ الميلاد', renderCell: (item) => item?.person?.date_birth },
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