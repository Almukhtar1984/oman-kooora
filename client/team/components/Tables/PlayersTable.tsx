import * as React from 'react';

import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";

import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Avatar, Badge, Checkbox, Group, Menu, Pagination, Text} from '@mantine/core';
import {DotsVertical, FileCertificate, Id, Printer, Upload, Paperclip, EditCircle, Trash} from "tabler-icons-react";
import {Filter} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {apiUrl, printUrl} from "../../lib/config";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow: (id: any) => void;
    setOpenAddImageModal?: (open: boolean) => void;
    setOpenTransferModal?: (open: boolean) => void;
    setOpenLoanModal?: (open: boolean) => void;
    setOpenVerifyIdentityModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
    setOpenAddAttachmentPlayerModal: (open: boolean) => void;
    setOpenShowAttachmentPlayerModal: (open: boolean) => void;
}


export const PlayersTable = ({ list, search, setOpenEditModal, setOpenVerifyIdentityModal, setOpenDeleteModal, setSelectedRow, setOpenAddImageModal, setOpenTransferModal, setOpenLoanModal, hasPermission, setOpenAddAttachmentPlayerModal, setOpenShowAttachmentPlayerModal }: Props) => {
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
            --data-table-library_grid-template-columns:  50px 150px 20% 10% 10% 15% 10% 10% 10% 10% 20% 15% 150px 30% 100px;
            min-height: 500px;
            align-content: center;
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
            if (distinct.findIndex((item1: any) => item1 === item?.person?.date_birth) == -1)
                distinct.push(item?.person?.date_birth)
        })


        setAllTeams([...distinct])
    }, [list]);

    useEffect(() => {
        if (valueCheck.length > 0) {
            const filterAllMembers = list.filter((item: any) => valueCheck.includes(item?.person?.date_birth) )

            setAllMembers({nodes: [...filterAllMembers]})
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [valueCheck, list]);

    useEffect(() => {
        if (dateCheck.length > 0) {
            let listDates: string[] = []

            dateCheck.map((item: string) => {
                listDates = [...listDates, ...item.split("-")]
            })

            // @ts-ignore
            const dateMin = dayjs().subtract(Math.min(...listDates), 'year').format("YYYY-MM-DD")
            // @ts-ignore
            const dateMax = dayjs().subtract(Math.max(...listDates), 'year').format("YYYY-MM-DD")


            let filterAllMembers: any[] = []
            if (listDates.includes(">23")) {
                filterAllMembers = list.filter((item: any) => item?.person?.date_birth < dateMax )
            } else {
                filterAllMembers = list.filter((item: any) => dateMin > item?.person?.date_birth && item?.person?.date_birth > dateMax)
            }

            setAllMembers({nodes: [...filterAllMembers]})
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [dateCheck, list]);

    function onPaginationChange() {
        return undefined;
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelAddImage = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenAddImageModal === "function" && setOpenAddImageModal(true)
    }

    const openModelTransfer = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenTransferModal === "function" && setOpenTransferModal(true)
    }

    const openModelLoan = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenLoanModal === "function" && setOpenLoanModal(true)
    }

    const openModelVerifyIdentity = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenVerifyIdentityModal === "function" && setOpenVerifyIdentityModal(true)
    }

    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>#</HeaderCell>
                                <HeaderCell>الصورة الشخصية</HeaderCell>
                                <HeaderCell>الاسم الكامل</HeaderCell>
                                <HeaderCell>رقم الهاتف</HeaderCell>
                                <HeaderCell>الرقم المدني</HeaderCell>
                                <HeaderCell>
                                    <Group position={"apart"} noWrap={true}>
                                        <Text>تاريخ الميلاد</Text>
                                        <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                                            <Menu.Target>
                                                <ActionIcon>
                                                    <Filter size={18} />
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Checkbox.Group value={dateCheck} onChange={setDateCheck} defaultValue={[]}>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"1-16"} label={"تحت 16 سنة"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"16-18"} label={"تحت 18 سنة"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"18-23"} label={"تحت 23 سنة"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={">23"} label={"فوق 23 سنة"} />
                                                    </Menu.Item>
                                                </Checkbox.Group>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </HeaderCell>
                                <HeaderCell>الفئة العمرية</HeaderCell>
                                <HeaderCell>النشاط</HeaderCell>
                                <HeaderCell>مركز لاعب</HeaderCell>
                                <HeaderCell>العمل</HeaderCell>
                                <HeaderCell>صورة البطاقة المدنية</HeaderCell>
                                <HeaderCell>إستمارة موافقة ولي الامر</HeaderCell>
                                <HeaderCell>الحالة</HeaderCell>
                                <HeaderCell>الملاحظة / سبب الرفض</HeaderCell>
                                <HeaderCell>الخيارات</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>{index+1}</Cell>
                                    <Cell>
                                        <Avatar
                                            w={50} h={50}
                                            src={item?.person?.personal_picture ? `${apiUrl}/images/${item?.person?.personal_picture}` : ""}
                                            alt="it's me"
                                        />
                                    </Cell>
                                    <Cell>{`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}</Cell>
                                    <Cell>{item?.person?.phone}</Cell>
                                    <Cell>{item?.person?.card_number}</Cell>
                                    <Cell>{item?.person?.date_birth} ({dayjs(item?.person?.date_birth).locale("ar").fromNow(true)})</Cell>
                                    <Cell>
                                        {item?.class == "firstDegree"
                                            ? <Badge color="lime">الفريق الاول</Badge>
                                            : item?.class == "secondDegree"
                                                ? <Badge color="orange">تحت 23 سنة</Badge>
                                                : item?.class == "young"
                                                    ? <Badge color="grape">تحت 18 سنة</Badge>
                                                    :  item?.class == "rookies"
                                                        ? <Badge color="indigo">تحت 16 سنة</Badge>
                                                        : null
                                        }
                                    </Cell>
                                    <Cell>{item?.activity}</Cell>
                                    <Cell>{item?.player_center}</Cell>
                                    <Cell>{item?.job}</Cell>
                                    <Cell>
                                        { item.nationalID && item.nationalID !== "" ?
                                            <Group position={"center"}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="light"

                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`${apiUrl}/files/${item.nationalID}`}
                                                >
                                                    <Id size={18} />
                                                </ActionIcon>
                                                <Text size={"sm"}>واجهة امامية</Text>
                                            </Group>
                                            : null
                                        }
                                        { item.nationalIDBack && item.nationalIDBack !== "" ?
                                            <Group position={"center"}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="light"

                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`${apiUrl}/files/${item.nationalIDBack}`}
                                                >
                                                    <Id size={18} />
                                                </ActionIcon>
                                                <Text size={"sm"}>واجهة خلفية</Text>
                                            </Group>
                                            : null
                                        }
                                    </Cell>

                                    <Cell>
                                        {item.parentApproval && item.parentApproval !== "" ?
                                            <Group position={"center"}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="light"

                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`${apiUrl}/files/${item.parentApproval}`}
                                                >
                                                    <FileCertificate size={18} />
                                                </ActionIcon>
                                                <Text size={"sm"}>الاستمارة</Text>
                                            </Group>
                                            : null
                                        }
                                    </Cell>

                                    <Cell>
                                        {item?.status == "accepted"
                                            ? <Badge fw={500} color="teal">مقبول</Badge>
                                            : item?.status == "rejected"
                                                ? <Badge fw={500} color="red">مرفوض</Badge>
                                                : item?.status == "waiting_club"
                                                    ? <Badge fw={500} color="yellow">قيد انتظار تاكيد النادي</Badge>
                                                    : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
                                        }
                                    </Cell>
                                    <Cell>{item?.note}</Cell>
                                    <Cell>
                                        <Group>
                                            <Menu shadow="md" width={200} position={"bottom"} offset={0}>
                                                <Menu.Target>
                                                    <ActionIcon color="gray" variant="light" >
                                                        <DotsVertical size={18} />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    {item?.status !== "accepted" && item?.status !== "waiting_club"
                                                        ? <Menu.Item icon={<EditCircle size={18} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                                                        : null
                                                    }

                                                    {hasPermission("3")
                                                        ? <Menu.Item icon={<Upload size={18} />} onClick={() => openModelAddImage(item?.person?.id)} >إضافة صورة</Menu.Item>
                                                        : null
                                                    }

                                                    {item?.status == "waiting" && hasPermission("4")
                                                        ? <Menu.Item icon={<Id size={14} />} onClick={() => openModelVerifyIdentity(item)} >تحقق</Menu.Item>
                                                        : null
                                                    }

                                                    {item.attachmentsPlayer.length > 0 ?
                                                        <Menu.Item
                                                            icon={<Paperclip size={18} />}
                                                            onClick={() => {
                                                                setSelectedRow(item)
                                                                setOpenShowAttachmentPlayerModal(true)
                                                            }}
                                                        >المرفقات</Menu.Item>
                                                        : null
                                                    }

                                                    <Menu.Item
                                                        icon={<Upload size={18} />}
                                                        onClick={() => {
                                                            setSelectedRow(item?.id)
                                                            setOpenAddAttachmentPlayerModal(true)
                                                        }}
                                                    >إضافة مرفقات</Menu.Item>

                                                    {hasPermission("5")
                                                        ? <Menu.Item
                                                            component={"a"} icon={<Printer size={18} />}
                                                            href={`${printUrl}/#/${item?.id}`}
                                                            target={"_blank"}
                                                        >طباعة البطاقة</Menu.Item>
                                                        : null
                                                    }

                                                    {item?.status !== "accepted" && item?.status !== "waiting_club"
                                                        ? <Menu.Item icon={<Trash size={18} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                        : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
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
