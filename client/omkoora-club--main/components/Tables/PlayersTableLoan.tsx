import * as React from 'react';

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Badge, Group, Menu, Pagination,Text,Stack} from '@mantine/core';
import {DotsVertical, Check, X,InfoCircle} from "tabler-icons-react";
import {useEffect, useState} from "react";
import {searchSortedData} from "../../lib/helpers/sort";
import {GiPlayerNext, GiPlayerPrevious} from "react-icons/gi";
import {HeaderCell} from "@table-library/react-table-library/table";
import { useMediaQuery } from "@mantine/hooks";
import DataTable, {TableStyles} from 'react-data-table-component';
import {TransfertemModel} from "../Modal"
import {EditCircle} from "tabler-icons-react";
import { IconDatabaseOff } from '@tabler/icons-react';
import {UpdateLoanModal} from "../Modal/UpdateLoanModal"
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import {useBackToOldTeamTransfer} from  "../../graphql";
const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow?: (data: any) => void;
    idClub?: string;
    hasPermission: (permission: string) => boolean;
    handleRefresh: () => void;
   
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
            width:"100%",
        }
        
    },
};

export const PlayersTableLoan = ({ idClub, list, search, setOpenEditModal, setSelectedRow, hasPermission ,handleRefresh}: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });

    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteTransfer] = useBackToOldTeamTransfer();
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
            --data-table-library_grid-template-columns:  80px 180px 60px 12% 12% 12% 12% 20% 10% 10% 10% 10% 10% 10% 10% 30% ;
            min-height: 150px;
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

    useEffect(() => {
        const filterAllMembers = searchSortedData(list,['name'], search)
        setAllMembers({nodes: [...filterAllMembers]})
    }, [search]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const openModelUpdate = (data: any, status: string) => {
        typeof setSelectedRow === "function" && setSelectedRow({
            ...data,
            status
        })
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const [updateLoanModalOpened, setUpdateLoanModalOpened] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    const openUpdateLoanModal = (loan: any) => {
        setSelectedLoan(loan); // Set the selected loan for editing
        setUpdateLoanModalOpened(true); // Open the modal
    };

    const closeUpdateLoanModal = () => {
        setSelectedLoan(null); // Reset the selected loan
        setUpdateLoanModalOpened(false); // Close the modal
    };

    const openDeleteModal = (transfer: any) => {
        
        setSelectedTransfer(transfer);
        setDeleteModalOpened(true);

    };

    const closeDeleteModal = () => {
        setSelectedTransfer(null);
        setDeleteModalOpened(false);
    };

    const handleDelete = async () => {
        try {
            await deleteTransfer({
                //@ts-ignore
                variables: { id: selectedTransfer?.id },
            });
            handleRefresh();
            closeDeleteModal();
            // Optionally refresh or update the list
        } catch (error) {
            console.error("Error deleting transfer:", error);
        }
    };

    const COLUMNS = [
        {label: 'الخيارات', renderCell: (item) => (
            <Group>
                <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon  color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {item?.lastLoan?.status == "waiting" && item?.lastLoan?.club_to?.id === idClub && hasPermission("2")
                            ? <>
                                <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item?.lastLoan, "rejected")} >رفض</Menu.Item>
                                <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item?.lastLoan, "accepted")} >قبول</Menu.Item>
                            </>
                            : null
                        }
                          <Menu.Item
                            
                            onClick={() => openUpdateLoanModal(item?.lastLoan)}
                        >
                            تمديد
                        </Menu.Item>
                        <Menu.Item
                            
                            onClick={() => {openDeleteModal(item?.lastLoan)}}
                        >
                            الغاء
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
            )
        },
        {label: 'حالة الانتقال', renderCell: (item) => (
            item?.lastLoan?.status == "accepted" ? <Badge fw={400} color="teal">مقبول</Badge>
                : item?.lastLoan?.status == "rejected" ? <Badge fw={400} color="red">مرفوض</Badge>
                    : item?.lastTransfer?.status == "waiting" && item?.lastTransfer?.club_to?.id === idClub
                        ? <Badge fw={400} color="yellow">بانتظار تاكيدك</Badge>
                        : <Badge fw={400} color="yellow">بانتظار تاكيد النادي المستقبل</Badge>
        )},

        {label: '', renderCell: (item) => (
            item?.lastLoan?.team_from?.club?.id !== idClub
                ? <GiPlayerPrevious size={22} color={"red"} />
                : item?.lastLoan?.team_to?.club?.id !== idClub
                    ? <GiPlayerNext size={22} color={"green"} />
                    : null
        )},
        {label: 'إسم الفريق القديم', renderCell: (item) => `${item?.lastLoan?.team_from?.name}`  },
        {label: 'إسم الفريق الجديد', renderCell: (item) => `${item?.lastLoan?.team_to?.name}`  },
        {label: 'تاريح بداية الإعارة', renderCell: (item) => item?.lastLoan?.date_start !== "1970-01-01" ? `${item?.lastLoan?.date_start}` : null  },
        {label: 'تاريح نهاية الإعارة', renderCell: (item) => item?.lastLoan?.date_end !== "1970-01-01" ? `${item?.lastLoan?.date_end}` : null  },

        {label: 'الاسم الكامل', renderCell: (item) => `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`  },
        {label: 'رقم الهاتف', renderCell: (item) => item?.person?.phone },
        {label: 'الرقم المدني', renderCell: (item) => item?.person?.card_number },
        {label: 'الفئة العمرية', renderCell: (item) => (
            item?.class == "firstDegree"
                ? <Badge color="lime">الدرجة الاولى</Badge>
                : item?.class == "young"
                    ? <Badge color="grape">الشباب</Badge>
                    :  item?.class == "rookies"
                        ? <Badge color="indigo">الناشئين</Badge>
                        : null

        )},

        {label: 'تاريخ الميلاد', renderCell: (item) => item?.person?.date_birth },
        {label: 'النشاط', renderCell: (item) => item?.activity },
        {label: 'مركز لاعب', renderCell: (item) => item?.player_center },
        {label: 'العمل', renderCell: (item) => item?.job },
        {label: 'الملاحظة / سبب الرفض', renderCell: (item) => item?.note },
    ];


    
      
    const MOBILE_COLUMNS = [
        {
            name: ' تفاصيل الاعارة',
            selector: (item) => (
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
                        <div style={{ marginLeft: "4px" }}>
                            {item?.lastTransfer?.status === "accepted" ? (
                                <Badge fw={400} color="teal">
                                    مقبول
                                </Badge>
                            ) : item?.lastTransfer?.status === "rejected" ? (
                                <Badge fw={400} color="red">
                                    مرفوض
                                </Badge>
                            ) : item?.lastTransfer?.status === "waiting" &&
                              item?.lastTransfer?.club_to?.id === idClub ? (
                                <Badge fw={400} color="yellow">
                                    بانتظار تاكيدك
                                </Badge>
                            ) : (
                                <Badge fw={400} color="yellow">
                                    بانتظار الرد
                                </Badge>
                            )}
                        </div>
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
                                {`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}
                            </Text>
                            <Group
                                position="apart"
                                noWrap
                                mt={2}
                                spacing="xs"
                                style={{
                                    flexDirection: "row-reverse",
                                    minWidth: "70%",
                                    maxWidth: "100%",
                                }}
                            >
                                <ActionIcon
                                    variant="light"
                                    color="gray"
                                    size="xs"
                                    style={{ padding: "2px" }}
                                >
                                    {item?.lastTransfer?.team_to?.name || "N/A"}
                                </ActionIcon>
                                <Text size="xs" weight={500}>
                                    &larr;
                                </Text>
                                <ActionIcon
                                    variant="light"
                                    color="gray"
                                    size="xs"
                                    style={{ padding: "2px" }}
                                >
                                    {item?.lastTransfer?.team_from?.name || "N/A"}
                                </ActionIcon>
                            </Group>
                        </div>
                    </Group>
                </Group>
            ),
            width: 'auto',
        },
        {
            name: '',
            selector: (item) => (
                <Group >
                    <Menu shadow="md" width={200} position={"bottom"}>
                    <Menu.Target>
                        <ActionIcon color="gray" variant="light" >
                            <DotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {item?.lastLoan?.status == "waiting" && item?.lastLoan?.club_to?.id === idClub && hasPermission("2")
                            ? <>
                                <Menu.Item icon={<X size={14} />} onClick={() => openModelUpdate(item?.lastLoan, "rejected")} >رفض</Menu.Item>
                                <Menu.Item icon={<Check size={14} />} onClick={() => openModelUpdate(item?.lastLoan, "accepted")} >قبول</Menu.Item>
                            </>
                            : null
                        }
                         <Menu.Item
                            
                            onClick={() => openUpdateLoanModal(item?.lastLoan)}
                        >
                            تمديد
                        </Menu.Item>
                        <Menu.Item
                            
                            onClick={() => {openDeleteModal(item?.lastLoan)}}
                        >
                            الغاء
                        </Menu.Item>
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
                  <Stack mih={300} align='center' justify='center' >
                      <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
                      <Text size={"md"} c={"gray.8"} >لا يوجد بيانات</Text>
                  </Stack>
              }
              
          />
          {selectedItem && (
              <TransfertemModel
                item={selectedItem}
                opened={modalOpened}
                onClose={closeModal}
              />
            )}
        {selectedLoan && (
                <UpdateLoanModal
                    data={selectedLoan} // Pass the selected loan data
                    opened={updateLoanModalOpened} // Pass modal state
                    onClose={closeUpdateLoanModal} // Pass close handler
                />
            )}
        {selectedTransfer && (
            
                        <DeleteConfirmationModal
                            opened={deleteModalOpened}
                            onClose={closeDeleteModal}
                            onConfirm={handleDelete}
                        />
                  
                    )}
            </>
      );}

    return (
        <>
            <CompactTable columns={COLUMNS} data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }} />

            <br />
            <Group position="right" mx={10}>
                <Pagination
                    total={pagination.state.getTotalPages(allMembers.nodes)}
                    value={pagination.state.page + 1}
                    onChange={(page) => pagination.fns.onSetPage(page - 1)}
                />
            </Group>
            {selectedItem && (
              <TransfertemModel
                item={selectedItem}
                opened={modalOpened}
                onClose={closeModal}
              />
            )}
            {selectedLoan && (
                <UpdateLoanModal
                    data={selectedLoan} // Pass the selected loan data
                    opened={updateLoanModalOpened} // Pass modal state
                    onClose={closeUpdateLoanModal} // Pass close handler
                />
            )}

        {selectedTransfer && (
            
            <DeleteConfirmationModal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
            />
      
        )}
        </>
    );
};