import {
    Affix, Badge, Box, Button, Checkbox, Chip, Container, Group, Modal, Paper, SegmentedControl, Select, Stack, Text,
    Textarea, Title,
} from "@mantine/core";
import { Coin, Route } from "tabler-icons-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import { useAdvanceRequestFlow, useMyRequestFlows } from "../graphql";
import DataState from "../components/Loading/DataState";
import { RequestTrackDrawer } from "../components/RequestTrack";
import { AWAITING_PAYMENT, APPROVED, PAID_REVIEW, WAIVER_SUGGESTIONS, bulkMoves } from "../lib/helpers/requestFlow";

// مسار الطلبات — لوحة النادي على الطريق الواحد.
//
// أربعة طلبات كان لكل واحد منها شاشته وحالاته: تسجيل اللاعبين، الانتقالات،
// الإعارات، إخلاء الطرف. والمالك وصف طريقاً واحداً تسلكه الأربعة — مراجعة
// مبدئية، فاستكمال إجراءات، فمطالبة بالرسوم، فاعتماد نهائي — فهذه هي اللوحة
// التي يُمشى الطريق منها، وتُبنى أزرارها من صلاحية الخادم لا من تخمين الواجهة.
//
// وفي موسم المسابقات — أو حين يُستورد ملف Excel بخمسين لاعباً — تصل الطلبات
// بالعشرات وقرارها واحد: تُختار معاً، فيُطالَب فريقها بالسعر المعلن أو تُعفى
// بسبب واحد، وما سُدّد منها يُعتمد بضغطة. وكل طلب يمضي بقراره هو على الطريق،
// والخادم يردّ ما لا يجوز منها.

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
    { value: "team_registration", label: "تسجيل فريق" },
    { value: "member_registration", label: "تسجيل عضو جديد" },
];

const count = (n: number) => `${n} ${n === 1 ? "طلب" : "طلبات"}`;

