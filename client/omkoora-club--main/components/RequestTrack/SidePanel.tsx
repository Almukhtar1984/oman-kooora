import {
    Anchor, Badge, Box, Button, Chip, Divider, Group, NumberInput, Paper, Select, Stack, Text, Textarea,
} from "@mantine/core";
import { Coin, FileText, Receipt } from "tabler-icons-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { useAdvanceRequestFlow, useAllTeams, useUpdateTransfer } from "../../graphql";
import { getImageUrl } from "../../lib/helpers/image";
import useStore from "../../store/useStore";

// لوحة النادي في درج التتبّع: الرسوم وقرار سلسلة الناديين، حيث يُرى الطلب.
//
// النادي بعد القبول المبدئي يطالب بمبلغ (يُقترح من سعره) أو يُعفي بسبب —
// «خليها خيارات» (العميل) — ولا ثالث: لا يُعتمد طلبٌ لغياب سعر. وبعد السداد
// يرى الإيصال ورقمه بجانب زرّ الاعتماد، ويردّه بسبب إن لم يُقبل.

const WAIVER_SUGGESTIONS = ["إعارة مجانية", "إعفاء بقرار النادي"];

const money = (value: any) => `${Number(value || 0).toLocaleString("en-US")} ر.ع`;

interface Props {
    flow: any;
    onActed: (message?: string) => void;
    onError: (message: string) => void;
}

export function SidePanel({ flow, onActed, onError }: Props) {
    const actions: any[] = flow?.actions || [];
    const has = (kind: string) => actions.find((action) => action.kind === kind);

    if (flow?.side === "chain") return <ChainDecision flow={flow} actions={actions} onActed={onActed} onError={onError} />;
    if (has("bill") || has("waive")) {
        return <FeeDecision flow={flow} bill={has("bill")} waive={has("waive")} onActed={onActed} onError={onError} />;
    }
    if (flow?.fee_waived) return <Waived flow={flow} />;
    if (flow?.payment) return <PaymentState flow={flow} returnAction={has("return_receipt")} onActed={onActed} onError={onError} />;
    return null;
}

/** بعد القبول المبدئي: مطالبة بمبلغ، أو إعفاء بسبب. */
function FeeDecision({ flow, bill, waive, onActed, onError }: any) {
    const [amount, setAmount] = useState<number | "">(flow?.suggestedAmount ?? "");
    const [waiving, setWaiving] = useState(false);
    const [reason, setReason] = useState("");
    const [advance, { loading }] = useAdvanceRequestFlow();

    useEffect(() => {
        setAmount(flow?.suggestedAmount ?? "");
        setWaiving(false);
        setReason("");
    }, [flow?.id, flow?.suggestedAmount]);

    const send = (to: string, extra: { amount?: number; reason?: string }) => advance({
        variables: { id: flow.id, to, reason: extra.reason ?? null, amount: extra.amount ?? null },
        onCompleted: ({ advanceRequestFlow: result }: any) => {
            if (!result?.ok) { onError(result?.message || "تعذّر تنفيذ الإجراء"); return; }
            onActed(result?.message);
        },
        onError: (error: any) => onError(error?.message || "تعذّر تنفيذ الإجراء"),
    });

    const priced = flow?.suggestedAmount != null;

    return (
        <Paper withBorder radius="md" p="md" sx={(theme) => ({ borderColor: theme.colors.blue[3] })}>
            <Group spacing={8} mb="xs">
                <Coin size={18} />
                <Text weight={700} color="gray.8">رسوم {flow.request_label}</Text>
            </Group>
            <Text size="sm" color="gray.6" mb="sm">
                قُبل الطلب مبدئياً — الخطوة التالية رسومه: طالِب الفريق بها، أو اعفِه منها بسبب يُكتب في الخط.
            </Text>

            {!waiving && bill && (
                <Stack spacing="xs">
                    <NumberInput
                        label="المبلغ المطلوب"
                        description={priced
                            ? `سعر ناديك لهذا النوع: ${money(flow.suggestedAmount)} — عدّله إن شئت`
                            : "لم تسعّر هذا النوع بعد — اكتب المبلغ، أو اضبط أسعارك من «أسعار الرسوم»"}
                        value={amount}
                        onChange={(value) => setAmount(value === undefined ? "" : value)}
                        min={0}
                        precision={2}
                        step={1}
                        rightSection={<Text size="xs" color="gray.6" pr={8}>ر.ع</Text>}
                        rightSectionWidth={40}
                    />
                    <Group spacing="xs">
                        <Button
                            loading={loading}
                            disabled={!(Number(amount) > 0)}
                            onClick={() => send("awaiting_payment", { amount: Number(amount) })}
                        >
                            {Number(amount) > 0 ? `مطالبة الفريق بـ ${money(amount)}` : "مطالبة الفريق بالرسوم"}
                        </Button>
                        {waive && (
                            <Button variant="subtle" color="gray" onClick={() => setWaiving(true)}>
                                إعفاء من الرسوم
                            </Button>
                        )}
                    </Group>
                </Stack>
            )}

            {waiving && (
                <Stack spacing="xs">
                    <Text size="sm" weight={600} color="gray.8">إعفاء من الرسوم</Text>
                    <Chip.Group value={reason} onChange={(value) => setReason(String(value))}>
                        <Group spacing={6}>
                            {WAIVER_SUGGESTIONS.map((suggestion) => (
                                <Chip key={suggestion} value={suggestion} size="xs">{suggestion}</Chip>
                            ))}
                        </Group>
                    </Chip.Group>
                    <Textarea
                        label="سبب الإعفاء"
                        description="يظهر في خطّ الطلب للطرفين"
                        placeholder="مثل: إعارة مجانية"
                        minRows={2}
                        autosize
                        value={reason}
                        onChange={(event) => setReason(event.currentTarget.value)}
                        withAsterisk
                    />
                    <Group spacing="xs">
                        <Button
                            color="teal"
                            loading={loading}
                            disabled={!reason.trim()}
                            onClick={() => send("paid_review", { reason: reason.trim() })}
                        >
                            تأكيد الإعفاء
                        </Button>
                        <Button variant="subtle" color="gray" onClick={() => setWaiving(false)}>رجوع</Button>
                    </Group>
                </Stack>
            )}
        </Paper>
    );
}

