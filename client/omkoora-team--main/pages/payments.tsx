import {
    Affix, Alert, Anchor, Badge, Box, Button, Checkbox, Container, FileInput, Group, Paper,
    SegmentedControl, Stack, Text, TextInput, Title,
} from "@mantine/core";
import { AlertCircle, Coin, FileText, Upload } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import { useRequestPayments, useSubmitPaymentReceipt, useSubmitPaymentsReceipt } from "../graphql";
import { getImageUrl } from "../lib/helpers/image";
import DataState from "../components/Loading/DataState";
import Modal from "../components/Modal/Modal";

// المدفوعات: ما يطالب به النادي، ودليل أن الفريق دفعه.
//
// الدفع كامل لا مجزّأ، والإيصال صورة مع الرقم المرجعي للتحويل — بهما يعرف
// النادي أيّ طلب سُدّد، فلا يختلط مبلغ بمبلغ.
//
// وفي موسم المسابقات يسدّد الفريق عدّة طلبات بتحويلٍ واحد — «يرسل مية ريال مرة
// واحدة… النادي ما يعرف هذا مال مين» (العميل). فتُختار المطالبات ويُرفع عليها
// إيصالٌ واحد: كل مطالبة تحمله باسم لاعبها، فيعرف النادي ما سدّده كل جزء.

const STATUS_LABEL: Record<string, string> = {
    waiting: "مطلوب الدفع",
    submitted: "بانتظار اعتماد النادي",
    accepted: "معتمد",
    rejected: "مرفوض",
};

const STATUS_COLOR: Record<string, string> = {
    waiting: "orange",
    submitted: "blue",
    accepted: "teal",
    rejected: "red",
};

