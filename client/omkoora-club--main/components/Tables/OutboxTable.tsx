import * as React from 'react';

import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Checkbox, Group, Menu, Pagination, Text, Tooltip,Stack} from '@mantine/core';
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
    ExternalLink, Message,InfoCircle
} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Filter} from "tabler-icons-react";

import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";
import dayjs from "dayjs";
import { IconDatabaseOff } from '@tabler/icons-react';
import {TechnicalItemModel} from "../Modal/index"
import { useMediaQuery } from "@mantine/hooks";
import DataTable, {TableStyles} from 'react-data-table-component';

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    openDrawer: () => void;
    setSelectedDrawer?: (data: any) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenShowModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
}

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

export const OutboxTable = ({ list, search, setOpenEditModal, setOpenChangeStatusModal, setNewStatus, setSelectedRow, openDrawer, setSelectedDrawer, setOpenDeleteModal, setOpenShowModal, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);
    const [statusCheck, setStatusCheck] = useState<string[]>([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpened, setModalOpened] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const openModal = (item) => {
        setSelectedItem(item);
        setModalOpened(true);
      };
    
      const closeModal = () => {
        setSelectedItem(null);
        setModalOpened(false);
      };


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
            --data-table-library_grid-template-columns:  80px 10% 20% 50% 20% ;
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
    }, [valueCheck]);

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
    }, [dateCheck]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelShow = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenShowModal === "function" && setOpenShowModal(true)
    }

    const openModelComment = (id: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof openDrawer === "function" && openDrawer()
    }

    const openModelChangeStatus = (id: string, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
    }

    const onOpenDrawer = (data: any) => {
        typeof setSelectedDrawer === "function" && setSelectedDrawer(data)
        typeof openDrawer === "function" && openDrawer()
    }

    const MOBILE_COLUMNS = [
        {
          name: 'تفاصيل الرسالة',
          selector: (item) => (
            <Group position="apart" noWrap align="center">
          
              <div style={{ width: '100%',marginTop:"10px" }}>
                <Text weight={500} size="sm">
                  المرسل: {item?.team_sender?.name || 'غير متوفر'}
                </Text>
                <Group position="apart" noWrap mt={4}>
                  <Text size="xs" color="dimmed">
                    الموضوع: {item?.subject || 'غير متوفر'}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {item?.createdAt ? dayjs(item.createdAt).format("YYYY-MM-DD HH:mm") : 'غير متوفر'}
                  </Text>
                </Group>
                <Badge
                color={
                  item?.priority === 'normal'
                    ? 'green'
                    : item?.priority === 'urgent'
                    ? 'violet'
                    : 'red'
                }
                style={{ marginLeft: '8px', marginTop:"10px",marginBottom:"10px" }}
              >
                {item?.priority === 'normal'
                  ? 'عادي'
                  : item?.priority === 'urgent'
                  ? 'عاجل'
                  : 'عاجل جدا'}
              </Badge>
              </div>
              
            </Group>
          ),
          width: 'auto',
        },
        {
          name: '',
          selector: (item) => (
            <Group>
              <Menu shadow="md" width={200} position="bottom">
                <Menu.Target>
                  <ActionIcon color="gray" variant="light">
                    <DotsVertical size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {hasPermission('2') && (
                    <Menu.Item icon={<ExternalLink size={14} />} onClick={() => openModelShow(item?.id)}>
                      فتح
                    </Menu.Item>
                  )}
                  {hasPermission('3') && (
                    <Menu.Item icon={<Message size={14} />} onClick={() => openModelComment(item?.id)}>
                      التعليقات
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          ),
          width: '80px',
        },
      ];
      

    if(isMobile){ return (
        <>
        <DataTable
            //@ts-ignore
            columns={MOBILE_COLUMNS}
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
       
          </>
    );}

    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>الخيارات</HeaderCell>
                                <HeaderCell>الاولوية</HeaderCell>
                                <HeaderCell>المرسل اليه</HeaderCell>
                                <HeaderCell>الموضوع</HeaderCell>
                                <HeaderCell>تاريخ الارسال</HeaderCell>
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
                                                    {hasPermission("4")
                                                        ? <Menu.Item icon={<ExternalLink size={14} />} onClick={() => openModelShow(item?.id)} >فتح</Menu.Item>
                                                        : null
                                                    }
                                                    {hasPermission("5")
                                                        ? <Menu.Item icon={<Message size={14} />} onClick={() => openModelComment(item?.id)} >التعليقات</Menu.Item>
                                                        : null
                                                    }
                                                    {hasPermission("3")
                                                        ? <Menu.Item icon={<Trash size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                        : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>}
                                    </Cell>
                                    <Cell>
                                        {item?.priority === "normal"
                                            ? <Badge color={"green"} >عادي</Badge>
                                            : item?.priority === "urgent"
                                                ? <Badge color="violet">عاجل</Badge>
                                                : <Badge color="red">عاجل جدا</Badge>
                                        }
                                    </Cell>
                                    <Cell>
                                        {item?.team_receiver
                                            ? item?.team_receiver?.name
                                            : "الى الجميع"
                                        }
                                    </Cell>
                                    <Cell>{item?.subject}</Cell>
                                    <Cell>
                                        {item?.createdAt ? dayjs(item.createdAt).format("YYYY-MM-DD HH:mm") : '-'}
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