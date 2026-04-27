import {ActionIcon, Divider, Group, Menu, Tooltip, Badge, Button} from '@mantine/core';
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
import isInscriptionActive from "../../lib/helpers/isInscriptionActive"
import {LeagueCard} from "../Card/LeagueCard"
import { useMediaQuery } from "@mantine/hooks";
//TeamParticipationAccptedModal
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
    idTeam: (id: string) => void;
    data?: any;

    setOpenTeamParticipationAccptedModal: (status: boolean) => void;// Add this function to props for accepting a team
    setSelectedParticipationTeam : any;

};

export const LeaguesTabel = ({data, setSelectedData, setOpenShowGroupsModal, setOpenShowMatchsModal, setOpenAddParticipatingPlayersModal, setOpenAddParticipatingTechnicalStaffModal, idTeam, setOpenTeamParticipationAccptedModal,setSelectedParticipationTeam}: Props) => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const columns = [
        {name: 'اسم الدورة', selector: (row: any, index: number) => row.name, width: "120px" },
        {name: 'الوصف', selector: (row: any) => row.description, width: "auto" },
        {name: 'عدد الفرق', selector: (row: any) => row.numberTeams, width: "100px" },
        {
            name: 'اللاعبين المحترفين',
            selector: (row: any) => row.externalplayer ?? 0,
            width: "150px"
          },
        {name: 'عدد المجموعة', selector: (row: any) => row.numberGroups, width: "130px" },
        {
            name: ' نهاية التسجيل',
            selector: (row: any) => {
                const inscriptionExpiryDate = dayjs(row.inscriptionExpiryDate);
                const today = dayjs();
    
                const daysLeft = inscriptionExpiryDate.diff(today, 'day');
                return daysLeft > 0 ? `باقي ${daysLeft} أيام` : "التسجيل مغلق";
            },
            width: "150px"
        },
        {name: 'تاريخ البداية', selector: (row: any) => row.startDate, width: "120px" },
        {name: 'تاريخ النهاية', selector: (row: any) => row.expiryDate, width: "120px" },
        {
            name: 'الحالة',
            selector: (row: any) => {
                const team = row.participatingTeams.find((team: any) => team.team.id === idTeam);
                if (team) {
                    switch (team.status) {
                        case 'accepted':
                            return <Badge fw={500} color="teal">مشارك</Badge>;
                        case 'waiting':
                            return <Badge fw={500} color="yellow">قيد الانتظار</Badge>;
                        case 'rejected':
                            return <Badge fw={500} color="red">رافض</Badge>;
                        default:
                            return 'N/A';
                    }
                } else {
                    return 'N/A';
                }
            },
            width: "120px"
        },
        {
            cell: (row: any) => {
                const team = row.participatingTeams.find((team: any) => team.team.id === idTeam);

                return (
                    <Group style={{gap:'5px',flexWrap:'nowrap'}} >
                        {row.matchs && row.matchs.length > 0
                            ? <Tooltip label={"عرض المباريات"}>
                                <ActionIcon
                                    variant={"transparent"} color={"dark"}
                                    onClick={() => {
                                        setSelectedData(row);
                                        setOpenShowMatchsModal(true);
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
                                    variant={"transparent"} color={"dark"}
                                    onClick={() => {
                                        setSelectedData(row);
                                        setOpenShowGroupsModal(true);
                                    }}
                                >
                                    <IconInfoCircle size={"1.125rem"} />
                                </ActionIcon>
                            </Tooltip>
                            : null
                        }

                        <Menu shadow="md" width={180}>
                            <Menu.Target>
                                <ActionIcon variant={"light"} color={"dark"}>
                                    <IconDotsVertical size="1.125rem" />
                                </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                                {team && team.status === 'waiting' && (
                                   
                                    <Menu.Item
                                        onClick={() => {
                                            setOpenTeamParticipationAccptedModal(team.id);
                                            setSelectedParticipationTeam(team)
                                        }}
                                        
                                        //disabled={  daysLeft > 0?false:true}
                                    >
                                     المشاركة
                                    </Menu.Item>
                                )
                                
                                }
                             

                                {row.participatingTeams && row.participatingTeams.length > 0
                                    ? <Menu.Item
                                        onClick={() => {
                                            setSelectedData(row);
                                            setOpenShowGroupsModal(true);
                                        }}
                                    >عرض المجموعات</Menu.Item>
                                    : null
                                }

                                {row.matchs && row.matchs.length > 0
                                    ? <Menu.Item
                                        onClick={() => {
                                            setSelectedData(row);
                                            setOpenShowMatchsModal(true);
                                        }}
                                    >عرض المباريات</Menu.Item>
                                    : null
                                }

                                {team?.status==="accepted" && dayjs(row.inscriptionExpiryDate).diff(dayjs(), "day") > 0 ?  <Divider  /> : ""}

                                {row.participatingTeams && row.participatingTeams.length && team && team.status === "accepted" && dayjs(row.inscriptionExpiryDate).diff(dayjs(), "day") > 0
                                
                                ? <Menu.Item
                                        onClick={() => {
                                            setSelectedData(row);
                                            setOpenAddParticipatingPlayersModal(true);
                                        }}
                                    >اضافة لاعبين</Menu.Item>
                                    : null
                                }

                                {row.participatingTeams && row.participatingTeams.length > 0 && team.status==="accepted" && dayjs(row.inscriptionExpiryDate).diff(dayjs(), "day") > 0
                                    ? <Menu.Item
                                        onClick={() => {
                                            setSelectedData(row);
                                            setOpenAddParticipatingTechnicalStaffModal(true);
                                        }}
                                    >اضافة جهاز فني</Menu.Item>
                                    : null
                                }
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                );
            },
            allowOverflow: true,
            button: true,
            width: '100px'
        }
    ];
    
    
    
    if(isMobile ===true){
        return(<div>
            {data?.map((row: any) => (
       
                <>
       
                <LeagueCard
                    key={row.id}
                    idTeam={idTeam}
                    data={row}
                    onEditModal={()=>{}}
                    onDeleteModal={()=>{}}
                    onShowMatchesModal={setOpenShowMatchsModal}
                    onShowGroupsModal={setOpenShowGroupsModal}
                    onAddMatchModal={()=>{}}
                    onAddTeamModal={()=>{}}
                    setSelectedData = {setSelectedData}
                    setOpenGenerateMatchModal={()=>{}}
                    hasPermission={(permission: string) => true /* Adjust permission logic */}
                    setOpenTeamParticipationAccptedModal={setOpenTeamParticipationAccptedModal}
                    setSelectedParticipationTeam={setSelectedParticipationTeam}
                    setOpenAddParticipatingTechnicalStaffModal={setOpenAddParticipatingTechnicalStaffModal}
                    setOpenAddParticipatingPlayersModal={setOpenAddParticipatingPlayersModal}
                />
                </>
            ))}
        </div>)
    }   
   else{ return (
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
    );}
};
