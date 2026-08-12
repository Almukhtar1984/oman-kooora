import React, { useEffect } from "react";
import {
    Box, Container, Grid, Col, SimpleGrid, Group, Text, Title, Button,
    Loader, Center, ThemeIcon,
} from "@mantine/core";
import {
    ChartBar, ShieldCheck, BallFootball, Users, ClipboardList, License,
    Friends, SoccerField, Trophy, Repeat, ArrowsLeftRight, Ballpen, Refresh, MapPin,
} from "tabler-icons-react";
import useStore from "../store/useStore";
import { useClubStatistics } from "../graphql";
import { StatCard, Panel, BarList, DonutSummary } from "../components/Stats/StatKitClub";

const Statistics = () => {
    const userData = useStore((state: any) => state.userData);
    const [getClubStatistics, { data, loading, error, refetch }] = useClubStatistics();

    const idClub = userData?.person?.clubManagement?.club?.id;

    useEffect(() => {
        if (idClub) getClubStatistics({ variables: { idClub } });
    }, [idClub]);

    const s = data?.clubStatistics;

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Container size="xl" py="xl">
                {/* Header */}
                <Group position="apart" mb="xl" align="flex-end">
                    <Box>
                        <Group spacing={10}>
                            <ThemeIcon size={40} radius="md" variant="light" color="cyan">
                                <ChartBar size={24} />
                            </ThemeIcon>
                            <Title order={2} color="gray.8">الإحصاء</Title>
                        </Group>
                        <Group spacing={6} mt={6}>
                            <Text color="gray.6" size="sm">إحصاء النادي — أرقام مجمّعة فقط</Text>
                            {s?.club ? (
                                <Group spacing={4}>
                                    <Text color="gray.4" size="sm">•</Text>
                                    <Text color="cyan.7" size="sm" weight={600}>{s.club}</Text>
                                    {s?.governorate ? <><MapPin size={12} /><Text size="xs" color="gray.5">{s.governorate}</Text></> : null}
                                </Group>
                            ) : null}
                        </Group>
                    </Box>
                    <Button
                        variant="light" color="cyan" radius="md"
                        leftIcon={<Refresh size={16} />}
                        loading={loading}
                        onClick={() => (refetch ? refetch() : idClub && getClubStatistics({ variables: { idClub } }))}
                    >
                        تحديث
                    </Button>
                </Group>

                {error && (
                    <Box p="lg" bg="red.0" sx={({ colors, radius }) => ({ borderRadius: radius.md, border: "1px solid " + colors.red[2] })} mb="xl">
                        <Text color="red.7" weight={600}>تعذّر تحميل الإحصاء</Text>
                        <Text color="red.6" size="sm">{error.message}</Text>
                    </Box>
                )}

                {loading && !s ? (
                    <Center mih={400}><Loader color="cyan" /></Center>
                ) : s ? (
                    <>
                        {/* Headline stat cards */}
                        <SimpleGrid
                            cols={4}
                            spacing="lg"
                            breakpoints={[{ maxWidth: "md", cols: 2 }, { maxWidth: "xs", cols: 1 }]}
                            mb="lg"
                        >
                            <StatCard label="الفرق" value={s.teams} color="teal" icon={<ShieldCheck size={26} />} />
                            <StatCard label="اللاعبون" value={s.players} color="blue" icon={<BallFootball size={26} />} />
                            <StatCard label="الأعضاء" value={s.members} color="indigo" icon={<Users size={26} />} />
                            <StatCard label="الجهاز الفني" value={s.technicals} color="grape" icon={<ClipboardList size={26} />} />
                            <StatCard label="مجلس الإدارة" value={s.boardManagement} color="violet" icon={<License size={26} />} />
                            <StatCard label="الجمعية العمومية" value={s.assembly} color="pink" icon={<Friends size={26} />} />
                            <StatCard label="الملاعب الخضراء" value={s.stadiums} color="green" icon={<SoccerField size={26} />} />
                            <StatCard label="المسابقات" value={s.leagues} color="orange" icon={<Trophy size={26} />} />
                            <StatCard label="الإعارات" value={s.loans} color="cyan" icon={<Repeat size={26} />} />
                            <StatCard label="التنقلات" value={s.transfers} color="teal" icon={<ArrowsLeftRight size={26} />} />
                        </SimpleGrid>

                        {/* Grand total banner */}
                        <Box
                            p="lg" mb="lg"
                            sx={({ fn }) => ({
                                borderRadius: 12,
                                background: fn.linearGradient(135, fn.themeColor("cyan", 6), fn.themeColor("blue", 6)),
                                color: "white",
                            })}
                        >
                            <Group position="apart">
                                <Group spacing={12}>
                                    <Users size={30} />
                                    <Box>
                                        <Text size="sm" sx={{ opacity: 0.9 }}>إجمالي الأشخاص في النادي</Text>
                                        <Text sx={{ fontSize: 34 }} weight={800}>{Number(s.totalPeople).toLocaleString("en-US")}</Text>
                                    </Box>
                                </Group>
                                <Text size="sm" sx={{ opacity: 0.9, maxWidth: 320, textAlign: "left" }}>
                                    اللاعبون + الأعضاء + الجهاز الفني + الجمعية العمومية + مجلس الإدارة
                                </Text>
                            </Group>
                        </Box>

                        {/* Breakdowns */}
                        <Grid gutter="lg">
                            <Col span={12} md={4}>
                                <Panel title="الأنشطة الرياضية" icon={<BallFootball size={18} />}>
                                    <BarList data={s.activities} emptyText="لا توجد أنشطة مسجّلة" />
                                </Panel>
                            </Col>
                            <Col span={12} md={4}>
                                <Panel title="الفئات العمرية للاعبين" icon={<Ballpen size={18} />}>
                                    <DonutSummary data={s.ageCategories} />
                                </Panel>
                            </Col>
                            <Col span={12} md={4}>
                                <Panel title="حالة اللاعبين" icon={<BallFootball size={18} />}>
                                    <DonutSummary data={s.playersByStatus} />
                                </Panel>
                            </Col>
                        </Grid>
                    </>
                ) : null}
            </Container>
        </Box>
    );
};

export default Statistics;
