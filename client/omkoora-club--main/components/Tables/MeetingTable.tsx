import * as React from 'react';

import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Button, Checkbox, Group, Menu, Pagination, Text, Tooltip,Stack} from '@mantine/core';
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
import {TechnicalItemModel} from "../Modal/index"
import { useMediaQuery } from "@mantine/hooks";
import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setSelectedRow?: (id: string) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setOpenEditModal?: (open: boolean) => void;
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

export const MeetingTable = ({ list, search, setSelectedRow, setOpenDeleteModal, setOpenEditModal, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);
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
    }, [valueCheck]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelEdit = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }


    const MOBILE_COLUMNS = [
        {
          name: 'تفاصيل الاجتماع',
          selector: (item) => (
            <Group position="apart" noWrap align="center">
              <div style={{ width: '100%', marginTop: '10px' }}>
                <Text weight={500} size="sm">
                  الموضوع: {item?.subject || 'غير متوفر'}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                  الأعضاء الحضور: {item?.names_attending || 'غير متوفر'}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                  الوصف: {item?.description || 'غير متوفر'}
                </Text>
                <Group spacing={5} mt="xs">
                  {item?.attachment?.length > 0 ? (
                    <>
                      <Text size="xs" color="dimmed">
                        المرفقات:
                      </Text>
                      {item?.attachment?.map((attachment) => (
                        <Button
                          size="xs"
                          key={attachment?.id}
                          component="a"
                          target="_blank"
                          href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${attachment.content}`}
                        >
                          تحميل المرفق
                        </Button>
                      ))}
                    </>
                  ) : (
                    <Text size="xs" color="dimmed">
                      لا توجد مرفقات
                    </Text>
                  )}
                </Group>
                <Text size="xs" mt="xs" color="dimmed">
                  التاريخ: {dayjs(item?.createdAt).locale('ar').format('YYYY-MM-DD') || 'غير متوفر'}
                </Text>
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
                  {hasPermission('3') && (
                    <Menu.Item icon={<ExternalLink size={14} />} onClick={() => openModelEdit(item?.id)}>
                      تعديل
                    </Menu.Item>
                  )}
                  {hasPermission('4') && (
                    <Menu.Item icon={<Message size={14} />} onClick={() => openModelDelete(item?.id)}>
                      حذف
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
                                                <Button size={"xs"} key={item?.id} component={"a"} target={"_blank"} href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${item.content}`} >
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