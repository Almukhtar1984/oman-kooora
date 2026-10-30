import { Alert, Anchor, Badge, Button, FileInput, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { AlertCircle, Coin, FileText, Receipt } from "tabler-icons-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { useSubmitPaymentReceipt } from "../../graphql";
import { getImageUrl } from "../../lib/helpers/image";

// لوحة الفريق في درج التتبّع: السداد حيث يُرى الطلب.
//
// كان الفريق يقرأ «بانتظار سداد الرسوم» ثم يذهب إلى صفحة أخرى ليبحث عن
// مطالبته — «ليش ما سوّيت المدفوعات في نفس مسار الطلب؟» (العميل). هنا يرى
// المبلغ ويرفع إيصاله ورقمه، فيتحرّك الطلب إلى مراجعة النادي.

const money = (value: any) => `${Number(value || 0).toLocaleString("en-US")} ر.ع`;

interface Props {
    flow: any;
    onActed: (message?: string) => void;
    onError: (message: string) => void;
}

export function SidePanel({ flow, onActed, onError }: Props) {
    if (flow?.fee_waived) {
        return (
            <Paper withBorder radius="md" p="md" bg="teal.0">
                <Group spacing={8}>
                    <Coin size={18} />
                    <Text weight={600} color="gray.8">أعفاك النادي من رسوم هذا الطلب</Text>
                </Group>
                {flow.reason && <Text size="sm" color="gray.7" mt={4}>السبب: {flow.reason}</Text>}
            </Paper>
        );
    }
    if (!flow?.payment) return null;
    if (flow.side === "team" && flow.stage === "awaiting_payment" && flow.payment.status === "waiting") {
        return <PayForm flow={flow} onActed={onActed} onError={onError} />;
    }
    return <PaymentState payment={flow.payment} />;
}

function PayForm({ flow, onActed, onError }: Props) {
    const payment = flow.payment;
    const [reference, setReference] = useState("");
    const [receipt, setReceipt] = useState<File | null>(null);
    const [submit, { loading }] = useSubmitPaymentReceipt();

    useEffect(() => { setReference(""); setReceipt(null); }, [payment?.id]);

    const send = () => submit({
        variables: { id: payment.id, reference_number: reference.trim(), receipt },
        onCompleted: () => onActed("رُفع الإيصال — الطلب بانتظار مراجعة النادي"),
        onError: (error: any) => onError(error?.message || "تعذّر رفع الإيصال"),
    });

    return (
        <Paper withBorder radius="md" p="md" sx={(theme) => ({ borderColor: theme.colors.orange[3] })}>
            <Group position="apart" mb="xs">
                <Group spacing={8}>
                    <Coin size={18} />
                    <Text weight={700} color="gray.8">سداد رسوم {payment.label}</Text>
                </Group>
                <Badge color="orange" variant="filled" size="lg">{money(payment.amount)}</Badge>
            </Group>
            {payment.decision_note && (
                <Alert icon={<AlertCircle size={16} />} color="red" variant="light" mb="sm">
                    ردّ النادي الإيصال السابق: {payment.decision_note}
                </Alert>
            )}
            <Text size="sm" color="gray.6" mb="sm">
                حوّل المبلغ كاملاً إلى النادي، ثم ارفع صورة الإيصال ورقم التحويل — بهما يطابق النادي ما وصله.
            </Text>
            <Stack spacing="xs">
                <TextInput
                    label="الرقم المرجعي للتحويل"
                    placeholder="الرقم الذي يظهر في إشعار التحويل"
                    value={reference}
                    onChange={(event) => setReference(event.currentTarget.value)}
                    withAsterisk
                />
                <FileInput
                    label="صورة الإيصال"
                    description="صورة (JPG / PNG) أو ملف PDF"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    value={receipt}
                    onChange={setReceipt}
                    withAsterisk
                />
                <Group position="apart" align="center">
                    <Button loading={loading} disabled={!reference.trim() || !receipt} onClick={send}>
                        رفع الإيصال
                    </Button>
                    <Text size="xs" color="gray.6">
                        عليك أكثر من مطالبة؟{" "}
                        <Link href="/payments" passHref legacyBehavior><Anchor size="xs">سدّدها بإيصال واحد</Anchor></Link>
                    </Text>
                </Group>
            </Stack>
        </Paper>
    );
}

const PAYMENT_LABEL: Record<string, string> = {
    waiting: "مطلوب السداد",
    submitted: "الإيصال بانتظار مراجعة النادي",
    accepted: "مسدّد ومعتمد",
    rejected: "مرفوض",
};
const PAYMENT_COLOR: Record<string, string> = { waiting: "orange", submitted: "blue", accepted: "teal", rejected: "red" };

function PaymentState({ payment }: { payment: any }) {
    return (
        <Paper withBorder radius="md" p="md">
            <Group position="apart" mb={4}>
                <Group spacing={8}>
                    <Receipt size={18} />
                    <Text weight={600} color="gray.8">رسوم {payment.label}: {money(payment.amount)}</Text>
                </Group>
                <Badge color={PAYMENT_COLOR[payment.status] || "gray"} variant="light">
                    {PAYMENT_LABEL[payment.status] || payment.status}
                </Badge>
            </Group>
            {payment.reference_number && (
                <Text size="sm" color="gray.7">الرقم المرجعي: <strong>{payment.reference_number}</strong></Text>
            )}
            {payment.receipt && (
                <Anchor href={getImageUrl(payment.receipt)} target="_blank" rel="noreferrer" size="sm">
                    <Group spacing={4} mt={4}><FileText size={14} /> الإيصال المرفوع</Group>
                </Anchor>
            )}
        </Paper>
    );
}
