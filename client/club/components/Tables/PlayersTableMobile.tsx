import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Checkbox, Group, Menu, Pagination, Select, Stack, Text, TextInput,Box} from '@mantine/core';
import {DotsVertical, Check, X, Id, FileCertificate, History, EditCircle, Printer, Trash, Paperclip, Upload, ChartDots,XboxX,InfoCircle, ArrowsLeftRight} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {Filter} from "tabler-icons-react";

import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";
import dayjs from "dayjs";
import {GiPlayerPrevious} from "react-icons/gi";
;
import {PlayerModel} from "../Modal/index"
const mantineTheme = getTheme(DEFAULT_OPTIONS);

import DataTable, {TableStyles} from 'react-data-table-component';
import { IconDatabaseOff } from '@tabler/icons-react';

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
    setopenAddSanctionModal: (open: boolean) => void;
    setopenUpdateSanctionModal: (open: boolean) => void;
    setStatPlayerModal: (open: boolean) => void;
    setOpenChangeClassificationModal?: (open: boolean) => void;
}

const allClasses = [
    {label: "الفريق الاول", value: "firstDegree"},
    {label: "تحت 23 سنة", value: "secondDegree"},
    {label: "تحت 18 سنة", value: "young"},
    {label: "تحت 16 سنة", value: "rookies"}
]

