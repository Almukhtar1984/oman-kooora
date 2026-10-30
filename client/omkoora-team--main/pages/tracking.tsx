import {
    Badge, Box, Button, Container, Group, Paper, SegmentedControl, Stack, Text, Title,
} from "@mantine/core";
import { Coin, Route } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import { useMyRequestFlows } from "../graphql";
import DataState from "../components/Loading/DataState";
import { RequestTrackDrawer } from "../components/RequestTrack";

// تتبّع الطلبات — صفحة الفريق التي كانت ناقصة.
//
// «الفريق يقدم طلب على اللاعب … يعني الرجّال ما يدري اتخذ قرار ولا لا». أربعة
// طلبات تمشي في طريق واحد — تسجيل، انتقال، إعارة، استقالة — وهذه الصفحة تقول
// لكل واحد منها: أين يقف، ودور مَن الآن، وما بقي عليه. والسداد من الطلب نفسه:
// «سدّد الرسوم» يفتح خطّه حيث يُرفع الإيصال، لا صفحةً أخرى يُبحث فيها عنه.

const STAGE_COLOR: Record<string, string> = {
    draft: "gray",
    submitted: "blue",
    rejected_initial: "orange",
    club_processing: "blue",
    awaiting_payment: "orange",
    paid_review: "blue",
    approved: "teal",
    rejected_final: "red",
    cancelled: "gray",
};

export default function Tracking() {
    const [filter, setFilter] = useState("mine");
    const [target, setTarget] = useState<any>(null);

    const [getFlows, { data, loading }] = useMyRequestFlows();

    const refresh = () => getFlows({ fetchPolicy: "network-only" });

    useEffect(() => { getFlows({ fetchPolicy: "cache-and-network" }); }, [getFlows]);

    const rows = data?.myRequestFlows || [];

    // ما ينتظر الفريق نفسه — وهو أول ما يُفتح، لأنه العمل لا الخبر. وإعارةٌ
    // قدّمها الفريق المُعير يتابعها ولا يسدّدها، فليست من عمله.
    const mine = useMemo(
        () => rows.filter((row: any) => !row.done && row.actor === "team" && row.side === "team"),
        [rows]
    );

    const shown = useMemo(() => {
        if (filter === "mine") return mine;
        if (filter === "club") return rows.filter((row: any) => !row.done && row.actor === "club");
        if (filter === "done") return rows.filter((row: any) => row.done);
        return rows;
    }, [rows, mine, filter]);

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>تتبّع الطلبات</title></Head>
            <Container size="lg" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Route size={22} />
                            <Title order={3} color="gray.8">تتبّع الطلبات</Title>
                            {mine.length > 0 && (
                                <Badge color="orange" variant="filled" size="lg">
                                    {mine.length} بانتظارك
                                </Badge>
                            )}
                        </Group>
                        <Text size="sm" color="gray.6">
                            كل طلب قدّمته: أين يقف، ودور مَن الآن، وما بقي عليه — وتُسدَّد رسومه من الطلب نفسه.
                        </Text>
                    </Box>
                    <SegmentedControl
                        value={filter}
                        onChange={setFilter}
                        data={[
                            { label: "بانتظارك", value: "mine" },
                            { label: "عند النادي", value: "club" },
                            { label: "منتهية", value: "done" },
                            { label: "الكل", value: "all" },
                        ]}
                    />
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={shown.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل الطلبات"
                    emptyLabel={filter === "mine" ? "لا شيء ينتظرك" : "لا توجد طلبات"}
                >
                    <Stack spacing="sm">
                        {shown.map((row: any) => (
                            <Paper key={row.id} p="md" radius="md" withBorder>
                                <Group position="apart" align="flex-start" noWrap>
                                    <Box sx={{ flex: 1 }}>
                                        <Group spacing={8} mb={4}>
                                            <Badge variant="light">{row.request_label}</Badge>
                                            {row.subject && (
                                                <Text weight={600} color="gray.8">{row.subject}</Text>
                                            )}
                                            <Badge color={STAGE_COLOR[row.stage] || "gray"} variant="light">
                                                {row.label}
                                            </Badge>
                                        </Group>
                                        {row.also && (
                                            <Text size="xs" color="gray.6">{row.also}</Text>
                                        )}
                                        {row.reason && (
                                            // السبب هو ما كان الفريق يُحرم منه، فيُعرض في السطر لا في الدرج وحده.
                                            // وسبب الإعفاء خبرٌ لا رفض، فلا يُكتب بلون الرفض.
                                            <Text size="sm" color={row.fee_waived ? "teal.8" : "red.7"} mt={4}>
                                                {row.fee_waived ? "سبب الإعفاء" : "السبب"}: {row.reason}
                                            </Text>
                                        )}
                                        {row.payment && (
                                            <Group spacing={6} mt={4}>
                                                <Coin size={14} />
                                                <Text size="sm" color="gray.7">
                                                    رسوم {row.payment.label}:{" "}
                                                    {Number(row.payment.amount).toLocaleString("en-US")} ر.ع
                                                </Text>
                                            </Group>
                                        )}
                                        <Text size="xs" color="gray.6" mt={4}>
                                            قُدِّم في {row.createdAt || "—"}
                                        </Text>
                                    </Box>

                                    <Stack spacing={6} align="flex-end">
                                        <Button size="xs" variant="light" onClick={() => setTarget(row)}>
                                            تتبّع الطلب
                                        </Button>
                                        {row.stage === "awaiting_payment" && row.side === "team"
                                            && row.payment?.status === "waiting" && (
                                            // السداد يُسجَّل بالإيصال، والإيصال يُرفع في خطّ الطلب نفسه.
                                            <Button
                                                size="xs"
                                                leftIcon={<Coin size={14} />}
                                                onClick={() => setTarget(row)}
                                            >
                                                سدّد الرسوم
                                            </Button>
                                        )}
                                    </Stack>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </DataState>
            </Container>

            <RequestTrackDrawer
                opened={Boolean(target)}
                onClose={() => setTarget(null)}
                target={target ? { entity_type: target.entity_type, entity_id: target.entity_id } : null}
                onActed={(message) => { if (message) notyf().success(message); refresh(); }}
                onError={(message) => notyf().error(message)}
            />
        </Box>
    );
}
