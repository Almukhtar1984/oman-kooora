import {
    Alert, Badge, Box, Button, Divider, Drawer, Group, Loader,
    Paper, Stack, Text, Textarea, Timeline,
} from "@mantine/core";
import { AlertCircle, Check, Clock, X } from "tabler-icons-react";
import React, { useEffect, useState } from "react";

import { useAdvanceRequestFlow, useRequestFlow, useRequestFlowStages } from "../../graphql";
import { remainingRoad, SIDE_PANEL_KINDS, turnText } from "../../lib/helpers/requestFlow";
import { SidePanel } from "./SidePanel";

// تتبّع الطلب — الخط الذي يُقرأ، لا الشارة التي تمحو ما قبلها.
//
// شحنةٌ تُتتبّع تقول: خرجت، وصلت المستودع، في الطريق إليك. وطلب الفريق كان
// يقول كلمة واحدة: «بانتظار النادي» — فلا يدري الفريق أدخلت الورقة عين أحد
// أم لا. هنا: ما مرّ بتواريخه، وأين يقف، وما بقي، ومن عليه الدور.
//
// والرسوم في الدرج نفسه لا في صفحة أخرى — «ليش ما سوّيت المدفوعات في نفس
// مسار الطلب؟» (العميل): النادي يطالب أو يُعفي، والفريق يرفع إيصاله، والنادي
// يرى الإيصال بجانب زرّ الاعتماد. ذلك في SidePanel، وهو وحده ما يختلف بين
// لوحة النادي ولوحة الفريق؛ وهذا الملف نفسه في اللوحتين.
//
// ويُبنى الإجراء من `actions` التي يرسلها الخادم: فلا يُعرض زرّ يُرفض ضغطه.

const ACTOR_LABEL: Record<string, string> = {
    team: "الفريق",
    club: "النادي",
    system: "النظام",
};

const CLOSING = ["rejected_initial", "rejected_final", "cancelled"];

const isRefusal = (stage: string) => CLOSING.includes(stage);

type Target = { entity_type: string; entity_id: string } | null;

interface Props {
    opened: boolean;
    onClose: () => void;
    target: Target;
    onActed?: (message?: string) => void;
    onError?: (message: string) => void;
}