/** طلبٌ أعفاه النادي: يقول ذلك وسببه بدل خانة سداد فارغة. */
function Waived({ flow }: any) {
    const note = [...(flow?.events || [])].reverse()
        .find((event: any) => String(event.note || "").startsWith("أُعفي من الرسوم"))?.note;
    return (
        <Paper withBorder radius="md" p="md" bg="teal.0">
            <Group spacing={8}>
                <Coin size={18} />
                <Text weight={600} color="gray.8">أُعفي الطلب من الرسوم</Text>
            </Group>
            {note && <Text size="sm" color="gray.7" mt={4}>{note.replace(/^أُعفي من الرسوم:\s*/, "السبب: ")}</Text>}
        </Paper>
    );
}

const PAYMENT_LABEL: Record<string, string> = {
    waiting: "بانتظار سداد الفريق",
    submitted: "رفع الفريق إيصاله — راجعه ثم اعتمد الطلب",
    accepted: "مسدّد ومعتمد",
    rejected: "مرفوض",
};
const PAYMENT_COLOR: Record<string, string> = { waiting: "orange", submitted: "blue", accepted: "teal", rejected: "red" };

/** المطالبة القائمة: كم، وأين وصلت — والإيصال بجانب قرار الاعتماد. */
function PaymentState({ flow, returnAction, onActed, onError }: any) {
    const payment = flow.payment;
    const [returning, setReturning] = useState(false);
    const [reason, setReason] = useState("");
    const [advance, { loading }] = useAdvanceRequestFlow();

    useEffect(() => { setReturning(false); setReason(""); }, [flow?.id, payment?.status]);

    const sendBack = () => advance({
        variables: { id: flow.id, to: "awaiting_payment", reason: reason.trim() || null },
        onCompleted: ({ advanceRequestFlow: result }: any) => {
            if (!result?.ok) { onError(result?.message || "تعذّر ردّ الإيصال"); return; }
            onActed("رُدّ الإيصال — الفريق يرفع إيصالاً صحيحاً");
        },
        onError: (error: any) => onError(error?.message || "تعذّر ردّ الإيصال"),
    });

    return (
        <Paper withBorder radius="md" p="md">
            <Group position="apart" mb={6}>
                <Group spacing={8}>
                    <Receipt size={18} />
                    <Text weight={600} color="gray.8">رسوم {payment.label}: {money(payment.amount)}</Text>
                </Group>
                <Badge color={PAYMENT_COLOR[payment.status] || "gray"} variant="light">
                    {PAYMENT_LABEL[payment.status] || payment.status}
                </Badge>
            </Group>

            {payment.reference_number && (
                <Text size="sm" color="gray.7">
                    الرقم المرجعي: <strong>{payment.reference_number}</strong>
                    {payment.paid_at ? ` — بتاريخ ${payment.paid_at}` : ""}
                </Text>
            )}
            {payment.receipt && (
                <Anchor href={getImageUrl(payment.receipt)} target="_blank" rel="noreferrer" size="sm">
                    <Group spacing={4} mt={4}><FileText size={14} /> فتح صورة الإيصال</Group>
                </Anchor>
            )}
            {payment.decision_note && payment.status === "waiting" && (
                <Text size="sm" color="red.7" mt={4}>رُدّ الإيصال السابق: {payment.decision_note}</Text>
            )}

            {returnAction && !returning && (
                <Button mt="sm" size="xs" variant="outline" color="orange" onClick={() => setReturning(true)}>
                    ردّ الإيصال للسداد
                </Button>
            )}
            {returning && (
                <Stack spacing="xs" mt="sm">
                    <Textarea
                        label="سبب ردّ الإيصال"
                        description="يراه الفريق مع المطالبة فيرفع إيصالاً صحيحاً"
                        placeholder="مثل: المبلغ في الإيصال أقل من المطلوب"
                        minRows={2}
                        value={reason}
                        onChange={(event) => setReason(event.currentTarget.value)}
                        withAsterisk
                    />
                    <Group spacing="xs">
                        <Button color="orange" loading={loading} disabled={!reason.trim()} onClick={sendBack}>
                            تأكيد ردّ الإيصال
                        </Button>
                        <Button variant="subtle" color="gray" onClick={() => setReturning(false)}>رجوع</Button>
                    </Group>
                </Stack>
            )}
            <Text size="xs" color="gray.6" mt="sm">
                كل مدفوعات ناديك في <Link href="/payments" passHref legacyBehavior><Anchor size="xs">المدفوعات</Anchor></Link>.
            </Text>
        </Paper>
    );
}

