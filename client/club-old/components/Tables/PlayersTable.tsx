import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Checkbox, Group, Menu, Pagination, Select, Stack, Text, TextInput} from '@mantine/core';
import {DotsVertical, Check, X, Id, FileCertificate, History, EditCircle, Printer, Trash, Paperclip, Upload, ChevronLeft} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Filter} from "tabler-icons-react";

import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";
import dayjs from "dayjs";
import {GiPlayerPrevious} from "react-icons/gi";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';
import {apiUrl, printUrl} from "../../lib/config";

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

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
    setSelectedRow: (id: string) => void;
    setNewStatus?: (status: string) => void;
    openDrawer: () => void;
    setSelectedDrawer?: (data: any) => void;
    setOpenTransferModal?: (open: boolean) => void;
    setOpenLoanModal?: (open: boolean) => void;
    setOpenVerifyIdentityModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
    setOpenAddAttachmentPlayerModal: (open: boolean) => void;
    setOpenShowAttachmentPlayerModal: (open: boolean) => void;
}

const allClasses = [
    {label: "الفريق الاول", value: "firstDegree"},
    {label: "تحت 23 سنة", value: "secondDegree"},
    {label: "تحت 18 سنة", value: "young"},
    {label: "تحت 16 سنة", value: "rookies"}
]