export function RequestTrackDrawer({ opened, onClose, target, onActed, onError }: Props) {
    const [pending, setPending] = useState<any>(null);
    const [reason, setReason] = useState("");

    const [getFlow, { data, loading }] = useRequestFlow();
    const { data: stagesData } = useRequestFlowStages();
    const [advance, { loading: advancing }] = useAdvanceRequestFlow();

    const flow = data?.requestFlow;
    const events = flow?.events || [];
    // ما يخصّ الرسوم وسلسلة الناديين يُقرَّر في لوحته، والباقي هنا.
    const actions = (flow?.actions || []).filter((action: any) => !SIDE_PANEL_KINDS.includes(action.kind));
    const stages = stagesData?.requestFlowStages || [];
    const labelOf = (stage: string) =>
        stages.find((item: any) => item.stage === stage)?.label || stage;

    const load = () => {
        if (target) {
            getFlow({
                variables: { entity_type: target.entity_type, entity_id: target.entity_id },
                fetchPolicy: "network-only",
            });
        }
    };

    useEffect(() => {
        if (opened && target) load();
        if (!opened) { setPending(null); setReason(""); }
    }, [opened, target?.entity_type, target?.entity_id]);

    const acted = (message?: string) => {
        setPending(null);
        setReason("");
        load();
        onActed?.(message);
    };

    const act = (action: any, note: string) => {
        advance({
            variables: { id: flow.id, to: action.to, reason: note.trim() || null },
            onCompleted: ({ advanceRequestFlow: result }: any) => {
                if (!result?.ok) {
                    // الخادم يقول سببه بلغة تُعرض — فتُعرض كما هي.
                    onError?.(result?.message || "تعذّر تنفيذ الإجراء");
                    return;
                }
                acted(result?.message);
            },
            onError: (error: any) => onError?.(error?.message || "تعذّر تنفيذ الإجراء"),
        });
    };

    const onAction = (action: any) => {
        // الرفض لا يمرّ بلا سبب، والإلغاء لا يمرّ بضغطة واحدة: هو إغلاق الطلب.
        if (action.needsReason || action.to === "cancelled") {
            setPending(action);
            setReason("");
            return;
        }
        act(action, "");
    };

    const remaining = remainingRoad(flow);
    const turn = turnText(flow);

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="lg"
            title="تتبّع الطلب"
            styles={{ header: { direction: "rtl" }, title: { fontWeight: 600 } }}
        >
            {loading && !flow ? (
                <Group position="center" py="xl"><Loader size="sm" /></Group>
            ) : !flow ? (
                <Alert icon={<AlertCircle size={16} />} color="gray" variant="light">
                    لا يوجد خطّ تتبّع لهذا الطلب — الطلبات المقدَّمة قبل تشغيل التتبّع تظهر بحالتها وحدها.
                </Alert>
            ) : (
                <Stack spacing="md" pb="xl">
                    <Box>
                        <Group spacing={8}>
                            <Badge variant="light">{flow.request_label}</Badge>
                            {flow.subject && <Text weight={600} color="gray.8">{flow.subject}</Text>}
                        </Group>
                        <Text size="xs" color="gray.6" mt={4}>قُدِّم في {flow.createdAt || "—"}</Text>
                    </Box>

                    <Paper
                        withBorder radius="md" p="md"
                        bg={isRefusal(flow.stage) ? "red.0" : flow.done ? "teal.0" : flow.actor === "team" ? "orange.0" : "blue.0"}
                    >
                        <Text size="xs" color="gray.6">الحالة الآن</Text>
                        <Text weight={700} color="gray.8">{flow.label}</Text>
                        {flow.also && !flow.fee_waived && <Text size="sm" color="gray.6">{flow.also}</Text>}
                        {flow.reason && isRefusal(flow.stage) && (
                            <Text size="sm" color="red.7" mt={6}>السبب: {flow.reason}</Text>
                        )}
                        {turn && <Text size="xs" color="gray.7" mt={6}>{turn}</Text>}
                    </Paper>

                    <SidePanel flow={flow} onActed={acted} onError={(message) => onError?.(message)} />

                    <Divider label="الخط" labelPosition="center" />

                    <Timeline active={events.length - 1} bulletSize={22} lineWidth={2}>
                        {events.map((event: any) => (
                            <Timeline.Item
                                key={event.id}
                                color={isRefusal(event.stage) ? "red" : "blue"}
                                bullet={isRefusal(event.stage) ? <X size={12} /> : <Check size={12} />}
                                title={<Text size="sm" weight={600}>{event.label}</Text>}
                            >
                                {event.note && (
                                    <Text size="sm" color={isRefusal(event.stage) ? "red.7" : "gray.7"}>
                                        {event.note}
                                    </Text>
                                )}
                                <Text size="xs" color="gray.6" mt={2}>
                                    {event.createdAt} — {ACTOR_LABEL[event.actor] || event.actor}
                                </Text>
                            </Timeline.Item>
                        ))}

                        {remaining.map((stage: string) => (
                            <Timeline.Item
                                key={`next-${stage}`}
                                color="gray"
                                bullet={<Clock size={12} />}
                                title={<Text size="sm" color="gray.6">{labelOf(stage)}</Text>}
                            />
                        ))}
                    </Timeline>

                    {actions.length > 0 && (
                        <>
                            <Divider label="الإجراء" labelPosition="center" />
                            {pending ? (
                                <Stack spacing="xs">
                                    <Textarea
                                        label={pending.needsReason ? "سبب القرار" : "سبب الإلغاء (اختياري)"}
                                        description={pending.needsReason
                                            ? "يُعرض للطرف الآخر مع القرار — وبه يعرف ما يصحّحه"
                                            : "يُسجَّل في خطّ الطلب"}
                                        placeholder="اكتب السبب"
                                        value={reason}
                                        minRows={2}
                                        withAsterisk={pending.needsReason}
                                        onChange={(event) => setReason(event.currentTarget.value)}
                                    />
                                    <Group position="right" spacing="xs">
                                        <Button variant="outline" onClick={() => setPending(null)}>رجوع</Button>
                                        <Button
                                            color="red"
                                            loading={advancing}
                                            disabled={pending.needsReason && !reason.trim()}
                                            onClick={() => act(pending, reason)}
                                        >
                                            تأكيد {pending.label}
                                        </Button>
                                    </Group>
                                </Stack>
                            ) : (
                                <Group spacing="xs">
                                    {actions.map((action: any) => (
                                        <Button
                                            key={action.to}
                                            size="xs"
                                            loading={advancing}
                                            color={isRefusal(action.to)
                                                ? "red"
                                                : action.to === "approved" ? "teal" : "blue"}
                                            variant={action.to === "cancelled" ? "outline" : "filled"}
                                            onClick={() => onAction(action)}
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </Group>
                            )}
                        </>
                    )}
                </Stack>
            )}
        </Drawer>
    );
}
