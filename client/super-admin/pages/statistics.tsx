import React from "react";
import {
    Box, Container, Grid, Col, SimpleGrid, Group, Text, Title, Button,
    Loader, Center, Table, Badge, ThemeIcon, ScrollArea,
} from "@mantine/core";
import {
    IconBuildingCommunity, IconShieldHalfFilled, IconBallFootball, IconUsers,
    IconClipboardList, IconFriends, IconSoccerField, IconTrophy,
    IconArrowsExchange, IconArrowsExchange2, IconEye, IconRefresh,
    IconChartBar, IconBallpen, IconMapPin, IconLicense,
} from "@tabler/icons";
import { usePlatformStatistics } from "../graphql";
import { StatCard, Panel, BarList, DonutSummary } from "../components/Statistics/StatKit";

const Statistics = () => {
    const { data, loading, error, refetch } = usePlatformStatistics();
    const s = data?.platformStatistics;

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Container size="xl" py="xl">
                {/* Header */}
                <Group position="apart" mb="xl" align="flex-end">
                    <Box>
                        <Group spacing={10}>
                            <ThemeIcon size={40} radius="md" variant="light" color="cyan">
                                <IconChartBar size={24} />
                            </ThemeIcon>
                            <Title order={2} color="gray.8">الإحصاء</Title>
                        </Group>
                        <Text color="gray.6" size="sm" mt={6}>
                            نظرة عامة على المنصة — أرقام مجمّعة فقط
                        </Text>
                    </Box>
                    <Button
                        variant="light" color="cyan" radius="md"
                        leftIcon={<IconRefresh size={16} />}
                        loading={loading}
                        onClick={() => refetch()}
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
                            <StatCard label="الأندية" value={s.clubs} color="cyan" icon={<IconBuildingCommunity size={26} />} />
                            <StatCard label="الفرق" value={s.teams} color="teal" icon={<IconShieldHalfFilled size={26} />} />
                            <StatCard label="اللاعبون" value={s.players} color="blue" icon={<IconBallFootball size={26} />} />
                            <StatCard label="الأعضاء" value={s.members} color="indigo" icon={<IconUsers size={26} />} />
                            <StatCard label="الجهاز الفني" value={s.technicals} color="grape" icon={<IconClipboardList size={26} />} />
                            <StatCard label="مجلس الإدارة" value={s.boardManagement} color="violet" icon={<IconLicense size={26} />} />
                            <StatCard label="الجمعية العمومية" value={s.assembly} color="pink" icon={<IconFriends size={26} />} />
                            <StatCard label="الملاعب الخضراء" value={s.stadiums} color="green" icon={<IconSoccerField size={26} />} />
                            <StatCard label="المسابقات" value={s.leagues} color="orange" icon={<IconTrophy size={26} />} />
                            <StatCard label="الإعارات" value={s.loans} color="cyan" icon={<IconArrowsExchange size={26} />} />
                            <StatCard label="التنقلات" value={s.transfers} color="teal" icon={<IconArrowsExchange2 size={26} />} />
                            <StatCard label="المشاهدون في التطبيقات" value={s.viewers} color="blue" icon={<IconEye size={26} />} />
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
                                    <IconUsers size={30} />
                                    <Box>
                                        <Text size="sm" sx={{ opacity: 0.9 }}>إجمالي الأشخاص في المنصة</Text>
                                        <Text sx={{ fontSize: 34 }} weight={800}>{Number(s.totalPeople).toLocaleString("en-US")}</Text>
                                    </Box>
                                </Group>
                                <Text size="sm" sx={{ opacity: 0.9, maxWidth: 320, textAlign: "left" }}>
                                    اللاعبون + الأعضاء + الجهاز الفني + الجمعية العمومية + مجلس الإدارة
                                </Text>
                            </Group>
                        </Box>

                        {/* Breakdowns */}
                        <Grid gutter="lg" mb="lg">
                            <Col span={12} md={6}>
                                <Panel title="الأنشطة الرياضية" icon={<IconBallFootball size={18} />}>
                                    <BarList data={s.activities} emptyText="لا توجد أنشطة مسجّلة" />
                                </Panel>
                            </Col>
                            <Col span={12} md={6}>
                                <Panel title="الفئات العمرية للاعبين" icon={<IconBallpen size={18} />}>
                                    <DonutSummary data={s.ageCategories} />
                                </Panel>
                            </Col>
                            <Col span={12} md={4}>
                                <Panel title="حالة اللاعبين" icon={<IconBallFootball size={18} />}>
                                    <DonutSummary data={s.playersByStatus} />
                                </Panel>
                            </Col>
                            <Col span={12} md={4}>
                                <Panel title="الأندية حسب المحافظة" icon={<IconMapPin size={18} />}>
                                    <BarList data={s.clubsByGovernorate} />
                                </Panel>
                            </Col>
                            <Col span={12} md={4}>
                                <Panel title="المستخدمون حسب الدور" icon={<IconUsers size={18} />}>
                                    <BarList data={s.usersByRole} />
                                </Panel>
                            </Col>
                        </Grid>

                        {/* Per-club grand totals */}
                        <Panel title="الإجمالي الكلي لكل نادٍ" icon={<IconBuildingCommunity size={18} />}
                            right={<Badge color="cyan" variant="light" radius="sm">{s.clubTotals?.length || 0} نادٍ</Badge>}
                        >
                            <ScrollArea>
                                <Table highlightOnHover verticalSpacing="sm" sx={{ minWidth: 720 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "right" }}>النادي</th>
                                            <th style={{ textAlign: "center" }}>الفرق</th>
                                            <th style={{ textAlign: "center" }}>اللاعبون</th>
                                            <th style={{ textAlign: "center" }}>الأعضاء</th>
                                            <th style={{ textAlign: "center" }}>الجهاز الفني</th>
                                            <th style={{ textAlign: "center" }}>الجمعية</th>
                                            <th style={{ textAlign: "center" }}>مجلس الإدارة</th>
                                            <th style={{ textAlign: "center" }}>المجموع الكلي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(s.clubTotals || []).map((c: any, i: number) => (
                                            <tr key={c.id || i}>
                                                <td>
                                                    <Group spacing={8} noWrap>
                                                        {i === 0 ? <IconTrophy size={16} color="#f59f00" /> : (
                                                            <Text size="xs" color="gray.5" w={16} ta="center">{i + 1}</Text>
                                                        )}
                                                        <Text size="sm" weight={i === 0 ? 700 : 500} color="gray.8" lineClamp={1}>{c.name}</Text>
                                                    </Group>
                                                </td>
                                                <td style={{ textAlign: "center" }}>{c.teams}</td>
                                                <td style={{ textAlign: "center" }}>{c.players}</td>
                                                <td style={{ textAlign: "center" }}>{c.members}</td>
                                                <td style={{ textAlign: "center" }}>{c.technicals}</td>
                                                <td style={{ textAlign: "center" }}>{c.assembly}</td>
                                                <td style={{ textAlign: "center" }}>{c.board}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    <Badge color={i === 0 ? "cyan" : "gray"} variant={i === 0 ? "filled" : "light"} radius="sm">
                                                        {Number(c.total).toLocaleString("en-US")}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {!s.clubTotals?.length && (
                                            <tr><td colSpan={8}><Text size="sm" color="gray.5" ta="center" py="md">لا توجد أندية</Text></td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </ScrollArea>
                        </Panel>
                    </>
                ) : null}
            </Container>
        </Box>
    );
};

export default Statistics;
