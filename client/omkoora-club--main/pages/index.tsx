import { Box, Col, Container, Divider, Grid, Group, Stack, Text, useMantineTheme } from "@mantine/core";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { Users, BallFootball, AlertCircle, CalendarTime, Article, Speakerphone, ShieldCheck } from "tabler-icons-react";
import useStore from "../store/useStore";
import { useStatisticsClub } from "../graphql";
import { GiAbstract042 } from "react-icons/gi";

import { GradientStatCard, OutlineStatCard } from "../components/Stats/ModernStatCards";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();
    const [allStatistics, setAllStatistics] = useState<any>(null);
    const [getStatisticsClub, { loading, error, data: dataStatisticsClub }] = useStatisticsClub();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getStatisticsClub({ variables: { idClub } });
        }
    }, [userData]);

    useEffect(() => {
        if (dataStatisticsClub && "statisticsClub" in dataStatisticsClub) {
            setAllStatistics(dataStatisticsClub.statisticsClub);
        }
    }, [dataStatisticsClub]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    return (
        <Box>
            <Head>
                <title>طموح</title>
            </Head>
            <Container size="xl" pb="xl" pt="md">
                {/* Page Title */}
                <Box mb={32}>
                    <Text
                        sx={(theme) => ({
                            fontSize: 26,
                            fontWeight: 800,
                            color: theme.colors.gray[8],
                            letterSpacing: "-0.5px",
                        })}
                    >
                        الإحصائيات
                    </Text>
                    <Text size="sm" color="dimmed" mt={4}>
                        نظرة عامة على إحصائيات النادي
                    </Text>
                    <Divider mt={16} sx={(theme) => ({ borderColor: theme.colors.gray[2] })} />
                </Box>

                {/* ── Section: اللاعبون ── */}
                <Text size="xs" color="dimmed" fw={600} mb={12} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    اللاعبون
                </Text>
                <Grid mb={24} gutter="md">
                    <Col span={12} xs={6} md={4} lg={3}>
                        <GradientStatCard
                            label="إجمالي اللاعبين"
                            value={allStatistics?.numberPlayers ?? 0}
                            gradientFrom={theme.colors.blue[5]}
                            gradientTo={theme.colors.blue[7]}
                            accentColor={theme.colors.blue[6]}
                            icon={<Users size={22} color="white" />}
                        />
                    </Col>
                    <Col span={12} xs={6} md={4} lg={3}>
                        <GradientStatCard
                            label="قيد الانتظار"
                            value={allStatistics?.numberPlayersWaiting ?? 0}
                            gradientFrom={theme.colors.orange[4]}
                            gradientTo={theme.colors.orange[6]}
                            accentColor={theme.colors.orange[6]}
                            icon={<CalendarTime size={22} color="white" />}
                        />
                    </Col>
                    <Col span={12} xs={6} md={4} lg={3}>
                        <GradientStatCard
                            label="مقبولين"
                            value={allStatistics?.numberPlayersAccepted ?? 0}
                            gradientFrom={theme.colors.green[5]}
                            gradientTo={theme.colors.green[7]}
                            accentColor={theme.colors.green[6]}
                            icon={<ShieldCheck size={22} color="white" />}
                        />
                    </Col>
                    <Col span={12} xs={6} md={4} lg={3}>
                        <GradientStatCard
                            label="مرفوضين"
                            value={allStatistics?.numberPlayersRejected ?? 0}
                            gradientFrom={theme.colors.red[4]}
                            gradientTo={theme.colors.red[6]}
                            accentColor={theme.colors.red[6]}
                            icon={<AlertCircle size={22} color="white" />}
                        />
                    </Col>
                </Grid>

                {/* ── Section: الفرق والهيكل ── */}
                <Text size="xs" color="dimmed" fw={600} mb={12} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    الفرق والهيكل
                </Text>
                <Grid gutter="md">
                    <Col span={12} xs={6} md={4} lg={3}>
                        <GradientStatCard
                            label="عدد الفرق"
                            value={allStatistics?.numberTeams ?? 0}
                            gradientFrom={theme.colors.yellow[4]}
                            gradientTo={theme.colors.yellow[6]}
                            accentColor={theme.colors.yellow[6]}
                            icon={<BallFootball size={22} color="white" />}
                        />
                    </Col>
                    <Col span={12} xs={6} md={4} lg={3}>
                        <OutlineStatCard
                            label="مجلس الإدارة"
                            value={allStatistics?.numberMembers ?? 0}
                            subLabel="عضو"
                            accentColor={theme.colors.blue[7]}
                            borderColor={theme.colors.blue[2]}
                            iconBg={theme.colors.blue[0]}
                            icon={<Article size={28} color={theme.colors.blue[6]} />}
                        />
                    </Col>
                    <Col span={12} xs={6} md={4} lg={3}>
                        <OutlineStatCard
                            label="الجهاز الفني"
                            value={allStatistics?.numberTechnicales ?? 0}
                            subLabel="موظف"
                            accentColor={theme.colors.green[7]}
                            borderColor={theme.colors.green[2]}
                            iconBg={theme.colors.green[0]}
                            icon={<Users size={28} color={theme.colors.green[6]} />}
                        />
                    </Col>
                    <Col span={12} xs={6} md={4} lg={3}>
                        <OutlineStatCard
                            label="الملاعب"
                            value={allStatistics?.numberStadiums ?? 0}
                            subLabel="مرفق"
                            accentColor={theme.colors.cyan[7]}
                            borderColor={theme.colors.cyan[2]}
                            iconBg={theme.colors.cyan[0]}
                            icon={<GiAbstract042 size={28} color={theme.colors.cyan[6]} />}
                        />
                    </Col>
                </Grid>
            </Container>
        </Box>
    );
}