import {
    Badge, Box, Chip, Container, Group, Pagination, Paper, SegmentedControl,
    Stack, Table, Text, TextInput, Title,
} from "@mantine/core";
import { Search } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";

import { useClubMembership } from "../graphql";
import DataState from "../components/Loading/DataState";

// العضوية: كل أعضاء النادي في قائمة واحدة.
//
// صفحة الأعضاء كانت تقرأ سجل الجمعية وحده، فنادٍ فيه مئات اللاعبين يقرأ
// «لا يوجد بيانات» ويظن أن المنصة فقدتهم. وهنا تُقرأ السجلات الأربعة معاً،
// والشخص الواحد صفّ واحد يحمل تصنيفاته — «بس ما يكون متكرر».

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<string, string> = {
    accepted: "معتمد",
    waiting: "قيد الانتظار",
    waiting_club: "بانتظار النادي",
    rejected: "مرفوض",
    suspended: "موقوف",
};

const STATUS_COLOR: Record<string, string> = {
    accepted: "teal",
    waiting: "yellow",
    waiting_club: "yellow",
    rejected: "red",
    suspended: "gray",
};

export default function Membership() {
    const [kind, setKind] = useState<string | null>(null);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [getMembership, { data, loading }] = useClubMembership();

    useEffect(() => {
        const timer = setTimeout(() => {
            getMembership({
                variables: {
                    kind,
                    status: status === "all" ? null : status,
                    search: search.trim() || null,
                    page,
                    limit: PAGE_SIZE,
                },
                fetchPolicy: "cache-and-network",
            });
        }, search ? 350 : 0);        // الكتابة في البحث لا ترسل طلباً لكل حرف
        return () => clearTimeout(timer);
    }, [kind, status, search, page, getMembership]);

    // أي تغيير في المرشّحات يعيدنا للصفحة الأولى، وإلا بقينا في صفحة لم تعد موجودة.
    useEffect(() => { setPage(1); }, [kind, status, search]);

    const membership = data?.clubMembership;
    const rows = membership?.rows || [];
    const counts = membership?.counts || [];
    const total = membership?.total || 0;
    const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>العضوية</title></Head>
            <Container size="xl" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Title order={3} color="gray.8">العضوية</Title>
                            <Badge color="blue" variant="light" size="lg">{total.toLocaleString("en-US")}</Badge>
                        </Group>
                        <Text size="sm" color="gray.6">
                            أعضاء النادي جميعاً — لاعبون وجهاز فني ومجلس إدارة وأعضاء أساسيون.
                            الشخص الواحد يظهر مرة واحدة بتصنيفاته، فلا يُحسب مرتين.
                        </Text>
                    </Box>
                    <Group spacing="sm">
                        <TextInput
                            placeholder="بحث بالاسم أو الرقم المدني أو رقم العضوية"
                            icon={<Search size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            w={300}
                        />
                        <SegmentedControl
                            value={status}
                            onChange={setStatus}
                            data={[
                                { label: "الكل", value: "all" },
                                { label: "معتمد", value: "accepted" },
                                { label: "قيد الانتظار", value: "waiting" },
                                { label: "مرفوض", value: "rejected" },
                            ]}
                        />
                    </Group>
                </Group>

                <Group position="right" mb="md" spacing="xs">
                <Chip.Group
                    value={kind || "all"}
                    onChange={(value: any) => setKind(value === "all" ? null : value)}
                >
                    <Chip value="all" variant="filled">الكل</Chip>
                    {counts.map((count: any) => (
                        <Chip key={count.kind} value={count.kind} variant="filled">
                            {count.label} ({count.count})
                        </Chip>
                    ))}
                </Chip.Group>
                </Group>

                <Paper radius="md" withBorder p={0} sx={{ overflow: "hidden" }}>
                    <DataState
                        loading={loading && !data}
                        empty={rows.length === 0}
                        variant="rows"
                        loadingLabel="جارٍ تحميل العضوية"
                        emptyLabel="لا يوجد أعضاء مطابقون"
                    >
                        <Table striped highlightOnHover verticalSpacing="sm">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "right" }}>الاسم</th>
                                    <th style={{ textAlign: "right" }}>التصنيف</th>
                                    <th style={{ textAlign: "right" }}>الرقم المدني</th>
                                    <th style={{ textAlign: "right" }}>الفريق</th>
                                    <th style={{ textAlign: "right" }}>رقم العضوية</th>
                                    <th style={{ textAlign: "right" }}>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row: any) => (
                                    <tr key={row.id}>
                                        <td><Text size="sm" weight={600} color="gray.8">{row.full_name || "—"}</Text></td>
                                        <td><Text size="sm" color="gray.7">{row.label || "—"}</Text></td>
                                        <td><Text size="sm" color="gray.6">{row.card_number || "—"}</Text></td>
                                        <td><Text size="sm" color="gray.6">{row.team_name || "—"}</Text></td>
                                        <td>
                                            <Text size="sm" color="gray.6">
                                                {row.membership_number || "—"}
                                                {row.membership_date ? ` (${row.membership_date})` : ""}
                                            </Text>
                                        </td>
                                        <td>
                                            <Badge color={STATUS_COLOR[row.status] || "gray"} variant="light">
                                                {STATUS_LABEL[row.status] || row.status || "—"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </DataState>
                </Paper>

                {pages > 1 && (
                    <Group position="center" mt="md">
                        <Pagination total={pages} value={page} onChange={setPage} />
                    </Group>
                )}

                <Stack spacing={2} mt="sm">
                    <Text size="xs" color="gray.5">
                        مجموع التصنيفات أكبر من عدد الأعضاء عندما يحمل الشخص أكثر من تصنيف — وهو شخص واحد في الحالتين.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}
