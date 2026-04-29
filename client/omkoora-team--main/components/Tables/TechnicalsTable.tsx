import * as React from 'react';
import { CompactTable } from '@table-library/react-table-library/compact';
import {ActionIcon, Badge, Group, Menu, Pagination, Stack, Text} from '@mantine/core';
import {Check, DotsVertical, EditCircle, FileCertificate, Trash, X,InfoCircle,TransferOut} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";

import {TechnicalItemModel} from "../Modal/index"
import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useMediaQuery } from "@mantine/hooks";
import { Modal } from "@mantine/core";
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
    setSelectedRow?: (id: string) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
    setopenConvertTechnicalToPlayerModal ?: (open: boolean) => void;
    setNewStatus?: (status: string) => void;
    hasPermission: (permission: string) => boolean;
}

export const TechnicalsTable = ({ list, search, setOpenEditModal, setOpenDeleteModal, setSelectedRow, setNewStatus, setOpenChangeStatusModal, hasPermission, setopenConvertTechnicalToPlayerModal }: Props) => {
    const [allMembers, setAllMembers] = useState<any>([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpened, setModalOpened] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [openRejectionModal, setOpenRejectionModal] = useState(false);
    const [SelectedPerson, setSelectedPerson] = useState();
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
            [
                'person.first_name', "person.second_name", "person.third_name",
                "person.tribe", "person.phone", "person.card_number",
                "occupation", "classification"
            ],
            search
        )
        console.log(filterAllMembers)
        setAllMembers([...filterAllMembers])
    }, [search]);

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }

    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelConvert = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setopenConvertTechnicalToPlayerModal === "function" && setopenConvertTechnicalToPlayerModal(true)
    }

    const openModelChangeStatus = (id: string, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
    }

    const COLUMNS = [
        // {name: 'الصورة الشخصية', cellProps: {width: "200px"},  selector: (item: any) => <Avatar src={item?.person?.personal_picture} alt="it's me" /> ,  },
        {name: 'الاسم الكامل', selector: (item: any) => `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`, width: '200px'  },
        {name: 'رقم الهاتف', selector: (item: any) => item?.person?.phone, width: '120px' },
        {name: 'الرقم المدني', selector: (item: any) => item?.person?.card_number, width: '120px' },
        {name: 'تاريخ الميلاد', selector: (item: any) => item?.person?.date_birth, width: '120px' },
        {name: 'الوظيفه', selector: (item: any) => item?.occupation, width: '120px' },
        {name: 'التصنيف', selector: (item: any) => item?.classification, width: '120px' },
        {name: 'تاريخ العقد', selector: (item: any) => dayjs(item?.membership_date).format("YYYY-MM-DD"), width: '120px' },
        {name: 'تاريخ نهاية العقد', selector: (item: any) => dayjs(item?.membership_date_end).format("YYYY-MM-DD"), width: '150px' },
        {name: 'حالة الدفع', selector: (item: any) => item?.paid ? "مدفوع" : "لم يتم الدفع", width: '150px' },
        {name: 'تنزيل الملف', selector: (item: any) => (
            item.testimony_experience && item.testimony_experience !== "" ?
                <Group position={"center"}>
                    <ActionIcon
                        color="green"
                        variant="light"

                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${process.env.NEXT_PUBLIC_API_URL}/images/${item.testimony_experience}`}
                    >
                        <FileCertificate size={18} />
                    </ActionIcon>
                    <Text size={"sm"}>الشهادة</Text>
                </Group>
                : null
        ), width: '120px'},
        {name: 'الحالة', selector: (item: any) => (
            item?.status == "accepted"
                ? <Badge fw={500} color="teal">مقبول</Badge>
                : item?.status == "rejected"
                    ? <Badge fw={500} color="red" onClick={(e) => { e.stopPropagation(); setOpenRejectionModal(true);setSelectedPerson(item.note) }}>مرفوض</Badge>
                    : item?.status == "waiting_club"
                        ? <Badge fw={500} color="yellow">قيد انتظار تاكيد النادي</Badge>
                        : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
        ), width: '120px'},
        {name: 'الخيارات', selector: (item: any) => (
            <Group>
                <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {item?.status == "waiting" && hasPermission("3")
                            ? <>
                                <Menu.Item icon={<X size={14} />} onClick={() => openModelChangeStatus(item?.id, "rejected")} >رفض</Menu.Item>
                                <Menu.Item icon={<Check size={14} />} onClick={() => openModelChangeStatus(item?.id, "waiting_club")} >قبول</Menu.Item>
                            </>
                            : null
                        }

                        <Menu.Item icon={<EditCircle size={18} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                        {item?.status == "accepted" && <Menu.Item icon={<TransferOut size={18} />} onClick={() => openModelConvert(item?.id)} >نقل الى اللاعب</Menu.Item>}
                        <Menu.Item icon={<Trash size={18} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), width: '80px'},
    ];


    const MOBILE_COLUMNS = [
        {
          name: 'تفاصيل الجهاز الفني',
          selector: (item) => (
            <Group position="apart" noWrap align="center" style={{ padding: "10px 0" }}>
              <ActionIcon
                color="blue"
                variant="light"
                onClick={() => openModal(item)}
                title="معلومات اللاعب"
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
                        {item?.status == "waiting" && hasPermission("3")
                            ? <>
                                <Menu.Item icon={<X size={14} />} onClick={() => openModelChangeStatus(item?.id, "rejected")} >رفض</Menu.Item>
                                <Menu.Item icon={<Check size={14} />} onClick={() => openModelChangeStatus(item?.id, "waiting_club")} >قبول</Menu.Item>
                            </>
                            : null
                        }

                        <Menu.Item icon={<EditCircle size={18} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                        <Menu.Item icon={<Trash size={18} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
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
              <TechnicalItemModel
                item={selectedItem}
                opened={modalOpened}
                onClose={closeModal}
              />
            )}

            <Modal
                        opened={openRejectionModal}
                        onClose={() => setOpenRejectionModal(false)}
                        title="سبب الرفض"
                        centered
                    >
                        
                        <Text>
                        {SelectedPerson||"لم يتم ذكر سبب الرفض"}
                    </Text>
                    </Modal>
            </>
      );}
      else{
    return (
        <>
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
        <Modal
                    opened={openRejectionModal}
                    onClose={() => setOpenRejectionModal(false)}
                    title="سبب الرفض"
                    centered
                >
                    
                    <Text>
                    {SelectedPerson||"لم يتم ذكر سبب الرفض"}
                </Text>
                </Modal>
                </>
    );}
};