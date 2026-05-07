import {Box, Col, Container, Grid, Group, Stack, Text, useMantineTheme} from "@mantine/core";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import {Icon, Users, BallFootball, AlertCircle, Inbox, Send, CurrencyDollar, CalendarTime, Article, Key} from "tabler-icons-react";
import useStore from "../store/useStore";
import { useStatisticsClub, useStatisticsTeam } from "../graphql";
import { GiAbstract042 } from "react-icons/gi";

export default function Home() {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme()
    const [allStatistics, setAllStatistics] = useState<any>(null);
    const [getStatisticsClub, { loading, error, data: dataStatisticsClub }] = useStatisticsClub()

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            
            getStatisticsClub({
                variables: {idClub}
            })
        }
    }, [userData, getStatisticsClub])
    
    useEffect(() => {
        if (dataStatisticsClub && "statisticsClub" in dataStatisticsClub) {
            setAllStatistics(dataStatisticsClub.statisticsClub)
        }
    }, [dataStatisticsClub])

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    return (
        <Box>
            <Head>
                <title>طموح</title>
            </Head>
            <Container size={"xl"}>
                <Grid>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.blue[5], 0.7)} style={{borderRadius: 5}}>
                                    <BallFootball color={theme.colors.cyan[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد اللاعبين</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberPlayers}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.yellow[5], 0.7)} style={{borderRadius: 5}}>
                                    <BallFootball color={theme.colors.yellow[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد اللاعبين قيد الانتظار</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberPlayersWaiting}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.green[5], 0.7)} style={{borderRadius: 5}}>
                                    <BallFootball color={theme.colors.green[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد اللاعبين مقبولين</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberPlayersAccepted}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.red[5], 0.7)} style={{borderRadius: 5}}>
                                    <BallFootball color={theme.colors.red[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد اللاعبين مرفوضين</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberPlayersRejected}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.blue[5], 0.7)} style={{borderRadius: 5}}>
                                    <BallFootball color={theme.colors.cyan[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد الفرق</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberTeams}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.blue[5], 0.7)} style={{borderRadius: 5}}>
                                    <Users color={theme.colors.cyan[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد مجلس الادارة</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberMembers}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.blue[5], 0.7)} style={{borderRadius: 5}}>
                                    <Users color={theme.colors.cyan[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد الجهاز الفني</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberTechnicales}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                    <Col span={3}>
                        <Box bg={theme.white} p={15} py={25}>
                            <Group>
                                <Group position="center" align="center" h={45} w={45} bg={theme.fn.lighten(theme.colors.blue[5], 0.7)} style={{borderRadius: 5}}>
                                    <GiAbstract042 color={theme.colors.cyan[5]} size={24} />
                                </Group>
                                <Stack justify="center" align="flex-start" spacing={3}>
                                    <Text size={"sm"}>عدد الملاعب</Text>
                                    <Text size={"md"} fw={"bold"}>{allStatistics?.numberStadiums}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                </Grid>
            </Container>
        </Box>
    );
}