/** دور النادي في سلسلة الناديين: موافقة (مع الفريق المستقبِل) أو رفض بسببه. */
function ChainDecision({ flow, actions, onActed, onError }: any) {
    const userData = useStore((state: any) => state.userData);
    const idClub = userData?.person?.clubManagement?.club?.id;
    const accept = actions.find((action: any) => action.kind === "transfer_accept");
    const reject = actions.find((action: any) => action.kind === "transfer_reject");

    const [mode, setMode] = useState<"accept" | "reject" | null>(null);
    const [team, setTeam] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const [getTeams, { data: teamsData }] = useAllTeams();
    const [updateTransfer, { loading }] = useUpdateTransfer();

    useEffect(() => {
        if (accept?.needsTeam && idClub) getTeams({ variables: { idClub }, fetchPolicy: "cache-first" });
    }, [accept?.needsTeam, idClub]);
    useEffect(() => { setMode(null); setTeam(null); setReason(""); }, [flow?.id]);

    const teams = (teamsData?.allTeam || []).map((item: any) => ({ value: item.id, label: item.name }));

    const decide = (status: "accepted" | "rejected") => updateTransfer({
        variables: {
            id: flow.entity_id,
            content: {
                status,
                ...(status === "accepted" && team ? { id_team_to: team } : {}),
                ...(status === "rejected" ? { note: reason.trim() } : {}),
            },
        },
        onCompleted: () => onActed(status === "accepted" ? "تمّت موافقة ناديك" : "رُفض الطلب"),
        onError: (error: any) => onError(error?.message || "تعذّر تنفيذ القرار"),
    });

    return (
        <Paper withBorder radius="md" p="md" sx={(theme) => ({ borderColor: theme.colors.blue[3] })}>
            <Text weight={700} color="gray.8">قرار ناديك</Text>
            <Text size="sm" color="gray.6" mb="sm">
                {flow.request_label} يمرّ بموافقة النادي المُرسِل ثم النادي المستقبِل، ثم برسومه واعتماده النهائي.
            </Text>

            {mode === null && (
                <Group spacing="xs">
                    {accept && <Button onClick={() => (accept.needsTeam ? setMode("accept") : decide("accepted"))} loading={loading}>{accept.label}</Button>}
                    {reject && <Button color="red" variant="outline" onClick={() => setMode("reject")}>{reject.label}</Button>}
                </Group>
            )}

            {mode === "accept" && (
                <Stack spacing="xs">
                    <Select
                        label="الفريق الذي سينضم إليه اللاعب في ناديك"
                        placeholder="اختر الفريق"
                        data={teams}
                        value={team}
                        onChange={setTeam}
                        searchable
                        nothingFound="لا توجد فرق"
                        withAsterisk
                    />
                    <Group spacing="xs">
                        <Button loading={loading} disabled={!team} onClick={() => decide("accepted")}>تأكيد الموافقة</Button>
                        <Button variant="subtle" color="gray" onClick={() => setMode(null)}>رجوع</Button>
                    </Group>
                </Stack>
            )}

            {mode === "reject" && (
                <Stack spacing="xs">
                    <Textarea
                        label="سبب الرفض"
                        description="يظهر في خطّ الطلب للطرفين"
                        minRows={2}
                        value={reason}
                        onChange={(event) => setReason(event.currentTarget.value)}
                        withAsterisk
                    />
                    <Group spacing="xs">
                        <Button color="red" loading={loading} disabled={!reason.trim()} onClick={() => decide("rejected")}>تأكيد الرفض</Button>
                        <Button variant="subtle" color="gray" onClick={() => setMode(null)}>رجوع</Button>
                    </Group>
                </Stack>
            )}
            <Divider my="sm" variant="dashed" />
            <Box><Text size="xs" color="gray.6">موافقة ناديك لا تنقل اللاعب: ينتقل عند الاعتماد النهائي بعد الرسوم.</Text></Box>
        </Paper>
    );
}