export const PlayersTable = ({ list, search, setOpenEditModal, setOpenVerifyIdentityModal, setOpenDeleteModal, setOpenChangeStatusModal, setNewStatus, setSelectedRow, openDrawer, setSelectedDrawer, setOpenTransferModal, setOpenLoanModal, hasPermission, setOpenAddAttachmentPlayerModal, setOpenShowAttachmentPlayerModal }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [valueClasseCheck, setValueClasseCheck] = useState<string[]>([]);
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
            --data-table-library_grid-template-columns:  50px 80px 150px 15% 20% 10% 10% 12% 20% 15% 10% 10% 10% 10% 30% ;
            min-height: 500px;
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
        if (valueCheck.length > 0 || valueClasseCheck.length > 0 || dateCheck.length > 0) {
            if (valueCheck.length > 0 && valueClasseCheck.length > 0 && dateCheck.length > 0) {
                let filterAllMembers = list.filter((item: any) => {
                    return valueCheck.includes(item?.team?.name) && valueClasseCheck.includes(item?.class)
                })
    
                filterAllMembers = dateFilter(dateCheck, list)

                setAllMembers({nodes: [...filterAllMembers]})
            } else {
                if (valueCheck.length > 0) {
                    let filterAllMembers1 = list.filter((item: any) => valueCheck.includes(item?.team?.name))
        
                    if (valueClasseCheck.length > 0) {
                        let filterAllMembers = filterAllMembers1.filter((item: any) => valueClasseCheck.includes(item?.class))
            
                        setAllMembers({nodes: [...filterAllMembers]})
                    } else if (dateCheck.length > 0) {
                        let filterAllMembers = dateFilter(dateCheck, filterAllMembers1)

                        setAllMembers({nodes: [...filterAllMembers]})
                    } else {
                        setAllMembers({nodes: [...filterAllMembers1]})
                    }
                } else {
                    if (valueClasseCheck.length > 0) {
                        let filterAllMembers1 = list.filter((item: any) => valueClasseCheck.includes(item?.class))
            
                        if (dateCheck.length > 0) {
                            let filterAllMembers = dateFilter(dateCheck, filterAllMembers1)
    
                            setAllMembers({nodes: [...filterAllMembers]})
                        } else {
                            setAllMembers({nodes: [...filterAllMembers1]})
                        }
                    } else {
                        let filterAllMembers = dateFilter(dateCheck, list)
                        setAllMembers({nodes: [...filterAllMembers]})
                    }
                }
            }
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [valueCheck, valueClasseCheck, dateCheck, list]);

    const dateFilter = (dateCheck: any, list: any) => {
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

        return filterAllMembers
    }

    function onPaginationChange() {
        return undefined;
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelChangeStatus = (id: string, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
    }

    const openModelTransfer = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenTransferModal === "function" && setOpenTransferModal(true)
    }

    const openModelLoan = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenLoanModal === "function" && setOpenLoanModal(true)
    }

    const onOpenDrawer = (data: any) => {
        typeof setSelectedDrawer === "function" && setSelectedDrawer(data)
        typeof openDrawer === "function" && openDrawer()
    }


    const openModelVerifyIdentity = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenVerifyIdentityModal === "function" && setOpenVerifyIdentityModal(true)
    }

    const COLUMNS = [
        {name: '#', selector: (item: any, index: number) => `${index+1}`, width: '40px' },
        {name: 'الخيارات', selector: (item: any) => (
                <Group>
                    <Menu shadow="md" width={200} position={"bottom"}>
                        <Menu.Target>
                            <ActionIcon color="gray" variant="light" >
                                <DotsVertical size={18} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {hasPermission("3")
                                ? <Menu.Item icon={<EditCircle size={14} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                                : null
                            }
                            <Menu.Item icon={<Trash size={18} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                            

                            {(item?.status == "waiting" || item?.status == "waiting_club") && hasPermission("5")
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

                            {item?.status == "accepted" && hasPermission("6")
                                ? <>
                                    <Menu.Item icon={<GiPlayerPrevious size={18} />} onClick={() => openModelTransfer(item)} >إنتقال اللاعب</Menu.Item>
                                    <Menu.Item icon={<GiPlayerPrevious size={18} />} onClick={() => openModelLoan(item)} >إعارة اللاعب</Menu.Item>
                                </>
                                : null
                            }

                            {item?.transfer?.length > 0 && hasPermission("7") 
                                ? <Menu.Item icon={<History size={14} />} onClick={() => onOpenDrawer(item?.transfer)} >تاريخ إنتقال اللاعب</Menu.Item>
                                : null
                            }

                            {hasPermission("8")
                                ? <Menu.Item component={"a"} icon={<Printer size={18} />} href={`${printUrl}/#/${item?.id}`} target={"_blank"} >طباعة البطاقة</Menu.Item>
                                : null
                            }

                        </Menu.Dropdown>
                    </Menu>
                </Group>
            ), width: '80px'
        },
        {name: 'الحالة', selector: (item: any) => (
                item?.status == "accepted"
                    ? <Badge fw={500} color="teal">مقبول</Badge>
                    : item?.status == "rejected"
                        ? <Badge fw={500} color="red">مرفوض</Badge>
                        : item?.status == "waiting"
                            ? <Badge fw={500} color="yellow">قيد انتظار تاكيد الفريق</Badge>
                            : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
            ), width: '120px'
        },
        {name: (
                <Group position={"apart"} noWrap={true}>
                    <Text>إسم الفريق</Text>
                    <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                        <Menu.Target>
                            <ActionIcon>
                                <Filter size={18} color={valueCheck.length > 0 ? "cyan" : "#4b5563"} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Checkbox.Group value={valueCheck} onChange={setValueCheck} defaultValue={[]}>
                                {allTeams.map((item: any, index) => (
                                    <Menu.Item key={index} component={"div"}>
                                        <Checkbox value={item} label={item} />
                                    </Menu.Item>
                                ))}
                            </Checkbox.Group>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            ), 
            selector: (item: any) => item?.team?.name, width: '150px'
        },
        {name: 'الاسم الكامل', selector: (item: any) => `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`, width: '200px'},
        {name: 'رقم الهاتف', selector: (item: any) => item?.person?.phone, width: '120px' },
        {name: 'الرقم المدني', selector: (item: any) => item?.person?.card_number, width: '120px' },
        {name: (
            <Group position={"apart"} noWrap={true}>
                <Text>الفئة العمرية</Text>
                <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                    <Menu.Target>
                        <ActionIcon>
                            <Filter size={18} color={valueClasseCheck.length > 0 ? "cyan" : "#4b5563"} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Checkbox.Group value={valueClasseCheck} onChange={setValueClasseCheck} defaultValue={[]}>
                            {allClasses.map((item: any, index) => (
                                <Menu.Item key={index} component={"div"}>
                                    <Checkbox value={item.value} label={item.label} />
                                </Menu.Item>
                            ))}
                        </Checkbox.Group>
                    </Menu.Dropdown>
                </Menu>
            </Group>
            ), selector: (item: any) => (
                item?.class == "firstDegree"
                    ? <Badge color="lime">الفريق الاول</Badge>
                    : item?.class == "secondDegree"
                        ? <Badge color="orange">تحت 23 سنة</Badge>
                        : item?.class == "young"
                            ? <Badge color="grape">تحت 18 سنة</Badge>
                            :  item?.class == "rookies"
                                ? <Badge color="indigo">تحت 16 سنة</Badge>
                                : null
            ), width: '180px' 
        },
        {name: 'صورة البطاقة المدنية', selector: (item: any) => (
                <>
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
                </>
            ), width: '180px'
        },
        {name: 'إستمارة موافقة ولي الامر', selector: (item: any) => (
                item.parentApproval && item.parentApproval !== "" ?
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
            ), width: '200px'
        },
        {name: (
            <Group position={"apart"} noWrap={true}>
                <Text>تاريخ الميلاد</Text>
                <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                    <Menu.Target>
                        <ActionIcon>
                            <Filter size={18} color={dateCheck.length > 0 ? "cyan" : "#4b5563"} />
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
        ), selector: (item: any) => `${item?.person?.date_birth} (${dayjs(item?.person?.date_birth).locale("ar").fromNow(true)})`, width: '180px' },
        {name: 'النشاط', selector: (item: any) => item?.activity, width: '120px' },
        {name: 'مركز لاعب', selector: (item: any) => item?.player_center, width: '120px' },
        {name: 'العمل', selector: (item: any) => item?.job, width: '120px' },
        {name: 'الملاحظة / سبب الرفض', selector: (item: any) => item?.note, width: '350px' },
    ];

    return (
        <DataTable
            //@ts-ignore
            columns={COLUMNS}
            data={allMembers.nodes}
            customStyles={customStyles}
            highlightOnHover={false}
            pagination={true}
            paginationComponentOptions={{
                rowsPerPageText: "الاسطر في كل صفحة",
                rangeSeparatorText: "من"
            }}
            noDataComponent={
                <Stack mih={300} align='center' justify='center'>
                    <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
                    <Text size={"md"} c={"gray.8"} >لا يوجد بيانات</Text>
                </Stack>
            }
            
        />
    );
};