export default function Payments() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [paying, setPaying] = useState<any>(null);
    const [picked, setPicked] = useState<string[]>([]);
    const [batchOpen, setBatchOpen] = useState(false);
    const [reference, setReference] = useState("");
    const [receipt, setReceipt] = useState<File | null>(null);

    const [getPayments, { data, loading }] = useRequestPayments();
    const [submitReceipt, { loading: submitting }] = useSubmitPaymentReceipt();
    const [submitBatch, { loading: submittingBatch }] = useSubmitPaymentsReceipt();

    const variables = statusFilter === "all" ? {} : { status: statusFilter };

    useEffect(() => {
        getPayments({ variables, fetchPolicy: "cache-and-network" });
    }, [statusFilter, getPayments]);

    const rows = data?.requestPayments || [];

    // ما على الفريق الآن — مجموع ما لم يُدفع بعد.
    const due = useMemo(() => rows
        .filter((row: any) => row.status === "waiting")
        .reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0), [rows]);

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });
    const refresh = () => getPayments({ variables, fetchPolicy: "network-only" });

    useEffect(() => { setPicked([]); }, [statusFilter]);
    const toggle = (id: string) =>
        setPicked((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
    const pickedRows = rows.filter((row: any) => picked.includes(row.id));
    const pickedTotal = pickedRows.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);

    const onSubmitBatch = () => {
        if (!reference.trim()) { notyf().error("أدخل الرقم المرجعي للتحويل"); return; }
        if (!receipt) { notyf().error("أرفق صورة الإيصال"); return; }

        submitBatch({
            variables: { ids: picked, reference_number: reference.trim(), receipt, amount: pickedTotal },
            onCompleted: (res: any) => {
                notyf().success(res?.submitPaymentsReceipt?.message || "تم رفع الإيصال — بانتظار اعتماد النادي");
                setBatchOpen(false); setPicked([]); setReference(""); setReceipt(null);
                refresh();
            },
            onError: (error) => notyf().error(error?.message || "تعذّر رفع الإيصال"),
        });
    };

    const onSubmit = () => {
        if (!reference.trim()) { notyf().error("أدخل الرقم المرجعي للتحويل"); return; }
        if (!receipt) { notyf().error("أرفق صورة الإيصال"); return; }

        submitReceipt({
            variables: { id: paying.id, reference_number: reference.trim(), receipt },
            onCompleted: () => {
                notyf().success("تم رفع الإيصال — بانتظار اعتماد النادي");
                setPaying(null); setReference(""); setReceipt(null);
                refresh();
            },
            onError: (error) => notyf().error(error?.message || "تعذّر رفع الإيصال"),
        });
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>المدفوعات</title></Head>
            <Container size="lg" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Coin size={22} />
                            <Title order={3} color="gray.8">المدفوعات</Title>
                            {due > 0 && (
                                <Badge color="orange" variant="filled" size="lg">
                                    مطلوب {due.toLocaleString("en-US")} ر.ع
                                </Badge>
                            )}
                        </Group>
                        <Text size="sm" color="gray.6">
                            رسوم طلباتك عند النادي — ارفع صورة الإيصال مع الرقم المرجعي للتحويل، والدفع كامل.
                        </Text>
                    </Box>
                    <SegmentedControl
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { label: "الكل", value: "all" },
                            { label: "مطلوب الدفع", value: "waiting" },
                            { label: "بانتظار الاعتماد", value: "submitted" },
                            { label: "معتمدة", value: "accepted" },
                        ]}
                    />
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={rows.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل المدفوعات"
                    emptyLabel="لا توجد رسوم مطلوبة"
                >
                    <Stack spacing="sm">
                        {rows.map((row: any) => (
                            <Paper key={row.id} p="md" radius="md" withBorder>
                                <Group position="apart" align="flex-start" noWrap>
                                    {row.status === "waiting" && (
                                        <Checkbox
                                            mt={4}
                                            checked={picked.includes(row.id)}
                                            onChange={() => toggle(row.id)}
                                            aria-label={`اختيار ${row.subject || row.label} للسداد بإيصال واحد`}
                                        />
                                    )}
                                    <Box sx={{ flex: 1 }}>
                                        <Group spacing={8} mb={4}>
                                            <Text weight={600} color="gray.8">{row.label || row.fee_type}</Text>
                                            {row.subject && <Text color="gray.7">— {row.subject}</Text>}
                                            <Badge color="blue" variant="light">
                                                {Number(row.amount).toLocaleString("en-US")} ر.ع
                                            </Badge>
                                            <Badge color={STATUS_COLOR[row.status] || "gray"} variant="light">
                                                {STATUS_LABEL[row.status] || row.status}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" color="gray.6">
                                            تاريخ المطالبة: {row?.createdAt || "—"}
                                            {row?.paid_at ? ` — تاريخ الدفع: ${row.paid_at}` : ""}
                                        </Text>
                                        {row.reference_number && (
                                            <Text size="xs" color="gray.6" mt={2}>
                                                الرقم المرجعي: {row.reference_number}
                                            </Text>
                                        )}
                                        {row.note && (
                                            <Text size="sm" color="gray.7" mt={4}>بيان الطلب: {row.note}</Text>
                                        )}
                                        {row.decision_note && (
                                            // سبب رفض النادي للإيصال — يبقى ظاهراً حتى ترفع إيصالاً جديداً.
                                            <Text size="sm" color="red.7" mt={2}>سبب الرفض: {row.decision_note}</Text>
                                        )}
                                        {row.receipt && (
                                            <Anchor href={getImageUrl(row.receipt)} target="_blank" rel="noreferrer" size="sm" mt={6}>
                                                <Group spacing={4}><FileText size={14} /> الإيصال المرفوع</Group>
                                            </Anchor>
                                        )}
                                    </Box>

                                    {row.status !== "accepted" && (
                                        <Button
                                            size="xs"
                                            variant={row.status === "submitted" ? "outline" : "filled"}
                                            leftIcon={<Upload size={14} />}
                                            onClick={() => { setPaying(row); setReference(row.reference_number || ""); setReceipt(null); }}
                                        >
                                            {row.status === "submitted" ? "تعديل الإيصال" : "رفع الإيصال"}
                                        </Button>
                                    )}
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </DataState>
            </Container>

            <Modal
                title="رفع إيصال الدفع"
                size="lg"
                opened={Boolean(paying)}
                onClose={() => setPaying(null)}
                footer={
                    <Box py={16} px={20} bg="slate.0">
                        <Group position="right" spacing="xs">
                            <Button variant="outline" bg="white" onClick={() => setPaying(null)}>إلغاء</Button>
                            <Button loading={submitting} onClick={onSubmit}>إرسال الإيصال</Button>
                        </Group>
                    </Box>
                }
            >
                <Box p={20}>
                    <Alert icon={<AlertCircle size={16} />} color="orange" variant="light" mb="md">
                        المطلوب: <strong>{Number(paying?.amount || 0).toLocaleString("en-US")} ر.ع</strong> عن{" "}
                        {paying?.label || "الطلب"} — الدفع كامل، والإيصال الذي يقلّ عن المبلغ يُرفض.
                        {paying?.note ? ` (${paying.note})` : ""}
                    </Alert>
                    <Stack spacing="sm">
                        <TextInput
                            label="الرقم المرجعي للتحويل"
                            placeholder="الرقم الذي يظهر في إشعار التحويل"
                            description="به يطابق النادي الإيصال بالتحويل في حسابه"
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
                    </Stack>
                </Box>
            </Modal>

            {picked.length > 0 && !batchOpen && (
                <Affix position={{ bottom: 24, left: 24 }}>
                    <Paper shadow="md" radius="md" p="sm" withBorder>
                        <Group spacing="sm">
                            <Text size="sm" weight={600}>
                                {picked.length} مطالبات — {pickedTotal.toLocaleString("en-US")} ر.ع
                            </Text>
                            <Button leftIcon={<Upload size={14} />} onClick={() => { setReference(""); setReceipt(null); setBatchOpen(true); }}>
                                سداد المحدّد بإيصال واحد
                            </Button>
                            <Button variant="subtle" color="gray" onClick={() => setPicked([])}>إلغاء التحديد</Button>
                        </Group>
                    </Paper>
                </Affix>
            )}

            <Modal
                title="إيصال واحد لعدّة مطالبات"
                size="lg"
                opened={batchOpen}
                onClose={() => setBatchOpen(false)}
                footer={
                    <Box py={16} px={20} bg="slate.0">
                        <Group position="right" spacing="xs">
                            <Button variant="outline" bg="white" onClick={() => setBatchOpen(false)}>إلغاء</Button>
                            <Button loading={submittingBatch} onClick={onSubmitBatch}>إرسال الإيصال</Button>
                        </Group>
                    </Box>
                }
            >
                <Box p={20}>
                    <Alert icon={<AlertCircle size={16} />} color="orange" variant="light" mb="md">
                        حوّل <strong>{pickedTotal.toLocaleString("en-US")} ر.ع</strong> كاملة بتحويلٍ واحد — ويرى النادي ما يخصّ كل لاعب:
                    </Alert>
                    <Stack spacing={4} mb="md">
                        {pickedRows.map((row: any) => (
                            <Group key={row.id} position="apart">
                                <Text size="sm" color="gray.8">{row.label}{row.subject ? ` — ${row.subject}` : ""}</Text>
                                <Text size="sm" weight={600}>{Number(row.amount).toLocaleString("en-US")} ر.ع</Text>
                            </Group>
                        ))}
                    </Stack>
                    <Stack spacing="sm">
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
                    </Stack>
                </Box>
            </Modal>
        </Box>
    );
}
