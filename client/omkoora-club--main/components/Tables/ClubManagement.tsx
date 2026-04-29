import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Avatar, Badge, Checkbox, Group, Menu, Pagination, Text,Stack} from '@mantine/core';
import {
    Check,
    DotsVertical, Edit,
    EditCircle,
    FileCertificate,
    Filter,
    History,
    Id,
    Printer,
    Trash,
    X,
    InfoCircle
} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Body, Cell, Header, HeaderCell, HeaderRow, Row, Table} from "@table-library/react-table-library/table";
import {GiPlayerPrevious} from "react-icons/gi";
import { IconDatabaseOff } from '@tabler/icons-react';
import {ClubMangModel} from "../Modal/index"
import { useMediaQuery } from "@mantine/hooks";
import DataTable, {TableStyles} from 'react-data-table-component';
const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
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

export const ClubManagementTable = ({ list, setOpenEditModal, setOpenDeleteModal, setSelectedRow, hasPermission, }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    console.log("list:",list)

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
            }
        `,
        BaseCell: `
            padding: 10px 10px;
            text-align: right;
        `,
        Table: `
            --data-table-library_grid-template-columns: 80px 20% 8% 12% 12% 12% 12% 12% 25%;
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

    const MOBILE_COLUMNS = [
        {
          name: 'تفاصيل الصلاحيات',
          selector: (item) => (
            <Group position="apart" noWrap align="center" style={{ padding: "10px 0" }}>
              <ActionIcon
                color="blue"
                variant="light"
                onClick={() => openModal(item)}
                title="معلومات الصلاحيات"
              >
                <InfoCircle size={18} />
              </ActionIcon>
              <div style={{ width: '100%' }}>
                <Text weight={500} size="sm">
                  الاسم الكامل: {`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}` || 'غير متوفر'}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                  الدور: {item?.role === "1" ? "مدير" : "مشرف"}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                  تاريخ نهاية العضوية: {dayjs(item?.membership_date_end).format("YYYY-MM-DD") || 'غير متوفر'}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                  الصلاحيات: {item?.role === "1" ? "كامل الصلاحيات" : "صلاحيات مخصصة"}
                </Text>
              </div>
            </Group>
          ),
          width: 'auto',
        },
        {
          name: '',
          selector: (item) => (
            <Group style={{ padding: "10px 0" }}>
              <Menu shadow="md" width={200} position="bottom">
                <Menu.Target>
                  <ActionIcon color="gray" variant="light">
                    <DotsVertical size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {hasPermission("3") && (
                    <Menu.Item icon={<EditCircle size={14} />} onClick={() => openModelUpdate(item?.id)}>
                      تعديل
                    </Menu.Item>
                  )}
                  {hasPermission("4") && (
                    <Menu.Item icon={<X size={14} />} onClick={() => openModelDelete(item?.id)}>
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
      


    if(isMobile){
        return (
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
          {selectedItem && (
              <ClubMangModel
                item={selectedItem}
                opened={modalOpened}
                onClose={closeModal}
              />
            )}
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
                                <HeaderCell>الاسم الكامل</HeaderCell>
                                <HeaderCell>الدور</HeaderCell>
                                <HeaderCell>رقم الهاتف</HeaderCell>
                                <HeaderCell>الرقم المدني</HeaderCell>
                                <HeaderCell>تاريخ الميلاد</HeaderCell>
                                <HeaderCell>تاريخ العضويه</HeaderCell>
                                <HeaderCell>تاريخ  نهاية العضويه</HeaderCell>
                                <HeaderCell>الصلاحيات</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>
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
                                                    {hasPermission("4")
                                                        ? <Menu.Item icon={<X size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                        : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </Cell>
                                    <Cell>{`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}</Cell>
                                    <Cell>{ item?.role === "1" ? "مدير" : "مشرف" }</Cell>
                                    <Cell>{item?.person?.phone}</Cell>
                                    <Cell>{item?.person?.card_number}</Cell>
                                    <Cell>{item?.person?.date_birth}</Cell>
                                    <Cell>{dayjs(item?.membership_date).format("YYYY-MM-DD")}</Cell>
                                    <Cell>{dayjs(item?.membership_date_end).format("YYYY-MM-DD")}</Cell>
                                    <Cell>{item?.role === "1" ? "كامل الصلاحيات" : "صلاحيات مخصصة"}</Cell>
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