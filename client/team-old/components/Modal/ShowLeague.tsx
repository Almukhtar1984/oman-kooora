import { Box, useMantineTheme, Text, ActionIcon, Menu, Table, Button } from "@mantine/core";
import { IconDotsVertical, IconInfoCircle,IconPrinter } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import { useGetRanking, useTopGoal,useCardsByLeague } from "../../graphql";

type Props = {
    setSelectedData: (id: string) => void;
    data?: any;
    setOpenShowParticipatingPlayersModal: (status: boolean) => void;
    setOpenShowParticipatingTechnicalStaffModal: (status: boolean) => void;
} & ModalProps;

export const ShowLeague = ({ data, setSelectedData, setOpenShowParticipatingPlayersModal, setOpenShowParticipatingTechnicalStaffModal, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();
    const [groupedData, setGroupedData] = useState<any>([]);
    const [teamPoints, setTeamPoints] = useState<any>([]);
    const [topGoal, setTopGoal] = useState<any>([]);
    const [sortedYellowCards, setsortedYellowCards] = useState<any>([]);
    const [sortedRedCards, setsortedRedCards] = useState<any>([]);


    const [getRanking, { data: dataRanking }] = useGetRanking();
    const [getTopGoal, { data: dataTopGoal }] = useTopGoal();
    const [getCards, { data: dataCards }] = useCardsByLeague();

    useEffect(() => {
        if (data && props.opened) {
            const leagueId = data?.id;

            getRanking({
                variables: {
                    leagueId: leagueId
                },
                onCompleted: ({ calculatePoints }) => {
                    setTeamPoints(calculatePoints);
                },
                onError: () => {
                },
            });
            getTopGoal({
                variables: {
                    leagueId: leagueId
                },
                onCompleted: ({ calculateGoalPlayer }) => {
                    setTopGoal(calculateGoalPlayer);
                },
                onError: () => {
                },
            });

            let groupedData = new Map();

            for (let i = 0; i < data?.participatingTeams?.length; i++) {
                const item = data?.participatingTeams?.[i];

                if (groupedData.has(item.group)) {
                    groupedData.get(item.group).push(item);
                } else {
                    groupedData.set(item.group, [item]);
                }
            }

            setGroupedData(
                Array.from(groupedData.values()).sort((a, b) => {
                    return a[0].group.localeCompare(b[0].group);
                })
            );
            getCards({
                variables: { leagueId },
                onCompleted: ({ getCardsByLeague }) => {
                  
                     setsortedYellowCards([...getCardsByLeague.yellowCards].sort((a, b) => b.count - a.count));
                     setsortedRedCards([...getCardsByLeague.redCards].sort((a, b) => b.count - a.count));

               
                },
                onError: (error) => {
                  console.error("getCardsByLeague error:", error);
                },
              });
        }
    }, [data, props.opened]);

    const getTeamStats = (teamId: string) => {
        const teamStats = teamPoints.find((tp: any) => tp.team.id === teamId);
        return teamStats ? teamStats : { points: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0 };
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            size={"85%"}
            footer={<></>}
        >
        <Button
        color={"blue"}
        component={"a"}
        href={`https://print.omkooora.com/#/league/${data?.id}`}
        target={"_blank"}
        ><IconPrinter size={18} />
            طباعة الاحصائيات
        </Button>
            <Box style={{ padding: 20 }}>
                {groupedData?.map((group: any, groupIndex: number) => (
                    <Box
                        key={groupIndex}
                        mb={20}
                        style={{
                            backgroundColor: theme.white,
                            padding: 20,
                            borderRadius: 8,
                            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <Text ta={"center"} size={"20px"} fw={"bold"} color={theme.colors.gray[7]} mb={10} style={{paddingBottom:'25px'}} >
                            {`المجموعة ${group[0].group}`}
                        </Text>
                        <Table striped highlightOnHover>
                            <thead>
                                <tr style={{ textAlign: "right" }}>
                                    <th>اسم النادي</th>
                                    <th>النقاط</th>
                                    <th>المباريات</th>
                                    <th>فوز</th>
                                    <th>خسارة</th>
                                    <th>تعادل</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                                {group
                                    .map((teamData: any) => {
                                        const { points, matchesPlayed, wins, losses, draws } = getTeamStats(teamData.team.id);
                                        return { ...teamData, points, matchesPlayed, wins, losses, draws };
                                    })
                                    .sort((a: any, b: any) => b.points - a.points)
                                    .map((teamData: any, teamIndex: number) => (
                                        <tr key={teamIndex} style={{ padding: "10px 0" }}>
                                            <td style={{ padding: "10px 0",display:'flex',alignItems:'center' }}>
                                                <Menu shadow="md" width={200}>
                                                    <Menu.Target>
                                                        <ActionIcon variant={"transparent"} color={"gray"}>
                                                            <IconDotsVertical size="1rem" />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item
                                                            icon={<IconInfoCircle size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(teamData?.id);
                                                                setOpenShowParticipatingPlayersModal(true);
                                                            }}
                                                        >
                                                            عرض اللاعبين
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            icon={<IconInfoCircle size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(teamData?.id);
                                                                setOpenShowParticipatingTechnicalStaffModal(true);
                                                            }}
                                                        >
                                                            عرض الجهاز الفني
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                                {teamData.team?.name}
                                            </td>
                                            <td style={{ padding: "10px 0" }}>{teamData.points}</td>
                                            <td style={{ padding: "10px 0" }}>{teamData.matchesPlayed}</td>
                                            <td style={{ padding: "10px 0" }}>{teamData.wins}</td>
                                            <td style={{ padding: "10px 0" }}>{teamData.losses}</td>
                                            <td style={{ padding: "10px 0" }}>{teamData.draws}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </Box>
                ))}
                <Box
                    style={{
                        backgroundColor: theme.white,
                        padding: 20,
                        borderRadius: 8,
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                        marginTop: 20
                    }}
                >
                    <Text ta={"center"} size={"20px"} fw={"bold"} color={theme.colors.gray[7]} mb={10} style={{paddingBottom:'25px'}}>
                        الهدافين
                    </Text>
                    <Table striped highlightOnHover>
                        <thead>
                            <tr style={{ textAlign: "right" }}>
                                <th>اسم اللاعب</th>
                                <th>الفريق</th>
                                <th>عدد الأهداف</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topGoal.map((player: any, playerIndex: number) => (
                                <tr key={playerIndex} style={{ padding: "10px 0" }}>
                                    <td style={{ padding: "10px 0" }}>
                                        {`${player.PlayerID.player.person.first_name} ${player.PlayerID.player.person.second_name} ${player.PlayerID.player.person.third_name}`}
                                    </td>
                                    <td style={{ padding: "10px 0" }}>{player.team}</td>
                                    <td style={{ padding: "10px 0" }}>{player.Goal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Box>
                

                <Box
                style={{
                    backgroundColor: theme.white,
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                    marginTop: 20
                }}
                className="Table-leagues"
                >
                <Text ta="center" size="20px" fw="bold" color={theme.colors.gray[7]} mb={10} style={{ paddingBottom: "25px" }}>
                    البطاقات الصفراء
                </Text>
                <Table striped highlightOnHover>
                    <thead>
                    <tr style={{ textAlign: "right" }}>
                        <th>اسم اللاعب</th>
                        <th>الفريق</th>
                        <th>رقم اللاعب</th>
                        <th>عدد البطاقات</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedYellowCards.map((card: any, index: number) => (
                        <tr key={index} style={{ padding: "10px 0" }}>
                        <td style={{ padding: "10px 0" }}>{card.player}</td>
                        <td style={{ padding: "10px 0" }}>{card.team.name}</td>
                        <td style={{ padding: "10px 0" }}>{card.number}</td>
                        <td style={{ padding: "10px 0" }}>{card.count}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                </Box>

                <Box
                style={{
                    backgroundColor: theme.white,
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                    marginTop: 20
                }}
                className="Table-leagues"
                >
                <Text ta="center" size="20px" fw="bold" color={theme.colors.gray[7]} mb={10} style={{ paddingBottom: "25px" }}>
                    البطاقات الحمراء
                </Text>
                <Table striped highlightOnHover>
                    <thead>
                    <tr style={{ textAlign: "right" }}>
                        <th>اسم اللاعب</th>
                        <th>الفريق</th>
                        <th>رقم اللاعب</th>
                        <th>عدد البطاقات</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedRedCards .map((card: any, index: number) => (
                        <tr key={index} style={{ padding: "10px 0" }}>
                        <td style={{ padding: "10px 0" }}>{card.player}</td>
                        <td style={{ padding: "10px 0" }}>{card.team.name}</td>
                        <td style={{ padding: "10px 0" }}>{card.number}</td>
                        <td style={{ padding: "10px 0" }}>{card.count}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                </Box>
            </Box>
        </Modal>
    );
};