export default function Tracking() {
    const [filter, setFilter] = useState("mine");
    const router = useRouter();
    const [type, setType] = useState<string | null>(null);
    const [target, setTarget] = useState<any>(null);
    const [picked, setPicked] = useState<string[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [waiving, setWaiving] = useState(false);
    const [reason, setReason] = useState("");

    const [getFlows, { data, loading }] = useMyRequestFlows();
    const [advance] = useAdvanceRequestFlow();

    // «الطلبات» تفتح على نوع طلبها.
    useEffect(() => {
        if (typeof router.query.type === "string") setType(router.query.type);
    }, [router.query.type]);

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

    const selectable = useMemo(() => shown.filter((row: any) => {
        const moves = bulkMoves(row);
        return moves.approve || moves.bill || moves.waive;
    }), [shown]);
    const allPicked = selectable.length > 0 && selectable.every((row: any) => picked.includes(row.id));

    // ما يجوز في المحدّد من كل قرار — قد يجتمع فيه ما سُدّد وما لم يُطالَب به بعد.
    const chosen = useMemo(() => {
        const rowsPicked = rows.filter((row: any) => picked.includes(row.id));
        const by = (move: "approve" | "bill" | "waive") => rowsPicked.filter((row: any) => bulkMoves(row)[move]);
        return { approve: by("approve"), bill: by("bill"), waive: by("waive") };
    }, [rows, picked]);
    const unpriced = chosen.waive.length - chosen.bill.length;

    // كل طلب يمضي بقراره هو على الطريق — والخادم يردّ ما لا يجوز منها بسببه.
    const runBulk = async (key: string, list: any[], variablesFor: (row: any) => any, success: (n: number) => string) => {
        setBusy(key);
        let done = 0;
        const failed: string[] = [];
        for (let index = 0; index < list.length; index += 1) {
            const row = list[index];
            try {
                // العدّاد يُقرأ مرة بعد آخر قرار، لا خمسين مرة.
                const last = index === list.length - 1;
                const { data: result } = await advance({
                    variables: variablesFor(row),
                    refetchQueries: last ? ["ClubPendingRequests"] : [],
                });
                if (result?.advanceRequestFlow?.ok) done += 1;
                else failed.push(result?.advanceRequestFlow?.message || "تعذّر");
            } catch (error: any) {
                failed.push(error?.message || "تعذّر");
            }
        }
        setBusy(null);
        setPicked([]);
        if (done) notyf().success(success(done));
        if (failed.length) notyf().error(`تعذّر ${failed.length}: ${Array.from(new Set(failed)).join("، ")}`);
        refresh();
    };

    const approvePicked = () => runBulk("approve", chosen.approve,
        (row) => ({ id: row.id, to: APPROVED }),
        (n) => `اعتُمد ${count(n)} نهائياً`);

    const billPicked = () => runBulk("bill", chosen.bill,
        (row) => ({ id: row.id, to: AWAITING_PAYMENT, amount: Number(row.suggestedAmount) }),
        (n) => `طُولبت الفرق برسوم ${count(n)} — بالسعر المعلن`);

    const waivePicked = async () => {
        const text = reason.trim();
        setWaiving(false);
        setReason("");
        await runBulk("waive", chosen.waive,
            (row) => ({ id: row.id, to: PAID_REVIEW, reason: text }),
            (n) => `أُعفي ${count(n)} من الرسوم — بانتظار اعتمادك النهائي`);
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>مسار الطلبات</title></Head>
            {/* شريط القرار الجماعي ثابتٌ أسفل الشاشة، فلا يغطّي آخر طلب في القائمة. */}
            <Container size="lg" pt="lg" pb={picked.length > 0 ? 140 : "lg"}>
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
                        {selectable.length > 1 && (
                            <Checkbox
                                label={`تحديد كل ما يقبل قراراً جماعياً (${selectable.length})`}
                                checked={allPicked}
                                indeterminate={!allPicked && picked.length > 0}
                                onChange={() => setPicked(allPicked ? [] : selectable.map((row: any) => row.id))}
                            />
                        )}
                        {shown.map((row: any) => (
                            <Paper key={row.id} p="md" radius="md" withBorder>
                                <Group position="apart" align="flex-start" noWrap>
                                    {selectable.includes(row) && (
                                        <Checkbox
                                            mt={4}
                                            checked={picked.includes(row.id)}
                                            onChange={() => toggle(row.id)}
                                            aria-label={`اختيار ${row.subject || row.request_label}`}
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

            <Modal
                opened={waiving}
                onClose={() => setWaiving(false)}
                title={`إعفاء ${count(chosen.waive.length)} من الرسوم`}
                centered
            >
                <Stack spacing="xs">
                    <Chip.Group value={reason} onChange={(value) => setReason(String(value))}>
                        <Group spacing={6}>
                            {WAIVER_SUGGESTIONS.map((suggestion) => (
                                <Chip key={suggestion} value={suggestion} size="xs">{suggestion}</Chip>
                            ))}
                        </Group>
                    </Chip.Group>
                    <Textarea
                        label="سبب الإعفاء"
                        description="سببٌ واحد يُكتب في خطّ كل طلب منها، ويراه فريقه"
                        placeholder="مثل: إعارة مجانية"
                        minRows={2}
                        autosize
                        value={reason}
                        onChange={(event) => setReason(event.currentTarget.value)}
                        withAsterisk
                    />
                    <Group spacing="xs" mt="xs">
                        <Button color="teal" disabled={!reason.trim()} onClick={waivePicked}>تأكيد الإعفاء</Button>
                        <Button variant="subtle" color="gray" onClick={() => setWaiving(false)}>رجوع</Button>
                    </Group>
                </Stack>
            </Modal>

            {picked.length > 0 && (
                <Affix position={{ bottom: 24, left: 24 }}>
                    <Paper shadow="md" radius="md" p="sm" withBorder maw="calc(100vw - 48px)">
                        <Group spacing="sm">
                            <Text size="sm" weight={600}>{picked.length} محدّدة</Text>
                            {chosen.approve.length > 0 && (
                                <Button color="teal" loading={busy === "approve"} disabled={Boolean(busy)} onClick={approvePicked}>
                                    اعتماد نهائي ({chosen.approve.length})
                                </Button>
                            )}
                            {chosen.bill.length > 0 && (
                                <Button loading={busy === "bill"} disabled={Boolean(busy)} onClick={billPicked}>
                                    مطالبة بالسعر المعلن ({chosen.bill.length})
                                </Button>
                            )}
                            {chosen.waive.length > 0 && (
                                <Button
                                    variant="light"
                                    color="teal"
                                    loading={busy === "waive"}
                                    disabled={Boolean(busy)}
                                    onClick={() => setWaiving(true)}
                                >
                                    إعفاء من الرسوم ({chosen.waive.length})
                                </Button>
                            )}
                            <Button variant="subtle" color="gray" onClick={() => setPicked([])}>إلغاء التحديد</Button>
                        </Group>
                        {unpriced > 0 && (
                            <Text size="xs" color="gray.6" mt={6}>
                                {count(unpriced)} بلا سعر معلن في قائمة أسعار ناديك — يُطالَب بها من مسارها بمبلغها، أو تُعفى.
                            </Text>
                        )}
                    </Paper>
                </Affix>
            )}
        </Box>
    );
}
