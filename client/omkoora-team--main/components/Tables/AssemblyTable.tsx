import * as React from 'react';
import {ActionIcon, Badge, Group, Menu, Stack, Text,Select } from '@mantine/core';
import {DotsVertical, Id, CalendarStats, Printer,InfoCircle,SortAscending, SortDescending,X,Check,Edit} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {getImageUrl} from "../../lib/helpers/image";
import dayjs from "dayjs";
import { useMediaQuery } from "@mantine/hooks";
import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';
import {AssemblyModel} from "../Modal";
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
    setOpenRenewModal?: (open: boolean) => void;
    setSelectedRow?: (id: string) => void;
    setNewStatus?: (status: string) => void;
    setSelectedDrawer?: (data: any) => void;
    hasPermission: (permission: string) => boolean;
}

export const AssemblyTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setOpenRenewModal, setNewStatus, setSelectedRow, hasPermission }: Props) => {
    
    const [allMembers, setAllMembers] =  useState<any>([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpened, setModalOpened] = useState(false);
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const isMobile = useMediaQuery("(max-width: 768px)");
    const openModal = (item) => {
        setSelectedItem(item);
        setModalOpened(true);
      };
    
      const closeModal = () => {
        setSelectedItem(null);
        setModalOpened(false);
      };

    useEffect(() => {
        setAllMembers(list)
    }, [list]);

    useEffect(() => {
        const filterAllMembers = searchSortedData(
            list,
            ['first_name', 'second_name', 'third_name', 'tribe', 'phone', 'card_number'],
            search
        )
        setAllMembers([...filterAllMembers])
    }, [search]);

    const openModelUpdate = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelRenew = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenRenewModal === "function" && setOpenRenewModal(true)
    }

    const toggleSortOrder = () => {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };
    const COLUMNS = [
        {name: 'الخيارات', selector: (item: any) => (
            <Group>
                <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {<Menu.Item icon={<Edit size={14} />} onClick={() => openModelUpdate(item)} >تعديل</Menu.Item>}
                        {<Menu.Item icon={<X  size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>}
                        {new Date() > new Date(`${parseInt(dayjs(item?.subscription_date).format("YYYY"))+1}-01-01`) && hasPermission("5")
                            ? <Menu.Item icon={<CalendarStats size={14} />} onClick={() => openModelRenew(item)} >تجديد الاشتراك</Menu.Item>
                            : null
                        }
                        <Menu.Item 
                            component={"a"}
                            icon={<Printer size={18} />}
                            href={`https://print.omkooora.com/#/assembly-card/${item?.id}`}
                            target={"_blank"}
                        >طباعة البطاقة</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), width: '80px'},
        {name: 'الاسم الكامل', selector: (item: any) => `${item?.first_name} ${item?.second_name} ${item?.third_name} ${item?.tribe}`, width: '200px'  },
        {name: 'تاريخ الميلاد', selector: (item: any) => dayjs(item?.date_birth).format("YYYY-MM-DD"), width: '120px' },
        {name: 'الرقم المدني', selector: (item: any) => item?.card_number, width: '120px' },
        {name: 'رقم الهاتف', selector: (item: any) => item?.phone, width: '120px' },
        {name: 'العضوية', selector: (item: any) => item?.type, width: '120px' },

        {name: 'تاريخ العضويه', selector: (item: any) => item?.membership_date, width: '120px' },
        {name: 'الجنس', selector: (item: any) => item?.gender == "male" ? "ذكر" : "أنثى", width: '120px' },

        {
          name: (
            <Group position="right" spacing="xs">
            <Text>تاريخ الاشتراك</Text>
            <ActionIcon
                onClick={toggleSortOrder} // ✅ No more errors
                size="sm"
                variant="darl"
                color="blue"
                title={sortOrder === "asc" ? "الأحدث إلى الأقدم" : "الأقدم إلى الأحدث"}
            >
                {sortOrder === "asc" ? <SortAscending size={18} /> : <SortDescending size={18} />}
            </ActionIcon>
        </Group>
          ),
          selector: (item: any) => dayjs(item?.subscription_date).format("YYYY-MM-DD"),
          
          width: '200px'
      },
        {name: 'حالة الاشتراك', selector: (item: any) => {
            const year = dayjs(item?.subscription_date).format("YYYY")

            const date1 = new Date(`${parseInt(year)+1}-01-01`);
            const date2 = new Date();
            

            return date2 >= date1 ? <Badge color="red">منتهي</Badge> : <Badge color="teal">يعمل</Badge>
        }, width: '150px' },

        {name: 'صورة البطاقة المدنية', selector: (item: any) => (
            item.nationalID && item.nationalID !== "" ?
                <Group position={"center"}>
                    <ActionIcon
                        color="green"
                        variant="light"
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={getImageUrl(item.nationalID)}
                    >
                        <Id size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>البطاقة</Text>
                </Group>
                : null
        ), width: '180px'},
        {name: 'صورة البطاقة الخلفية', selector: (item: any) => (
            item.nationalIDBack && item.nationalIDBack !== "" ?
                <Group position={"center"}>
                    <ActionIcon
                        color="green"
                        variant="light"
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={getImageUrl(item.nationalIDBack)}
                    >
                        <Id size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>البطاقة</Text>
                </Group>
                : null
        ), width: '180px'}
    ];

    const MOBILE_COLUMNS = [
        {
          name: 'الجمعية العمومية',
          cell: (item) => (
            <Group position="apart" noWrap align="center" spacing="xs">
              <ActionIcon
                color="blue"
                variant="light"
                onClick={() => openModal(item)}
                title="معلومات اللاعب"
                size="sm"
              >
                <InfoCircle size={16} />
              </ActionIcon>
              <Group
                style={{ width: "100%" }}
                noWrap
                align="center"
                spacing="xs"
              >
                <div
                  className="zab"
                  style={{
                    marginRight: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Text weight={500} size="sm" style={{ textAlign: "right" }}>
                    {`${item?.first_name} ${item?.second_name} ${item?.third_name} ${item?.tribe}`}
                  </Text>
                </div>
              </Group>
            </Group>
          ),
          width: 'auto',
        },
        {
          name: '',
          cell: (item) => (
            <Group>
              <Menu shadow="md" width={200} position={"bottom"}>
                <Menu.Target>
                  <ActionIcon color="gray" variant="light">
                    <DotsVertical size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                        {/*<Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item)} >تعديل</Menu.Item>*/}
                        {/*<Menu.Item icon={<Check size={14} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>*/}
                        {new Date() > new Date(`${parseInt(dayjs(item?.subscription_date).format("YYYY"))+1}-01-01`) && hasPermission("5")
                            ? <Menu.Item icon={<CalendarStats size={14} />} onClick={() => openModelRenew(item)} >تجديد الاشتراك</Menu.Item>
                            : null
                        }
                        <Menu.Item 
                            component={"a"}
                            icon={<Printer size={18} />}
                            href={`https://print.omkooora.com/#/assembly-card/${item?.id}`}
                            target={"_blank"}
                        >طباعة البطاقة</Menu.Item>
                    </Menu.Dropdown>
              </Menu>
            </Group>
          ),
          width: '80px',
        },
      ];


    
    useEffect(() => {
        let sortedList = [...list];

        // Sorting by membership_date
        sortedList.sort((a, b) => {
            const dateA = new Date(a.subscription_date).getTime();
            const dateB = new Date(b.subscription_date).getTime();
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });

        setAllMembers(sortedList);
    }, [list, sortOrder]);

    
      if(isMobile){
        return (
          <>
          <Group position="left" mb="md">
                <Select
                    value={sortOrder}
                    onChange={(value) => setSortOrder(value as string)}
                    data={[
                        { value: "asc", label: "الأقدم إلى الأحدث" },
                        { value: "desc", label: "الأحدث إلى الأقدم" },
                    ]}
                    placeholder="فرز حسب تاريخ العضوية"
                    icon={sortOrder === "asc" ? <SortAscending size={18} /> : <SortDescending size={18} />}
                />
            </Group>
          <DataTable
            columns={MOBILE_COLUMNS}
            data={allMembers}
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
              <AssemblyModel
                item={selectedItem}
                opened={modalOpened}
                onClose={closeModal}
              />
            )}
            </>
      );}
      else{
    return (
      <>  
       {/* Sorting Dropdown */}
      
        <DataTable
            columns={COLUMNS}
            data={allMembers}
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
};