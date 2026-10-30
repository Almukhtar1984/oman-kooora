import { Anchor, Badge, Box, Button, Container, Group, Paper, SegmentedControl, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { AlertTriangle, Check, FileText, Search, X } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import { Notyf } from "notyf";

import { AllPlayerReleases, useAllPlayerReleases, useDecidePlayerRelease } from "../graphql";
import { getImageUrl } from "../lib/helpers/image";
import DataState from "../components/Loading/DataState";
import Modal from "../components/Modal/Modal";

// إخلاء الطرف: الصفحة التي يبتّ فيها النادي طلبات استقالة لاعبيه.
//
// الاعتماد هو ما يحرّر اللاعب فعلياً من فريقه، ولذلك الرفض هنا يستوجب سبباً
// يقرؤه الفريق، لا مجرد رفض صامت.

const STATUS_LABEL: Record<string, string> = {
    waiting: "بانتظار قرار النادي",
    accepted: "تم إخلاء الطرف",
    rejected: "مرفوض",
};

const STATUS_COLOR: Record<string, string> = {
    waiting: "yellow",
    accepted: "teal",
    rejected: "red",
};

const fullName = (person: any) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe].filter(Boolean).join(" ");

export default function Releases() {
    const [statusFilter, setStatusFilter] = useState("waiting");
    const [search, setSearch] = useState("");
    const [rejecting, setRejecting] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");

    const [getReleases, { loading, data }] = useAllPlayerReleases();
    const [decide, { loading: deciding }] = useDecidePlayerRelease();

    useEffect(() => {
        getReleases({
            variables: statusFilter === "all" ? {} : { status: statusFilter },
            fetchPolicy: "cache-and-network",
        });
    }, [statusFilter, getReleases]);

    const rows = useMemo(() => {
        const list = data?.allPlayerReleases || [];
        const needle = search.trim();
        if (!needle) return list;
        return list.filter((row: any) => {
            const person = row?.player?.person;
            return fullName(person).includes(needle) || String(person?.card_number || "").includes(needle);
        });
    }, [data, search]);

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    const refresh = () => getReleases({
        variables: statusFilter === "all" ? {} : { status: statusFilter },
        fetchPolicy: "network-only",
    });

    const onAccept = (row: any) => {
        decide({
            variables: { id: row.id, status: "accepted" },
            refetchQueries: [AllPlayerReleases],
            // الاعتماد خطوةٌ على مسار الطلب: يُخلى الطرف عند الاعتماد النهائي بعد
            // الرسوم، والخادم يقول أين وصل.
            onCompleted: (res: any) => {
                notyf().success(res?.decidePlayerRelease?.message || "تم إخلاء طرف اللاعب — صار متاحاً للتسجيل في نادٍ جديد");
                refresh();
            },
            onError: (e) => notyf().error(e?.message || "تعذّر اعتماد الطلب"),
        });
    };

    const onReject = () => {
        if (!rejectNote.trim()) { notyf().error("اذكر سبب الرفض ليصل للفريق"); return; }
        decide({
            variables: { id: rejecting.id, status: "rejected", note: rejectNote.trim() },
            refetchQueries: [AllPlayerReleases],
            onCompleted: () => {
                notyf().success("تم رفض الطلب");
                setRejecting(null);
                setRejectNote("");
                refresh();
            },
            onError: (e) => notyf().error(e?.message || "تعذّر رفض الطلب"),
        });
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>إخلاء الطرف</title></Head>
            <Container size="xl" py="lg">
                <Group position="apart" mb="md" align="flex-end">
                    <Box>
                        <Title order={3} color="gray.8">إخلاء الطرف</Title>
                        <Text size="sm" color="gray.6">
                            طلبات استقالة اللاعبين — باعتمادك يتحرّر اللاعب من فريقه ويصبح متاحاً للتسجيل في نادٍ جديد.
                        </Text>
                    </Box>
                    <Group spacing="sm">
                        <TextInput
                            placeholder="بحث بالاسم أو الرقم المدني"
                            icon={<Search size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                        />
                        <SegmentedControl
                            value={statusFilter}
                            onChange={setStatusFilter}
                            data={[
                                { label: "قيد الانتظار", value: "waiting" },
                                { label: "تم إخلاء طرفهم", value: "accepted" },
                                { label: "مرفوضة", value: "rejected" },
                                { label: "الكل", value: "all" },
                            ]}
                        />
                    </Group>
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={rows.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل الطلبات"
                    emptyLabel="لا توجد طلبات إخلاء طرف"
                >
                    <Stack spacing="sm">
                        {rows.map((row: any) => (
                            <Paper key={row.id} p="md" radius="md" withBorder>
                                <Group position="apart" align="flex-start" noWrap>
                                    <Box sx={{ flex: 1 }}>
                                        <Group spacing={8} mb={4}>
                                            <Text weight={600} color="gray.8">{fullName(row?.player?.person) || "—"}</Text>
                                            <Badge color={STATUS_COLOR[row.status] || "gray"} variant="light">
                                                {STATUS_LABEL[row.status] || row.status}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" color="gray.6">
                                            الرقم المدني: {row?.player?.person?.card_number || "—"}
                                            {row?.team?.name ? ` — الفريق: ${row.team.name}` : ""}
                                        </Text>
                                        <Text size="xs" color="gray.6" mt={2}>
                                            تاريخ الطلب: {row?.requested_at || row?.createdAt || "—"}
                                            {row?.decided_at ? ` — تاريخ القرار: ${row.decided_at}` : ""}
                                        </Text>
                                        {row?.reason && (
                                            <Text size="sm" color="gray.7" mt={8}>السبب: {row.reason}</Text>
                                        )}
                                        {row?.note && (
                                            <Text size="sm" color="red.7" mt={4}>سبب الرفض: {row.note}</Text>
                                        )}
                                        {row?.letter && (
                                            <Anchor href={getImageUrl(row.letter)} target="_blank" rel="noreferrer" size="sm" mt={6}>
                                                <Group spacing={4}><FileText size={14} /> خطاب الاستقالة</Group>
                                            </Anchor>
                                        )}
                                    </Box>

                                    {row.status === "waiting" && (
                                        <Group spacing="xs" noWrap>
                                            <Button
                                                size="xs" color="teal" leftIcon={<Check size={14} />}
                                                loading={deciding}
                                                onClick={() => onAccept(row)}
                                            >
                                                اعتماد إخلاء الطرف
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
                title="رفض طلب إخلاء الطرف"
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
                            سيبقى اللاعب في فريقه، ويصل السبب إلى الفريق ليعدّل الطلب أو يعيد تقديمه.
                        </Text>
                    </Group>
                    <Textarea
                        label="سبب الرفض"
                        placeholder="اذكر السبب"
                        minRows={3}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.currentTarget.value)}
                        withAsterisk
                    />
                </Box>
            </Modal>
        </Box>
    );
}
