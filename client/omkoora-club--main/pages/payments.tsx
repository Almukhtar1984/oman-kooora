import {
    Anchor, Badge, Box, Button, Container, Group, NumberInput, Paper,
    SegmentedControl, Select, Stack, Text, Textarea, TextInput, Title,
} from "@mantine/core";
import { AlertTriangle, Check, Coin, FileText, Plus, Search, X } from "tabler-icons-react";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import {
    useAllTeams, useClubFees, useCreateRequestPayment, useDecidePayment, useRequestPayments,
} from "../graphql";
import { getImageUrl } from "../lib/helpers/image";
import { matchesPayment } from "../lib/helpers/paymentSearch";
import DataState from "../components/Loading/DataState";
import Modal from "../components/Modal/Modal";
import useStore from "../store/useStore";

// المدفوعات: كل دفعة تسمّي الطلب الذي تسدّده.
//
// كان الفريق يحوّل مبلغاً واحداً عن عدة طلبات فلا يعرف النادي أيّها سُدّد —
// «ويصير خربطة». هنا: دفعة واحدة لطلب واحد، بإيصالها ورقمها المرجعي.

const STATUS_LABEL: Record<string, string> = {
    waiting: "بانتظار الدفع",
    submitted: "إيصال بانتظار اعتمادك",
    accepted: "معتمد",
    rejected: "مرفوض",
};

const STATUS_COLOR: Record<string, string> = {
    waiting: "yellow",
    submitted: "blue",
    accepted: "teal",
    rejected: "red",
};

