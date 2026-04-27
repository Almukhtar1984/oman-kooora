import {
    ActionIcon,
    Avatar,
    Box,
    Divider,
    Flex,
    Menu,
    Text,
    Tooltip,
    Badge,
    Space,
} from "@mantine/core";
import {
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconInfoCircle,
    IconPlus,
    IconPrinter
} from '@tabler/icons-react';
import React, { useState } from "react";
import dayjs from "dayjs";

type Props = {
    data: any;
    key:any;
    onEditModal: (data:any) => void;
    onDeleteModal: (data:any) => void;
    idTeam:any;
    onShowMatchesModal: (data:any) => void;
    onShowGroupsModal: (data:any) => void;
    onAddMatchModal: (data:any) => void;
    onAddTeamModal: (data:any) => void;
    hasPermission: (permission: string) => boolean;
    setOpenTeamParticipationAccptedModal: (data:any) => void;
    setSelectedParticipationTeam: (data:any) => void;
    setSelectedData: (id: string) => void;
    
    setOpenGenerateMatchModal: (data:any) => void;
    setOpenAddParticipatingTechnicalStaffModal: (data:any) => void;
    setOpenAddParticipatingPlayersModal: (data:any) => void;
};

export const LeagueCard = ({
    key,
    data,
    idTeam,
    onEditModal,
    onDeleteModal,
    onShowMatchesModal,
    onShowGroupsModal,
    onAddMatchModal,
    onAddTeamModal,
    hasPermission,
    setSelectedData,
    setOpenGenerateMatchModal,
    setOpenTeamParticipationAccptedModal,
    setSelectedParticipationTeam,
    setOpenAddParticipatingTechnicalStaffModal,
    setOpenAddParticipatingPlayersModal
}: Props) => {
    const [openCardOptionMenu, setOpenCardOptionMenu] = useState<boolean>(false);
    const team = data.participatingTeams.find((team: any) => team.team.id === idTeam);
    return (
        <Box
            p={16}
            bg="white"
            mb={15}
           
        >
            <Flex direction="column">
                {/* Top Section */}
                <Flex justify="space-between" align="center" w="100%">
                    <Flex gap="10px" align="center">

                        <Flex direction="column" style={{ textAlign: "right", gap: "8px" }}>
                            <Text size="md" color="gray.6" style={{ fontWeight: 500 }}>
                                اسم الدورة: <Text span>{data?.name}</Text>
                            </Text>
                            <Text size="sm" color="gray.5" style={{ fontWeight: 500 }}>
                                الوصف: <Text span>{data?.description}</Text>
                            </Text>
                            <Text size="xs" color="gray.5" style={{ fontWeight: 500 }}>
                                عدد فرق البطولة: <Text span>{data?.numberTeams}</Text>
                            </Text>
                            <Text size="xs" color="gray.4" style={{ fontWeight: 500 }}>
                                حالة التسجيل:
                                <Text
                                    span
                                    size="xs"
                                    color={dayjs(data?.inscriptionExpiryDate).isAfter(dayjs()) ? "green" : "red"}
                                    style={{ marginRight: "5px" }}
                                >
                                    {dayjs(data?.inscriptionExpiryDate).isAfter(dayjs()) ? "مفتوح" : "متوقف"}
                                </Text>
                            </Text>
                        </Flex>
                    </Flex>
                    <Menu
                        withArrow
                        shadow="md"
                        opened={openCardOptionMenu}
                        onOpen={() => setOpenCardOptionMenu(true)}
                        onClose={() => setOpenCardOptionMenu(false)}
                        closeOnClickOutside

                    >
                        <Menu.Target>
                            <ActionIcon variant={"light"} color={"darck"}>
                                <IconDotsVertical size="16" color="gray" />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            
                         
                            {hasPermission("viewMatches") && (
                                <Menu.Item
                                    onClick={() => {
                                        setSelectedData(data)
                                        onShowMatchesModal(true)
                                    }}
                                    icon={<IconInfoCircle size={14} />}
                                >


                                    عرض المباريات
                                </Menu.Item>
                            )}
                            {hasPermission("viewGroups") && (
                                <Menu.Item
                                    onClick={() => {
                                setSelectedData(data)
                                onShowGroupsModal(true)
                            }}
                                    icon={<IconInfoCircle size={14} />}
                                >

                                    عرض المجموعات
                                </Menu.Item>
                            )}
                            
                            
                            {team && team.status === 'waiting' && (
                                <>
                                   <Divider />
                                   <Menu.Item
                                       onClick={() => {
                                           setOpenTeamParticipationAccptedModal(data.id);
                                           setSelectedParticipationTeam(data)
                                           
                                       }}
                                       
                                       //disabled={  daysLeft > 0?false:true}
                                   >
                                    المشاركة
                                   </Menu.Item>
                                   </>
                               )
                               
                               }
                            {team?.status === "accepted" && dayjs(data?.inscriptionExpiryDate).diff(dayjs(), "day") > 0 && (
                                            <>
                                            <Divider />
                                                <Menu.Item
                                                    onClick={() => {
                                                        setSelectedData(data);
                                                        setOpenAddParticipatingPlayersModal(true);
                                                    }}
                                                >
                                                    اضافة لاعبين
                                                </Menu.Item>

                                                <Menu.Item
                                                    onClick={() => {
                                                        setSelectedData(data);
                                                        setOpenAddParticipatingTechnicalStaffModal(true);
                                                    }}
                                                >
                                                    اضافة جهاز فني
                                                </Menu.Item>
                                            </>
                                        )}
                        </Menu.Dropdown>
                    </Menu>
                </Flex>

                {/* Center Section */}
                {data?.participatingTeams?.length > 0 && (
                    <>
                        <Divider my={12} />
                        <Text size="sm" color="gray.5">
                            الفرق المشاركة: {data?.participatingTeams?.length}
                        </Text>
                    </>
                )}

                {/* Bottom Section */}
                <Divider my={12} />
                <Flex justify="space-between" align="center" mb={5}>
                    <Text size="sm" color="gray.5" style={{fontSize:"13px"}}>
                        البداية: {dayjs(data?.startDate).format("DD/MM/YYYY")}
                    </Text>
                    <Text size="sm" color="gray.5" style={{fontSize:"13px"}}>
                        النهاية: {dayjs(data?.expiryDate).format("DD/MM/YYYY")}
                    </Text>
                </Flex>

                
                <Flex justify="space-between" align="center">
                <Text size="sm" color="gray.5" style={{fontSize:"13px"}}>
                    بداية التسجيل: {dayjs(data?.inscriptionStartDate).format("DD/MM/YYYY")}
                </Text>
                <Text size="sm" color="gray.5" style={{fontSize:"13px"}}>
                    نهاية التسجيل: {dayjs(data?.inscriptionExpiryDate).format("DD/MM/YYYY")}
                </Text>
                </Flex>
            </Flex>
        </Box>
    );
};
