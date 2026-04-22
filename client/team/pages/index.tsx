import {Box, Col, Container, Grid, Group, Stack, Text, useMantineTheme} from "@mantine/core";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import {Icon, Users, BallFootball, AlertCircle, Inbox, Send, CurrencyDollar, CalendarTime, Article, Key} from "tabler-icons-react";
import useStore from "../store/useStore";
import { useStatisticsTeam } from "../graphql";
import { GiAbstract042 } from "react-icons/gi";

export default function Home() {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme()
    const [allStatisticsTeam, setAllStatisticsTeam] = useState<any>(null);
    const [getStatisticsTeam, { loading, error, data: dataStatisticsTeam }] = useStatisticsTeam()

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getStatisticsTeam({
                variables: {idTeam}
            })
        }
    }, [userData])
    
    useEffect(() => {
        if (dataStatisticsTeam && "statisticsTeam" in dataStatisticsTeam) {
            setAllStatisticsTeam(dataStatisticsTeam.statisticsTeam)
        }
    }, [dataStatisticsTeam])

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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberPlayers}</Text>
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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberPlayersWaiting}</Text>
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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberPlayersAccepted}</Text>
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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberPlayersRejected}</Text>
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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberMembers}</Text>
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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberTechnicales}</Text>
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
                                    <Text size={"md"} fw={"bold"}>{allStatisticsTeam?.numberStadiums}</Text>
                                </Stack>
                            </Group>
                        </Box>
                    </Col>
                </Grid>
            </Container>
        </Box>
    );
}