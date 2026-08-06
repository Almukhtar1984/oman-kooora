import React, { useState } from "react";
import {
    Box, Container, Grid, Col, SimpleGrid, Group, Text, Title, Button,
    Loader, Center, Table, Badge, ThemeIcon, ScrollArea, Modal, Progress, Divider,
} from "@mantine/core";
import {
    IconBuildingCommunity, IconShieldHalfFilled, IconBallFootball, IconUsers,
    IconClipboardList, IconFriends, IconSoccerField, IconTrophy,
    IconArrowsExchange, IconArrowsExchange2, IconEye, IconRefresh,
    IconChartBar, IconBallpen, IconMapPin, IconLicense, IconChevronLeft,
} from "@tabler/icons";
import { usePlatformStatistics } from "../graphql";
import { StatCard, Panel, BarList, DonutSummary, MiniStat } from "../components/Statistics/StatKit";

// Per-club drill-down metrics: which clubTotals field each headline card maps to.
type Metric = { field: string; label: string; color: string; icon: React.ReactNode };

const Statistics = () => {
    const { data, loading, error, refetch } = usePlatformStatistics();
    const s = data?.platformStatistics;

    const [metric, setMetric] = useState<Metric | null>(null);
    const [club, setClub] = useState<any | null>(null);

    const clubs: any[] = s?.clubTotals || [];
    const rankedByMetric = metric
        ? [...clubs].map((c) => ({ ...c, _v: c[metric.field] || 0 })).sort((a, b) => b._v - a._v)
        : [];
    const metricMax = Math.max(1, ...rankedByMetric.map((c) => c._v));

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
                            نظرة عامة على المنصة — أرقام مجمّعة فقط. اضغط أي بطاقة أو نادٍ لعرض التفاصيل.
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
                        {/* Headline stat cards (clickable ones drill down per club) */}
                        <SimpleGrid
                            cols={4}
                            spacing="lg"
                            breakpoints={[{ maxWidth: "md", cols: 2 }, { maxWidth: "xs", cols: 1 }]}
                            mb="lg"
                        >
                            <StatCard label="الأندية" value={s.clubs} color="cyan" icon={<IconBuildingCommunity size={26} />}
                                onClick={() => setMetric({ field: "total", label: "الأندية (حسب إجمالي الأشخاص)", color: "cyan", icon: <IconBuildingCommunity size={18} /> })} />
                            <StatCard label="الفرق" value={s.teams} color="teal" icon={<IconShieldHalfFilled size={26} />}
                                onClick={() => setMetric({ field: "teams", label: "الفرق", color: "teal", icon: <IconShieldHalfFilled size={18} /> })} />
                            <StatCard label="اللاعبون" value={s.players} color="blue" icon={<IconBallFootball size={26} />}
                                onClick={() => setMetric({ field: "players", label: "اللاعبون", color: "blue", icon: <IconBallFootball size={18} /> })} />
                            <StatCard label="الأعضاء" value={s.members} color="indigo" icon={<IconUsers size={26} />}
                                onClick={() => setMetric({ field: "members", label: "الأعضاء", color: "indigo", icon: <IconUsers size={18} /> })} />
                            <StatCard label="الجهاز الفني" value={s.technicals} color="grape" icon={<IconClipboardList size={26} />}
                                onClick={() => setMetric({ field: "technicals", label: "الجهاز الفني", color: "grape", icon: <IconClipboardList size={18} /> })} />
                            <StatCard label="مجلس الإدارة" value={s.boardManagement} color="violet" icon={<IconLicense size={26} />}
                                onClick={() => setMetric({ field: "board", label: "مجلس الإدارة", color: "violet", icon: <IconLicense size={18} /> })} />
                            <StatCard label="الجمعية العمومية" value={s.assembly} color="pink" icon={<IconFriends size={26} />}
                                onClick={() => setMetric({ field: "assembly", label: "الجمعية العمومية", color: "pink", icon: <IconFriends size={18} /> })} />
                            <StatCard label="الملاعب الخضراء" value={s.stadiums} color="green" icon={<IconSoccerField size={26} />}
                                onClick={() => setMetric({ field: "stadiums", label: "الملاعب الخضراء", color: "green", icon: <IconSoccerField size={18} /> })} />
                            <StatCard label="المسابقات" value={s.leagues} color="orange" icon={<IconTrophy size={26} />}
                                onClick={() => setMetric({ field: "leagues", label: "المسابقات", color: "orange", icon: <IconTrophy size={18} /> })} />
                            <StatCard label="الإعارات" value={s.loans} color="cyan" icon={<IconArrowsExchange size={26} />}
                                onClick={() => setMetric({ field: "loans", label: "الإعارات", color: "cyan", icon: <IconArrowsExchange size={18} /> })} />
                            <StatCard label="التنقلات" value={s.transfers} color="teal" icon={<IconArrowsExchange2 size={26} />}
                                onClick={() => setMetric({ field: "transfers", label: "التنقلات", color: "teal", icon: <IconArrowsExchange2 size={18} /> })} />
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

                        {/* Per-club grand totals — each row opens the club detail */}
                        <Panel title="الإجمالي الكلي لكل نادٍ" icon={<IconBuildingCommunity size={18} />}
                            right={<Badge color="cyan" variant="light" radius="sm">{clubs.length} نادٍ</Badge>}
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
                                        {clubs.map((c: any, i: number) => (
                                            <tr key={c.id || i} style={{ cursor: "pointer" }} onClick={() => setClub(c)}>
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
                                        {!clubs.length && (
                                            <tr><td colSpan={8}><Text size="sm" color="gray.5" ta="center" py="md">لا توجد أندية</Text></td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </ScrollArea>
                            <Text size="xs" color="gray.5" mt="sm">💡 اضغط على أي نادٍ لعرض تفاصيله الكاملة.</Text>
                        </Panel>
                    </>
                ) : null}
            </Container>

            {/* ---- Metric → per-club distribution modal ---- */}
            <Modal
                opened={!!metric}
                onClose={() => setMetric(null)}
                size="lg"
                radius="md"
                title={
                    metric ? (
                        <Group spacing={8}>
                            <ThemeIcon size={30} radius="md" variant="light" color={metric.color}>{metric.icon}</ThemeIcon>
                            <Text weight={700}>توزيع «{metric.label}» على الأندية</Text>
                        </Group>
                    ) : ""
                }
            >
                {metric && (
                    <Flexish>
                        {rankedByMetric.map((c, i) => (
                            <Box
                                key={c.id || i}
                                p="sm" mb={8}
                                onClick={() => { setClub(c); setMetric(null); }}
                                sx={({ colors, radius }) => ({
                                    borderRadius: radius.sm, cursor: "pointer",
                                    border: "1px solid " + colors.gray[2],
                                    "&:hover": { background: colors.gray[0], borderColor: colors[metric.color][3] },
                                })}
                            >
                                <Group position="apart" mb={6} noWrap>
                                    <Group spacing={8} noWrap>
                                        {i === 0 ? <IconTrophy size={15} color="#f59f00" /> : <Text size="xs" color="gray.5" w={14} ta="center">{i + 1}</Text>}
                                        <Text size="sm" weight={600} color="gray.8" lineClamp={1}>{c.name}</Text>
                                    </Group>
                                    <Group spacing={6} noWrap>
                                        <Text size="sm" weight={800} color="gray.8">{Number(c._v).toLocaleString("en-US")}</Text>
                                        <IconChevronLeft size={14} color="#adb5bd" />
                                    </Group>
                                </Group>
                                <Progress value={(c._v / metricMax) * 100} color={metric.color} radius="xl" size="sm" />
                            </Box>
                        ))}
                    </Flexish>
                )}
            </Modal>

            {/* ---- Club detail modal ---- */}
            <Modal
                opened={!!club}
                onClose={() => setClub(null)}
                size="lg"
                radius="md"
                title={
                    club ? (
                        <Group spacing={10}>
                            <ThemeIcon size={34} radius="md" variant="light" color="cyan"><IconBuildingCommunity size={20} /></ThemeIcon>
                            <Box>
                                <Text weight={800} size="lg" color="gray.8" lineClamp={1}>{club.name}</Text>
                                {club.governorate ? (
                                    <Group spacing={4}><IconMapPin size={12} color="#868e96" /><Text size="xs" color="gray.6">{club.governorate}</Text></Group>
                                ) : null}
                            </Box>
                        </Group>
                    ) : ""
                }
            >
                {club && (
                    <Box>
                        {/* total banner */}
                        <Box p="md" mb="md" sx={({ fn }) => ({
                            borderRadius: 10, textAlign: "center",
                            background: fn.linearGradient(135, fn.themeColor("cyan", 6), fn.themeColor("blue", 6)), color: "white",
                        })}>
                            <Text size="xs" sx={{ opacity: 0.9 }}>المجموع الكلي للأشخاص</Text>
                            <Text sx={{ fontSize: 30 }} weight={800}>{Number(club.total).toLocaleString("en-US")}</Text>
                        </Box>

                        <SimpleGrid cols={3} spacing="sm" breakpoints={[{ maxWidth: "xs", cols: 2 }]}>
                            <MiniStat label="الفرق" value={club.teams} color="teal" icon={<IconShieldHalfFilled size={15} />} />
                            <MiniStat label="اللاعبون" value={club.players} color="blue" icon={<IconBallFootball size={15} />} />
                            <MiniStat label="الأعضاء" value={club.members} color="indigo" icon={<IconUsers size={15} />} />
                            <MiniStat label="الجهاز الفني" value={club.technicals} color="grape" icon={<IconClipboardList size={15} />} />
                            <MiniStat label="مجلس الإدارة" value={club.board} color="violet" icon={<IconLicense size={15} />} />
                            <MiniStat label="الجمعية العمومية" value={club.assembly} color="pink" icon={<IconFriends size={15} />} />
                            <MiniStat label="المسابقات" value={club.leagues} color="orange" icon={<IconTrophy size={15} />} />
                            <MiniStat label="الملاعب" value={club.stadiums} color="green" icon={<IconSoccerField size={15} />} />
                            <MiniStat label="الإعارات" value={club.loans} color="cyan" icon={<IconArrowsExchange size={15} />} />
                            <MiniStat label="التنقلات" value={club.transfers} color="teal" icon={<IconArrowsExchange2 size={15} />} />
                        </SimpleGrid>

                        <Divider my="md" />
                        <Grid gutter="md">
                            <Col span={12} sm={6}>
                                <Text size="sm" weight={700} color="gray.7" mb="xs">الأنشطة الرياضية</Text>
                                <BarList data={(club.activities || []).filter((a: any) => a.count > 0)} emptyText="لا توجد فرق" />
                            </Col>
                            <Col span={12} sm={6}>
                                <Text size="sm" weight={700} color="gray.7" mb="xs">الفئات العمرية للاعبين</Text>
                                <BarList data={(club.ageCategories || []).filter((a: any) => a.count > 0)} emptyText="لا يوجد لاعبون" />
                            </Col>
                        </Grid>
                    </Box>
                )}
            </Modal>
        </Box>
    );
};

// tiny local wrapper to avoid importing Flex just for the modal list
const Flexish = ({ children }: { children: React.ReactNode }) => <Box>{children}</Box>;

export default Statistics;
