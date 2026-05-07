import * as React from 'react';
import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import { DEFAULT_OPTIONS, getTheme } from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import { ActionIcon, Group, Menu, Pagination,Text,Stack } from '@mantine/core';
import {IconExclamationCircle} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Body, Cell, Header, HeaderCell, HeaderRow, Row, Table, } from "@table-library/react-table-library/table";
import { IconDatabaseOff } from '@tabler/icons-react';
import {ClubMangModel} from "../Modal/index"
import { useMediaQuery } from "@mantine/hooks";
import DataTable, {TableStyles} from 'react-data-table-component';
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
const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any[];
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

export const ActionLogsTable = ({ list, setOpenEditModal, setOpenDeleteModal, setSelectedRow, hasPermission }: Props) => {
    const [allMembers, setAllMembers] = useState<{ nodes: any[] }>({
        nodes: []
    });
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
        setAllMembers({ nodes: list });
    }, [list]);
    useEffect(() => {
    }, [allMembers]);
 //allMembers
    function onPaginationChange(action, state) {
    }

    const openModelUpdate = (id: string) => {
        if (setSelectedRow) setSelectedRow(id);
        if (setOpenEditModal) setOpenEditModal(true);
    };

    const openModelDelete = (id: string) => {
        if (setSelectedRow) setSelectedRow(id);
        if (setOpenDeleteModal) setOpenDeleteModal(true);
    };
    const Actiontype = (string: string)=> {
        switch(string){
            case "Create":
                return "اضافة"
            case "Update":
                return "تحديث"
            case "Delete":
                return "مسح"
        }

    }
    const ActionName = (string: string)=> {
        switch(string){
       

            case "Assembly":
                return "بطاقة"

            case "Club":
                return "النادي"

            case "ClubManagement":
                return "مجلس الادارة النادي"

            case "Expense":
                return "المصاريف"

            case "Form":
                return ""

            case "League":
                return "البطولات"

            case "Meeting":
                return "الاجتماعات"

            case "Member":
                return "مجلس الادارة"

            case "Message":
                return "الرسائل"

            case "Permission":
                return "الصلاحيات"

            case "Players":
                return "اللاعبين"

            case "Request":
                return "طلبات الموظفين"

            case "Sanctions":
                return "العبقوبات"

            case "Stadium":
                return "الملاعب"

            case "Team":
                return "فريق"

            case "Technical":
                return "الجهاز الفني"

            case "Transfer":
                return "الانتقالات"

            case "User":
                return "المستخدنين"

            case "Person":
                return "معلومات شخصية"
            case "StatusMember":
                return "حالة عضو فريق"
            case "Sanction":
                return "عقوبة"
            
            default:
                return string

        }

    }


    const MOBILE_COLUMNS = [
        {
          name: 'تفاصيل الصلاحيات',
          selector: (item) => (
            <Group position="apart" noWrap align="center" style={{ padding: "10px 0" }}>
             
              <div style={{ width: '100%' }}>
                <Text weight={500} size="sm">
                نوع العملية: {`${Actiontype(item?.action_type)}` || 'غير متوفر'}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                القسم: {ActionName(item?.entity_type)}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                  تاريخ نهاية العضوية: {item?.updatedAt.split(' ')[0]} {item?.updatedAt.split(' ')[1]}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                ايمايل: {item?.user?.email}
                </Text>
                <Text size="xs" mt="xs" color="dimmed">
                {`${item?.user?.person?.first_name} ${item?.user?.person?.second_name} ${item?.user?.person?.third_name} ${item?.user?.person?.tribe}`}</Text>
              </div>
            </Group>
          ),
          width: 'auto',
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
                                <HeaderCell></HeaderCell>
                                <HeaderCell>نوع العملية</HeaderCell>
                                <HeaderCell>القسم </HeaderCell>
                                <HeaderCell>الفريق</HeaderCell>
                                <HeaderCell>الرقم المدني</HeaderCell>
                                <HeaderCell>ايمايل</HeaderCell>
                                <HeaderCell>تاريخ </HeaderCell>
                                <HeaderCell>التوقيت</HeaderCell>
                                <HeaderCell>الاسم</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>
                                       
                                    </Cell>
                                    <Cell>{Actiontype(item?.action_type)}</Cell>
                                    <Cell>{ActionName(item?.entity_type)}</Cell>
                                    <Cell>{item?.team?.name || ""}</Cell>
                                    <Cell>{item?.user?.person?.card_number}</Cell>
                                    <Cell>{item?.user?.email}</Cell>
                                    <Cell>{item?.updatedAt.split(' ')[0]}</Cell>
                                    <Cell>{item?.updatedAt.split(' ')[1]}</Cell>
                                    <Cell>{`${item?.user?.person?.first_name} ${item?.user?.person?.second_name} ${item?.user?.person?.third_name} ${item?.user?.person?.tribe}`}</Cell>
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