export default function Payments() {
    const userData = useStore((state: any) => state.userData);

    const [statusFilter, setStatusFilter] = useState("submitted");
    const [search, setSearch] = useState("");
    const [billing, setBilling] = useState(false);
    const [rejecting, setRejecting] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");

    const [feeType, setFeeType] = useState<string | null>(null);
    const [teamId, setTeamId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [note, setNote] = useState("");

    const [getPayments, { data, loading }] = useRequestPayments();
    const [getFees, { data: feesData }] = useClubFees();
    const [getTeams, { data: teamsData }] = useAllTeams();
    const [decide, { loading: deciding }] = useDecidePayment();
    const [bill, { loading: billingNow }] = useCreateRequestPayment();

    const variables = statusFilter === "all" ? {} : { status: statusFilter };

    useEffect(() => {
        getPayments({ variables, fetchPolicy: "cache-and-network" });
    }, [statusFilter, getPayments]);

    useEffect(() => { getFees({ fetchPolicy: "cache-and-network" }); }, [getFees]);

    useEffect(() => {
        const idClub = userData?.person?.clubManagement?.club?.id;
        if (idClub) getTeams({ variables: { idClub }, fetchPolicy: "cache-and-network" });
    }, [userData, getTeams]);

    const rows = (data?.requestPayments || []).filter((row: any) => matchesPayment(row, search));
    const fees = feesData?.clubFees || [];
    const teams = teamsData?.allTeam || [];

    const feeOptions = useMemo(() => fees
        .filter((fee: any) => fee.active)
        .map((fee: any) => ({
            value: fee.fee_type,
            label: `${fee.label} — ${Number(fee.amount).toLocaleString("en-US")} ر.ع`,
        })), [fees]);

    const teamOptions = useMemo(() => teams
        .map((team: any) => ({ value: team.id, label: team.name })), [teams]);

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });
    const refresh = () => getPayments({ variables, fetchPolicy: "network-only" });

    // اختيار نوع الرسوم يجلب سعر النادي، ويبقى قابلاً للتعديل لهذا الطلب وحده.
    const onPickFee = (value: string | null) => {
        setFeeType(value);
        const fee = fees.find((item: any) => item.fee_type === value);
        setAmount(Number(fee?.amount) || 0);
    };

    const onBill = () => {
        if (!feeType || !teamId) { notyf().error("اختر الفريق ونوع الرسوم"); return; }
        bill({
            variables: { content: { fee_type: feeType, id_team: teamId, amount, note: note.trim() || undefined } },
            onCompleted: () => {
                notyf().success("تمت مطالبة الفريق — وصله إشعار بالمبلغ");
                setBilling(false);
                setFeeType(null); setTeamId(null); setAmount(0); setNote("");
                refresh();
            },
            onError: (error) => notyf().error(error?.message || "تعذّرت المطالبة"),
        });
    };

    const onAccept = (row: any) => {
        decide({
            variables: { id: row.id, status: "accepted" },
            onCompleted: () => { notyf().success("تم اعتماد الإيصال"); refresh(); },
            onError: (error) => notyf().error(error?.message || "تعذّر اعتماد الإيصال"),
        });
    };

    const onReject = () => {
        if (!rejectNote.trim()) { notyf().error("اذكر سبب الرفض ليصل للفريق"); return; }
        decide({
            variables: { id: rejecting.id, status: "rejected", note: rejectNote.trim() },
            onCompleted: () => {
                notyf().success("تم رفض الإيصال — عاد الطلب لانتظار الدفع");
                setRejecting(null); setRejectNote("");
                refresh();
            },
            onError: (error) => notyf().error(error?.message || "تعذّر رفض الإيصال"),
        });
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>المدفوعات</title></Head>
            <Container size="xl" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Coin size={22} />
                            <Title order={3} color="gray.8">المدفوعات</Title>
                        </Group>
                        <Text size="sm" color="gray.6">
                            كل دفعة تسمّي الطلب الذي تسدّده، بإيصالها ورقمها المرجعي — فلا يختلط مبلغ بمبلغ.
                        </Text>
                    </Box>
                    <Group spacing="xs">
                        <Link href="/fees" style={{ textDecoration: "none" }}>
                            <Button variant="outline">أسعار الرسوم</Button>
                        </Link>
                        <Button leftIcon={<Plus size={16} />} onClick={() => setBilling(true)}>
                            مطالبة فريق برسوم
                        </Button>
                    </Group>
                </Group>

                <Group position="apart" mb="md">
                    <TextInput
                        icon={<Search size={16} />}
                        placeholder="ابحث باسم اللاعب أو الرقم المدني أو الرقم المرجعي"
                        value={search}
                        onChange={(event) => setSearch(event.currentTarget.value)}
                        w={340}
                    />
                    <SegmentedControl
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { label: "بانتظار اعتمادك", value: "submitted" },
                            { label: "بانتظار الدفع", value: "waiting" },
                            { label: "معتمدة", value: "accepted" },
                            { label: "الكل", value: "all" },
                        ]}
                    />
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={rows.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل المدفوعات"
                    emptyLabel="لا توجد مدفوعات في هذه الحالة"
                >
                    <Stack spacing="sm">
                        {rows.map((row: any) => (
                            <Paper key={row.id} p="md" radius="md" withBorder>
                                <Group position="apart" align="flex-start" noWrap>
                                    <Box sx={{ flex: 1 }}>
                                        <Group spacing={8} mb={4}>
                                            <Text weight={600} color="gray.8">{row.label || row.fee_type}</Text>
                                            {row.subject && (
                                                <Text color="gray.7">— {row.subject}{row.subject_card ? ` (${row.subject_card})` : ""}</Text>
                                            )}
                                            <Badge color="blue" variant="light">
                                                {Number(row.amount).toLocaleString("en-US")} ر.ع
                                            </Badge>
                                            <Badge color={STATUS_COLOR[row.status] || "gray"} variant="light">
                                                {STATUS_LABEL[row.status] || row.status}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" color="gray.6">
                                            الفريق: {row?.team?.name || "—"} — تاريخ المطالبة: {row?.createdAt || "—"}
                                        </Text>
                                        {row.reference_number && (
                                            <Text size="xs" color="gray.6" mt={2}>
                                                الرقم المرجعي: {row.reference_number}
                                                {row.paid_at ? ` — تاريخ الدفع: ${row.paid_at}` : ""}
                                            </Text>
                                        )}
                                        {row.note && (
                                            <Text size="sm" color="gray.7" mt={4}>بيان الطلب: {row.note}</Text>
                                        )}
                                        {row.decision_note && (
                                            // قرارك السابق على الإيصال — ولا يمحو بيان الطلب.
                                            <Text size="sm" color="red.7" mt={2}>سبب الرفض: {row.decision_note}</Text>
                                        )}
                                        {row.receipt && (
                                            <Anchor href={getImageUrl(row.receipt)} target="_blank" rel="noreferrer" size="sm" mt={6}>
                                                <Group spacing={4}><FileText size={14} /> الإيصال</Group>
                                            </Anchor>
                                        )}
                                    </Box>

                                    {row.status === "submitted" && (
                                        <Group spacing="xs" noWrap>
                                            <Button
                                                size="xs" color="teal" leftIcon={<Check size={14} />}
                                                loading={deciding}
                                                onClick={() => onAccept(row)}
                                            >
                                                اعتماد الإيصال
                                            </Button>
                                            <Button
                                                size="xs" variant="outline" color="red" leftIcon={<X size={14} />}
                                                onClick={() => { setRejecting(row); setRejectNote(""); }}
                                            >
                                                رفض
                                            </Button>
                                        </Group>
                                    )}
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </DataState>
            </Container>

            <Modal
                title="مطالبة فريق برسوم"
                size="lg"
                opened={billing}
                onClose={() => setBilling(false)}
                footer={
                    <Box py={16} px={20} bg="slate.0">
                        <Group position="right" spacing="xs">
                            <Button variant="outline" bg="white" onClick={() => setBilling(false)}>إلغاء</Button>
                            <Button loading={billingNow} onClick={onBill}>إرسال المطالبة</Button>
                        </Group>
                    </Box>
                }
            >
                <Box p={20}>
                    <Stack spacing="sm">
                        <Select
                            label="الفريق"
                            placeholder="اختر الفريق"
                            data={teamOptions}
                            value={teamId}
                            onChange={setTeamId}
                            searchable
                            withAsterisk
                        />
                        <Select
                            label="نوع الرسوم"
                            placeholder="اختر الخدمة"
                            data={feeOptions}
                            value={feeType}
                            onChange={onPickFee}
                            withAsterisk
                            description={feeOptions.length === 0 ? "لم تسعّر أي خدمة بعد — اضبط الأسعار أولاً" : undefined}
                        />
                        <NumberInput
                            label="المبلغ"
                            description="سعر ناديك، ويمكن تعديله لهذا الطلب وحده"
                            min={0}
                            precision={2}
                            hideControls
                            value={amount}
                            onChange={(value) => setAmount(Number(value) || 0)}
                            rightSection={<Text size="xs" color="gray.5" pr={8}>ر.ع</Text>}
                        />
                        <Textarea
                            label="بيان الطلب"
                            placeholder="مثال: تسجيل اللاعب فلان — طلب رقم ١٢"
                            description="يصل مع الإشعار، فيعرف الفريق أيّ طلب يسدّد"
                            minRows={2}
                            value={note}
                            onChange={(event) => setNote(event.currentTarget.value)}
                        />
                    </Stack>
                </Box>
            </Modal>

            <Modal
                title="رفض الإيصال"
                opened={Boolean(rejecting)}
                onClose={() => setRejecting(null)}
                footer={
                    <Box py={16} px={20} bg="slate.0">
                        <Group position="right" spacing="xs">
                            <Button variant="outline" bg="white" onClick={() => setRejecting(null)}>إلغاء</Button>
                            <Button color="red" loading={deciding} onClick={onReject}>تأكيد الرفض</Button>
                        </Group>
                    </Box>
                }
            >
                <Box p={20}>
                    <Group spacing={8} mb={10}>
                        <AlertTriangle size={16} color="#e03131" />
                        <Text size="sm" color="gray.7">
                            يعود الطلب لانتظار الدفع، ويصل السبب للفريق ليرفع إيصالاً صحيحاً.
                        </Text>
                    </Group>
                    <Textarea
                        label="سبب الرفض"
                        placeholder="مثال: الإيصال غير واضح، أو الرقم المرجعي لا يطابق التحويل"
                        minRows={3}
                        value={rejectNote}
                        onChange={(event) => setRejectNote(event.currentTarget.value)}
                        withAsterisk
                    />
                </Box>
            </Modal>
        </Box>
    );
}
