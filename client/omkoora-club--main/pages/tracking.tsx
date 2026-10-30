import {
    Affix, Badge, Box, Button, Checkbox, Container, Group, Paper, SegmentedControl, Select, Stack, Text, Title,
} from "@mantine/core";
import { Coin, Route } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import { useAdvanceRequestFlow, useMyRequestFlows } from "../graphql";
import DataState from "../components/Loading/DataState";
import { RequestTrackDrawer } from "../components/RequestTrack";

// مسار الطلبات — لوحة النادي على الطريق الواحد.
//
// أربعة طلبات كان لكل واحد منها شاشته وحالاته: تسجيل اللاعبين، الانتقالات،
// الإعارات، إخلاء الطرف. والمالك وصف طريقاً واحداً تسلكه الأربعة — مراجعة
// مبدئية، فاستكمال إجراءات، فمطالبة بالرسوم، فاعتماد نهائي — فهذه هي اللوحة
// التي يُمشى الطريق منها، وتُبنى أزرارها من صلاحية الخادم لا من تخمين الواجهة.
//
// وفي موسم المسابقات تصل الطلبات بالعشرات وإيصالها واحد: ما بلغ «تم السداد»
// يُختار معاً ويُعتمد بضغطة.

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
    const [picked, setPicked] = useState<string[]>([]);
    const [approving, setApproving] = useState(false);

    const [getFlows, { data, loading }] = useMyRequestFlows();
    const [advance] = useAdvanceRequestFlow();

    const variables = type ? { request_type: type } : {};
    const refresh = () => getFlows({ variables, fetchPolicy: "network-only" });

    useEffect(() => {
        getFlows({ variables, fetchPolicy: "cache-and-network" });
    }, [type, getFlows]);

    const rows = data?.myRequestFlows || [];

    // ما ينتظر قرار النادي — وهو ما تُفتح عليه اللوحة: دوره على الطريق، أو دوره
    // في سلسلة الناديين لطلبٍ يخرج منه لاعبه.
    const mine = useMemo(
        () => rows.filter((row: any) => !row.done
            && ((row.side === "club" && row.actor === "club") || row.side === "chain")),
        [rows]
    );

    const approvable = (row: any) => (row.actions || []).some((action: any) => action.to === "approved");

    const shown = useMemo(() => {
        if (filter === "mine") return mine;
        if (filter === "team") return rows.filter((row: any) => !row.done && row.actor === "team");
        if (filter === "done") return rows.filter((row: any) => row.done);
        return rows;
    }, [rows, mine, filter]);

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    useEffect(() => { setPicked([]); }, [filter, type]);

    const toggle = (id: string) =>
        setPicked((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));

    // كل طلب يُعتمد بقراره هو على الطريق — والخادم يردّ ما لا يجوز منها بسببه.
    const approvePicked = async () => {
        setApproving(true);
        let done = 0;
        const failed: string[] = [];
        for (const id of picked) {
            try {
                const { data: result } = await advance({ variables: { id, to: "approved" } });
                if (result?.advanceRequestFlow?.ok) done += 1;
                else failed.push(result?.advanceRequestFlow?.message || "تعذّر");
            } catch (error: any) {
                failed.push(error?.message || "تعذّر");
            }
        }
        setApproving(false);
        setPicked([]);
        if (done) notyf().success(`اعتُمد ${done} ${done === 1 ? "طلب" : "طلبات"} نهائياً`);
        if (failed.length) notyf().error(`تعذّر ${failed.length}: ${Array.from(new Set(failed)).join("، ")}`);
        refresh();
    };

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
                            كل طلب في طريق واحد: قبول مبدئي، ثم الرسوم — مطالبة أو إعفاء — ثم الاعتماد النهائي.
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
                                    {approvable(row) && (
                                        <Checkbox
                                            mt={4}
                                            checked={picked.includes(row.id)}
                                            onChange={() => toggle(row.id)}
                                            aria-label={`اختيار ${row.subject || row.request_label} للاعتماد`}
                                        />
                                    )}
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
                                            // سبب الإعفاء خبرٌ لا رفض، فلا يُكتب بلون الرفض.
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
                onActed={(message) => { if (message) notyf().success(message); refresh(); }}
                onError={(message) => notyf().error(message)}
            />

            {picked.length > 0 && (
                <Affix position={{ bottom: 24, left: 24 }}>
                    <Paper shadow="md" radius="md" p="sm" withBorder>
                        <Group spacing="sm">
                            <Text size="sm" weight={600}>{picked.length} محدّدة — سُدّدت رسومها</Text>
                            <Button color="teal" loading={approving} onClick={approvePicked}>
                                اعتماد نهائي للمحدّد
                            </Button>
                            <Button variant="subtle" color="gray" onClick={() => setPicked([])}>إلغاء التحديد</Button>
                        </Group>
                    </Paper>
                </Affix>
            )}
        </Box>
    );
}