export const PlayersTableMobile = ({ list, search, setOpenEditModal, setOpenVerifyIdentityModal, setOpenDeleteModal, setOpenChangeStatusModal, setNewStatus, setSelectedRow, openDrawer, setSelectedDrawer, setOpenTransferModal, setOpenLoanModal, hasPermission, setOpenAddAttachmentPlayerModal, setOpenShowAttachmentPlayerModal,setopenAddSanctionModal,setopenUpdateSanctionModal,setStatPlayerModal, setOpenChangeClassificationModal }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });
    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [allstatus, setAllStatus] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [valueClasseCheck, setValueClasseCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpened, setModalOpened] = useState(false);
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
        if (valueCheck.length > 0 || valueClasseCheck.length > 0 || dateCheck.length > 0 || allstatus.length > 0) {
            if (valueCheck.length > 0 && valueClasseCheck.length > 0 && dateCheck.length > 0 && allstatus.length > 0) {
                let filterAllMembers = list.filter((item: any) => {
                    return valueCheck.includes(item?.team?.name) && valueClasseCheck.includes(item?.class) && allstatus.includes(item?.status)
                })
    
                filterAllMembers = dateFilter(dateCheck, filterAllMembers)
    
                setAllMembers({nodes: [...filterAllMembers]})
            } else {
                if (valueCheck.length > 0) {
                    let filterAllMembers1 = list.filter((item: any) => valueCheck.includes(item?.team?.name))
            
                    if (valueClasseCheck.length > 0) {
                        let filterAllMembers = filterAllMembers1.filter((item: any) => valueClasseCheck.includes(item?.class))
                        
                        if (allstatus.length > 0) {
                            filterAllMembers = filterAllMembers.filter((item: any) => allstatus.includes(item?.status))
                        }
    
                        if (dateCheck.length > 0) {
                            filterAllMembers = dateFilter(dateCheck, filterAllMembers)
                        }
    
                        setAllMembers({nodes: [...filterAllMembers]})
                    } else if (dateCheck.length > 0) {
                        let filterAllMembers = dateFilter(dateCheck, filterAllMembers1)
    
                        if (allstatus.length > 0) {
                            filterAllMembers = filterAllMembers.filter((item: any) => allstatus.includes(item?.status))
                        }
    
                        setAllMembers({nodes: [...filterAllMembers]})
                    } else {
                        if (allstatus.length > 0) {
                            let filterAllMembers = filterAllMembers1.filter((item: any) => allstatus.includes(item?.status))
                            setAllMembers({nodes: [...filterAllMembers]})
                        } else {
                            setAllMembers({nodes: [...filterAllMembers1]})
                        }
                    }
                } else {
                    if (valueClasseCheck.length > 0) {
                        let filterAllMembers1 = list.filter((item: any) => valueClasseCheck.includes(item?.class))
            
                        if (dateCheck.length > 0) {
                            let filterAllMembers = dateFilter(dateCheck, filterAllMembers1)
    
                            if (allstatus.length > 0) {
                                filterAllMembers = filterAllMembers.filter((item: any) => allstatus.includes(item?.status))
                            }
    
                            setAllMembers({nodes: [...filterAllMembers]})
                        } else {
                            if (allstatus.length > 0) {
                                let filterAllMembers = filterAllMembers1.filter((item: any) => allstatus.includes(item?.status))
                                setAllMembers({nodes: [...filterAllMembers]})
                            } else {
                                setAllMembers({nodes: [...filterAllMembers1]})
                            }
                        }
                    } else {
                        if (dateCheck.length > 0) {
                            let filterAllMembers = dateFilter(dateCheck, list)
    
                            if (allstatus.length > 0) {
                                filterAllMembers = filterAllMembers.filter((item: any) => allstatus.includes(item?.status))
                            }
    
                            setAllMembers({nodes: [...filterAllMembers]})
                        } else {
                            if (allstatus.length > 0) {
                                let filterAllMembers = list.filter((item: any) => allstatus.includes(item?.status))
                                setAllMembers({nodes: [...filterAllMembers]})
                            } else {
                                setAllMembers({nodes: [...list]})
                            }
                        }
                    }
                }
            }
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [valueCheck, valueClasseCheck, dateCheck, allstatus]);
    

    useEffect(() => {
        console.log(allMembers)
        console.log(allstatus)
    }, [allstatus]);
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

    const openModelChangeStatus = (id: string, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
    }
    const openModeladdSanction = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setopenAddSanctionModal === "function" && setopenAddSanctionModal(true)
    }
    const openModelupdateSanction = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setopenUpdateSanctionModal === "function" && setopenUpdateSanctionModal(true)
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

    const MOBILE_COLUMNS = [
        {
          name: '#',
          selector: (item, index) => `${index + 1}`,
          width: '40px',
        },
        {
          name: 'تفاصيل اللاعب',
          selector: (item) => (
            <Group position="apart" align="center" sx={{ width: '100%' }}>
              <ActionIcon
                color="blue"
                variant="light"
                onClick={() => openModal(item)}
                title="معلومات الصلاحيات"
              >
                <InfoCircle size={18} />
              </ActionIcon>
              <div>
                <Text weight={500} size="sm">
                  {`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}
                </Text>
                <Group position="apart" mt={4}>
                  <Text size="xs" color="dimmed">
                    الفريق: {item?.team?.name}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {item?.status === 'accepted' ? (
                      <Badge fw={500} color="teal">
                        مقبول
                      </Badge>
                    ) : item?.status === 'rejected' ? (
                      <Badge fw={500} color="red">
                        مرفوض
                      </Badge>
                    ) : item?.status === 'waiting_club' ? (
                      <Badge fw={500} color="yellow">
                        قيد انتظار تاكيد النادي
                      </Badge>
                    ) : item?.status === 'suspended' ? (
                      <Badge fw={500} color="red">
                        معاقب
                      </Badge>
                    ) : (
                      <Badge fw={500} color="yellow">
                        قيد الانتظار
                      </Badge>
                    )}
                  </Text>
                </Group>
              </div>
            </Group>
          ),
          width: 'auto',
        },
        {
          name: '',
          selector: (item: any) => (
            <Group>
              <Menu shadow="md" width={200} position="bottom" withinPortal>
                <Menu.Target>
                  <ActionIcon color="gray" variant="light">
                    <DotsVertical size={18} />
                  </ActionIcon>
                </Menu.Target>
      
                <Menu.Dropdown>
                  {hasPermission('3') ? (
                    <Menu.Item
                      icon={<EditCircle size={14} />}
                      onClick={() => openModelUpdate(item?.id)}
                    >
                      تعديل
                    </Menu.Item>
                  ) : null}
      
                  <Menu.Item
                    icon={<Trash size={18} />}
                    onClick={() => openModelDelete(item?.id)}
                  >
                    حذف
                  </Menu.Item>
      
                  {(item?.status == 'waiting' || item?.status == 'waiting_club') &&
                  hasPermission('5') ? (
                    <Menu.Item
                      icon={<Id size={14} />}
                      onClick={() => openModelVerifyIdentity(item)}
                    >
                      تحقق
                    </Menu.Item>
                  ) : null}
      
                  {item.attachmentsPlayer.length > 0 ? (
                    <Menu.Item
                      icon={<Paperclip size={18} />}
                      onClick={() => {
                        setSelectedRow(item);
                        setOpenShowAttachmentPlayerModal(true);
                      }}
                    >
                      المرفقات
                    </Menu.Item>
                  ) : null}
      
                  <Menu.Item
                    icon={<Upload size={18} />}
                    onClick={() => {
                      setSelectedRow(item?.id);
                      setOpenAddAttachmentPlayerModal(true);
                    }}
                  >
                    إضافة مرفقات
                  </Menu.Item>
                  <Menu.Item
                    icon={<ChartDots size={18} />}
                    onClick={() => {
                      setSelectedRow(item?.id);
                      setStatPlayerModal(true);
                    }}
                  >
                    احصائيات اللاعب
                  </Menu.Item>
      
                  {item?.status == 'accepted' && hasPermission('6') ? (
                    <>
                      <Menu.Item
                        icon={<GiPlayerPrevious size={18} />}
                        onClick={() => openModelTransfer(item)}
                      >
                        إنتقال اللاعب
                      </Menu.Item>
                      <Menu.Item
                        icon={<GiPlayerPrevious size={18} />}
                        onClick={() => openModelLoan(item)}
                      >
                        إعارة اللاعب
                      </Menu.Item>
                    </>
                  ) : null}
      
                  {item?.transfer?.length > 0 && hasPermission('7') ? (
                    <Menu.Item
                      icon={<History size={14} />}
                      onClick={() => onOpenDrawer(item?.transfer)}
                    >
                      تاريخ إنتقال اللاعب
                    </Menu.Item>
                  ) : null}
                  {item?.status === 'accepted' ? (
                    <Menu.Item
                      icon={<XboxX size={15} />}
                      onClick={() => openModeladdSanction(item)}
                    >
                      اضافة عقوبة
                    </Menu.Item>
                  ) : null}
                  {item?.status === 'suspended' ? (
                    <Menu.Item
                      icon={<XboxX size={15} />}
                      onClick={() => openModelupdateSanction(item)}
                    >
                      تحديث عقوبة
                    </Menu.Item>
                  ) : null}
      
                  {hasPermission('8') ? (
                    <Menu.Item
                      component={'a'}
                      icon={<Printer size={18} />}
                      href={`https://print.omkooora.com/#/${item?.id}`}
                      target={'_blank'}
                    >
                      طباعة البطاقة
                    </Menu.Item>
                  ) : null}
                </Menu.Dropdown>
              </Menu>
            </Group>
          ),
          width: '80px',
        },
      ];
      


    return (
      <>
       (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap", // Ensures filters wrap on smaller screens
                gap: "1rem",
            }}
        >
      <Group position={"apart"} noWrap={true}>
                    <Text>الحالة</Text>
                    <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                        <Menu.Target>
                            <ActionIcon>
                                <Filter size={18} color={valueCheck.length > 0 ? "cyan" : "#4b5563"} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Checkbox.Group value={allstatus} onChange={setAllStatus} defaultValue={[]}>
                               
                                    <Menu.Item key={1} component={"div"}>
                                        <Checkbox value="accepted" label="مقبول" />
                                    </Menu.Item>

                                    <Menu.Item key={2} component={"div"}>
                                        <Checkbox value="rejected" label="مرفوض" />
                                    </Menu.Item>

                                    <Menu.Item key={3} component={"div"}>
                                        <Checkbox value="waiting_club" label="قيد الانتظار" />
                                    </Menu.Item>

                                    <Menu.Item key={4} component={"div"}>
                                        <Checkbox value="waiting" label="قيد انتظار تاكيد الفريق" />
                                    </Menu.Item>

                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"suspended"} label={"معاقب"} />
                                    </Menu.Item>
                               
                            </Checkbox.Group>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

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
            </Box>
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
          <PlayerModel
            item={selectedItem}
            opened={modalOpened}
            onClose={closeModal}
          />
        )}
        </>
    );
};