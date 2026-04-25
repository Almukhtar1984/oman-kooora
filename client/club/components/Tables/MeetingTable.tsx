import {apiUrl} from "../../lib/config";
import * as React from 'react';

import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Button, Checkbox, Group, Menu, Pagination, Text, Tooltip} from '@mantine/core';
import {
    DotsVertical,
    Check,
    X,
    Id,
    FileCertificate,
    History,
    EditCircle,
    Printer,
    Trash,
    ExternalLink, Message
} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Filter} from "tabler-icons-react";

import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";
import dayjs from "dayjs";
import {GiPlayerPrevious} from "react-icons/gi";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setSelectedRow?: (id: string) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenEditModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
}

export const MeetingTable = ({ list, search, setSelectedRow, setOpenDeleteModal, setOpenEditModal, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);

    const theme = useTheme({
        ...mantineTheme,
        HeaderRow: `
            .th {
                text-align: right;
                border-bottom: 1px solid #dee2e6;
                max-height: 62px;
            }
        `,
        BaseCell: `
            padding: 10px 10px;
            text-align: right;
        `,
        Table: `
            --data-table-library_grid-template-columns:  80px 30% 20% 40% 20% 10% ;
            min-height: 250px;
        `,
        BaseRow: `
            .td {
                max-height: 75px;
            }
        `
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

        let distinct: any = []
        list.map((item: any) => {
            if (distinct.findIndex((item1: any) => item1 === item?.team?.name) == -1)
                distinct.push(item?.team?.name)
        })
        setAllTeams([...distinct])
    }, [list]);

    useEffect(() => {
        if (valueCheck.length > 0) {
            const filterAllMembers = list.filter((item: any) => valueCheck.includes(item?.team?.name) )

            setAllMembers({nodes: [...filterAllMembers]})
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [valueCheck, list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search, list]);

    function onPaginationChange() {
        return undefined;
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelEdit = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }



    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>الخيارات</HeaderCell>
                                <HeaderCell>الموضوع</HeaderCell>
                                <HeaderCell>الاعضاء الحضور</HeaderCell>
                                <HeaderCell>الوصف</HeaderCell>
                                <HeaderCell>المرفقات</HeaderCell>
                                <HeaderCell>التاريخ</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>
                                        {<Group>
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
                                        </Group>}
                                    </Cell>
                                    <Cell>
                                        {item?.subject}
                                    </Cell>
                                    <Cell>{item?.names_attending}</Cell>
                                    <Cell>{item?.description}</Cell>
                                    <Cell>
                                        <Group spacing={5}>
                                            {item?.attachment?.map((item: any) => (
                                                <Button size={"xs"} key={item?.id} component={"a"} target={"_blank"} rel="noopener noreferrer" href={`${apiUrl}/files/${item.content}`} >
                                                    تحميل
                                                </Button>
                                            ))}
                                        </Group>
                                    </Cell>
                                    <Cell>
                                        {/*<Tooltip label={item?.createdAt}>*/}
                                            {dayjs(item?.createdAt).locale("ar").fromNow()}
                                        {/*</Tooltip>*/}
                                    </Cell>
                                </Row>
                            ))}
                        </Body>
                    </>
                )}
            </Table>

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
