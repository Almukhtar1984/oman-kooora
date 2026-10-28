import {
    Badge, Box, Button, Container, Group, Paper, SegmentedControl, Select, Stack, Text, Title,
} from "@mantine/core";
import { Coin, Route } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import { useMyRequestFlows } from "../graphql";
import DataState from "../components/Loading/DataState";
import { RequestTrackDrawer } from "../components/RequestTrack";

// مسار الطلبات — لوحة النادي على الطريق الواحد.
//
// أربعة طلبات كان لكل واحد منها شاشته وحالاته: تسجيل اللاعبين، الانتقالات،
// الإعارات، إخلاء الطرف. والمالك وصف طريقاً واحداً تسلكه الأربعة — مراجعة
// مبدئية، فاستكمال إجراءات، فمطالبة بالرسوم، فاعتماد نهائي — فهذه هي اللوحة
// التي يُمشى الطريق منها، وتُبنى أزرارها من صلاحية الخادم لا من تخمين الواجهة.

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

const TYPES = [
    { value: "player_registration", label: "تسجيل لاعب جديد" },
    { value: "transfer", label: "انتقال لاعب" },
    { value: "loan", label: "إعارة لاعب" },
    { value: "player_release", label: "استقالة لاعب" },
];

export default function Tracking() {
    const [filter, setFilter] = useState("mine");
    const [type, setType] = useState<string | null>(null);
    const [target, setTarget] = useState<any>(null);

    const [getFlows, { data, loading }] = useMyRequestFlows();

    const variables = type ? { request_type: type } : {};
    const refresh = () => getFlows({ variables, fetchPolicy: "network-only" });

    useEffect(() => {
        getFlows({ variables, fetchPolicy: "cache-and-network" });
    }, [type, getFlows]);

    const rows = data?.myRequestFlows || [];

    // ما ينتظر قرار النادي — وهو ما تُفتح عليه اللوحة.
    const mine = useMemo(
        () => rows.filter((row: any) => !row.done && row.actor === "club"),
        [rows]
    );

    const shown = useMemo(() => {
        if (filter === "mine") return mine;
        if (filter === "team") return rows.filter((row: any) => !row.done && row.actor === "team");
        if (filter === "done") return rows.filter((row: any) => row.done);
        return rows;
    }, [rows, mine, filter]);

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>مسار الطلبات</title></Head>
            <Container size="lg" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Route size={22} />
                            <Title order={3} color="gray.8">مسار الطلبات</Title>
                            {mine.length > 0 && (
                                <Badge color="red" variant="filled" size="lg">
                                    {mine.length} بانتظار قرارك
                                </Badge>
                            )}
                        </Group>
                        <Text size="sm" color="gray.6">
                            طلبات الفرق الأربعة في طريق واحد — اقبل مبدئياً، أو ارفض بسببه، أو طالب بالرسوم، أو اعتمد نهائياً.
                        </Text>
                    </Box>
                    <Group spacing="xs" align="flex-end">
                        <Select
                            placeholder="كل الأنواع"
                            value={type}
                            onChange={setType}
                            data={TYPES}
                            clearable
                            w={170}
                        />
                        <SegmentedControl
                            value={filter}
                            onChange={setFilter}
                            data={[
                                { label: "بانتظار قرارك", value: "mine" },
                                { label: "عند الفريق", value: "team" },
                                { label: "منتهية", value: "done" },
                                { label: "الكل", value: "all" },
                            ]}
                        />
                    </Group>
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={shown.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل الطلبات"
                    emptyLabel={filter === "mine" ? "لا طلب ينتظر قرارك" : "لا توجد طلبات"}
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
                                        {row.also && <Text size="xs" color="gray.6">{row.also}</Text>}
                                        {row.reason && (
                                            <Text size="sm" color="red.7" mt={4}>السبب: {row.reason}</Text>
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

                                    <Button size="xs" variant="light" onClick={() => setTarget(row)}>
                                        فتح المسار
                                    </Button>
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
                side="club"
                onActed={refresh}
                onError={(message) => notyf().error(message)}
            />
        </Box>
    );
}
