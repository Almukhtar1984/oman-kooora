import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    Box, Container, Group, Text, Title, Button, ThemeIcon, Paper, Stack, Badge,
    Loader, Switch, Modal, Divider, Alert, ScrollArea, Anchor,
} from "@mantine/core";
import {
    IconArticle, IconBallFootball, IconRobot, IconAlertTriangle,
    IconInfoCircle, IconRefresh, IconCircleCheck,
} from "@tabler/icons";
import { Notyf } from "notyf";
import { useAiMatchCandidates, useGenerateMatchNews, useAiSettings } from "../graphql";

const newNotyf = () => new Notyf({ duration: 4000, ripple: true, position: { x: "left", y: "bottom" } });

const stateBadge = (s: string) => {
    if (s === "end") return <Badge color="teal" variant="light">انتهت</Badge>;
    if (s === "playing") return <Badge color="orange" variant="light">جارية</Badge>;
    return <Badge color="gray" variant="light">لم تبدأ</Badge>;
};

const MatchNews = () => {
    const router = useRouter();
    const { data, loading, error, refetch } = useAiMatchCandidates(20);
    const { data: settingsData } = useAiSettings();
    const [generate] = useGenerateMatchNews();

    const [busyId, setBusyId] = useState<string | null>(null);
    const [publishMap, setPublishMap] = useState<Record<string, boolean>>({});
    const [result, setResult] = useState<any | null>(null);

    const matches: any[] = data?.aiMatchCandidates || [];
    const aiReady = settingsData?.aiSettings?.enabled;

    const onGenerate = async (m: any) => {
        const publish = Boolean(publishMap[m.id]);
        setBusyId(m.id);
        try {
            const res = await generate({ variables: { id_match: m.id, publish } });
            const blog = res?.data?.generateMatchNews;
            setResult({ ...blog, _match: m });
            newNotyf().open({ type: "success", message: publish ? "تم توليد الخبر ونشره" : "تم توليد الخبر كمسودة" });
        } catch (e: any) {
            newNotyf().open({ type: "error", message: e?.message || "تعذّر توليد الخبر" });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>مولّد أخبار المباريات</title></Head>
            <Container size="md" py="xl">
                <Group position="apart" mb="md" align="flex-end">
                    <Group spacing={12}>
                        <ThemeIcon size={42} radius="md" variant="light" color="grape">
                            <IconArticle size={26} />
                        </ThemeIcon>
                        <Box>
                            <Title order={2} color="gray.8">مولّد أخبار المباريات</Title>
                            <Text color="gray.6" size="sm">اختر مباراة ودع الذكاء الاصطناعي يكتب خبر نتيجتها.</Text>
                        </Box>
                    </Group>
                    <Button variant="light" color="grape" radius="md" leftIcon={<IconRefresh size={16} />} loading={loading} onClick={() => refetch()}>
                        تحديث
                    </Button>
                </Group>

                {!aiReady && (
                    <Alert icon={<IconAlertTriangle size={18} />} color="orange" variant="light" radius="md" mb="md">
                        <Text size="sm">
                            ميزة الذكاء الاصطناعي غير مفعّلة. فعّلها واربط مزوّدًا من{" "}
                            <Anchor color="grape" onClick={() => router.push("/ai")} sx={{ cursor: "pointer" }}>صفحة الربط</Anchor>{" "}
                            قبل توليد الأخبار.
                        </Text>
                    </Alert>
                )}

                {error && (
                    <Alert icon={<IconAlertTriangle size={18} />} color="red" variant="light" radius="md" mb="md">
                        <Text size="sm">تعذّر تحميل المباريات: {error.message}</Text>
                    </Alert>
                )}

                {loading ? (
                    <Group position="center" py={60}><Loader variant="dots" /></Group>
                ) : matches.length === 0 ? (
                    <Paper p="xl" radius="md" withBorder>
                        <Group position="center"><Text color="gray.6">لا توجد مباريات متاحة بعد.</Text></Group>
                    </Paper>
                ) : (
                    <Stack spacing="sm">
                        {matches.map((m) => (
                            <Paper key={m.id} p="md" radius="md" withBorder>
                                <Group position="apart" align="center" noWrap>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Group spacing={8} mb={4}>
                                            <ThemeIcon size={26} radius="md" variant="light" color="gray"><IconBallFootball size={16} /></ThemeIcon>
                                            <Text weight={600} color="gray.8" lineClamp={1}>
                                                {m.teamA} <Text span color="grape" weight={700}>{m.goalsA} - {m.goalsB}</Text> {m.teamB}
                                            </Text>
                                        </Group>
                                        <Group spacing={8}>
                                            {stateBadge(m.matchState)}
                                            {m.stage ? <Badge color="grape" variant="outline">{m.stage}</Badge> : null}
                                            {m.league ? <Text size="xs" color="gray.6">{m.league}</Text> : null}
                                            {m.date ? <Text size="xs" color="gray.5">{m.date}</Text> : null}
                                        </Group>
                                    </Box>
                                    <Stack spacing={6} align="flex-end">
                                        <Switch
                                            size="sm" color="teal"
                                            label="نشر مباشرة"
                                            checked={Boolean(publishMap[m.id])}
                                            onChange={(e) => setPublishMap((p) => ({ ...p, [m.id]: e.currentTarget.checked }))}
                                            styles={{ label: { fontSize: 12 } }}
                                        />
                                        <Button
                                            size="xs" radius="md" color="grape"
                                            leftIcon={<IconRobot size={14} />}
                                            loading={busyId === m.id}
                                            disabled={!aiReady}
                                            onClick={() => onGenerate(m)}
                                        >
                                            توليد خبر
                                        </Button>
                                    </Stack>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Container>

            {/* Generated news preview */}
            <Modal
                opened={Boolean(result)} onClose={() => setResult(null)}
                size="lg" radius="md" title={<Text weight={700}>الخبر المُولَّد</Text>}
            >
                {result && (
                    <Stack spacing="sm">
                        <Group spacing={8}>
                            {result.status === "accepted"
                                ? <Badge color="teal" variant="light" leftSection={<IconCircleCheck size={12} />}>منشور</Badge>
                                : <Badge color="orange" variant="light">مسودة — بانتظار المراجعة</Badge>}
                        </Group>
                        <Box>
                            <Text size="xs" color="gray.5">العنوان</Text>
                            <Title order={4} color="gray.9">{result.subject}</Title>
                        </Box>
                        <Box>
                            <Text size="xs" color="gray.5">المقدّمة</Text>
                            <Text color="gray.7" size="sm">{result.short_description}</Text>
                        </Box>
                        <Divider />
                        <Box>
                            <Text size="xs" color="gray.5" mb={4}>نص الخبر</Text>
                            <ScrollArea.Autosize maxHeight={280}>
                                <Text color="gray.8" sx={{ lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{result.description}</Text>
                            </ScrollArea.Autosize>
                        </Box>
                        {result.status !== "accepted" && (
                            <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light" radius="md">
                                <Text size="xs" color="gray.7">حُفظ كمسودة. سيظهر في موجز الأخبار بعد اعتماده.</Text>
                            </Alert>
                        )}
                        <Group position="right">
                            <Button variant="default" radius="md" onClick={() => setResult(null)}>إغلاق</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Box>
    );
};

export default MatchNews;
