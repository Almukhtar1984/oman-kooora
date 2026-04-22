import {ActionIcon, Divider, Group, Menu, Tooltip} from '@mantine/core';
import {
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconInfoCircle,
    IconPlus
} from '@tabler/icons-react';
import DataTable, {TableStyles} from 'react-data-table-component';
import dayjs from "dayjs";
import { GiSoccerBall } from "react-icons/gi";

const customStyles: TableStyles = {
    headCells: {
        style: {
            fontWeight: 800,
            fontSize: 14,
        },
    },
    table: {
        style: {
            minHeight: 380
        },
    }
};

//data

type Props = {
    setSelectedData: (id: string) => void;
    setOpenShowGroupsModal: (status: boolean) => void;
    setOpenShowMatchsModal: (status: boolean) => void;

    setOpenEditModal: (status: boolean) => void;
    setOpenDeleteModal: (status: boolean) => void;

    setOpenAddParticipatingModal: (status: boolean) => void;
    setOpenEditParticipatingModal: (status: boolean) => void;
    setOpenAddMatchModal: (status: boolean) => void;

    setOpenAddParticipatingPlayersModal: (status: boolean) => void;
    setOpenAddParticipatingTechnicalStaffModal: (status: boolean) => void;
    data?: any;
};

export const LeaguesTabel = ({data, setSelectedData, setOpenShowGroupsModal, setOpenShowMatchsModal, setOpenEditModal, setOpenDeleteModal, setOpenAddParticipatingModal, setOpenEditParticipatingModal, setOpenAddMatchModal, setOpenAddParticipatingPlayersModal, setOpenAddParticipatingTechnicalStaffModal}: Props) => {
    const columns = [
        {name: 'اسم الدورة', selector: (row: any, index: number) => row.name, width: "120px" },
        {name: 'الوصف', selector: (row: any) => row.description, width: "auto" },
        {name: 'عدد الفرق', selector: (row: any) => row.numberTeams, width: "100px" },
        {name: 'عدد المجموعة', selector: (row: any) => row.numberGroups, width: "130px" },
        {name: 'تاريخ التسجيل', selector: (row: any) => dayjs(row.createdAt).locale("ar").fromNow(), width: "130px" },
        {name: 'تاريخ البداية', selector: (row: any) => row.startDate, width: "120px" },
        {name: 'تاريخ النهاية', selector: (row: any) => row.expiryDate, width: "120px" },

        {cell: (row: any) => (
            <Group wrap={"nowrap"} justify={"flex-end"} w={"100%"} gap={5}>
                {row.matchs && row.matchs.length > 0
                    ? <Tooltip label={"عرض المباريات"}>
                        <ActionIcon
                            variant={"transparent"} color={"darck"}
                            onClick={() => {
                                setSelectedData(row)
                                setOpenShowMatchsModal(true)
                            }}
                        >
                            <GiSoccerBall size={"1.125rem"} />
                        </ActionIcon>
                    </Tooltip>
                    : null
                }

                {row.participatingTeams && row.participatingTeams.length > 0
                    ? <Tooltip label={"عرض المجموعات"}>
                        <ActionIcon
                            variant={"transparent"} color={"darck"}
                            onClick={() => {
                                setSelectedData(row)
                                setOpenShowGroupsModal(true)
                            }}
                        >
                            <IconInfoCircle size={"1.125rem"} />
                        </ActionIcon>
                    </Tooltip>
                    : null
                }

                <Menu shadow="md" width={180}>
                    <Menu.Target>
                        <ActionIcon variant={"light"} color={"darck"}>
                            <IconDotsVertical size="1.125rem" />
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        {row.participatingTeams && row.participatingTeams.length > 0
                            ? <Menu.Item
                                leftSection={<IconInfoCircle size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenShowGroupsModal(true)
                                }}
                            >عرض المجموعات</Menu.Item>
                            : null
                        }

                        {row.matchs && row.matchs.length > 0
                            ? <Menu.Item
                                leftSection={<IconInfoCircle size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenShowMatchsModal(true)
                                }}
                            >عرض المباريات</Menu.Item>
                            : null
                        }

                        <Divider />

                        {row.participatingTeams && row.participatingTeams.length > 0
                            ? <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenAddMatchModal(true)
                                }}
                            >اضافة مباراة</Menu.Item>
                            : null
                        }

                        {row.participatingTeams && row.participatingTeams.length > 0
                            ? <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenEditParticipatingModal(true)
                                }}
                            >تعديل الفرق</Menu.Item>
                            : <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenAddParticipatingModal(true)
                                }}
                            >اضافة فرق</Menu.Item>
                        }

                        {row.participatingTeams && row.participatingTeams.length > 0
                            ? <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenAddParticipatingPlayersModal(true)
                                }}
                            >اضافة لاعبين</Menu.Item>
                            : null
                        }

                        {row.participatingTeams && row.participatingTeams.length > 0
                            ? <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => {
                                    setSelectedData(row)
                                    setOpenAddParticipatingTechnicalStaffModal(true)
                                }}
                            >اضافة جهاز فني</Menu.Item>
                            : null
                        }

                        <Divider />
                        <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => {
                                setSelectedData(row)
                                setOpenEditModal(true)
                            }}
                        >تعديل</Menu.Item>

                        <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            onClick={() => {
                                setSelectedData(row.id)
                                setOpenDeleteModal(true)
                            }}
                        >حذف</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        ), allowOverflow: true, button: true, width: '100px' }
    ];

//"pending", "rejected", "completed"

    return (
        <DataTable
            // @ts-ignore
            columns={columns}
            data={data}
            customStyles={customStyles}
            highlightOnHover
            pagination={true}
            paginationComponentOptions={{
                rowsPerPageText: "الاسطر في كل صفحة",
                rangeSeparatorText: "من"
            }}
        />
    );
};

