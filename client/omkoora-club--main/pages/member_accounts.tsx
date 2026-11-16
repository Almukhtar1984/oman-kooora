import {
    Badge, Box, Button, Collapse, Container, Grid, Group, Paper, ScrollArea, SegmentedControl, Select,
    Stack, Table, Text, TextInput, Title, UnstyledButton,
} from "@mantine/core";
import { ChevronDown, ChevronUp, FileSpreadsheet, Search, Wallet } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { useClubMemberAccounts } from "../graphql";
import DataState from "../components/Loading/DataState";
import {
    AccountFilter, MemberAccount, TeamAccounts, accountsSheet, filterAccounts, teamLabel, teamsOf,
} from "../lib/helpers/memberAccounts";

// «حسابات الأعضاء» في النادي.
//
// العميل (2026-11-08): «هذا العضو يدفع سنوياً للنادي… نفس فكرة حسابات الأعضاء في
// الفريق… ممكن نسوي على النادي جميع حسابات الأعضاء». فالصفحة تجمع حسابات أعضاء
// فرق النادي كلها ورسوم العضوية السنوية المعتمدة، والشخص يظهر مرة واحدة.

const money = (n: number) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.ع`;
const PAGE = 30;

const AccountRow = ({ row }: { row: MemberAccount }) => {
    const [open, setOpen] = useState(false);
    return (
        <Paper p="sm" radius="md" withBorder>
            <Group position="apart" align="flex-start" spacing="xs">
                <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Group spacing={6}>
                        <Text weight={700} color="gray.8">{row.name || "—"}</Text>
                        {row.kinds.map((kind) => <Badge key={kind} size="xs" variant="light">{kind}</Badge>)}
                    </Group>
                    <Text size="xs" color="gray.6">
                        {row.card_number ? <>الرقم المدني <bdi dir="ltr">{row.card_number}</bdi></> : "بلا رقم مدني"}
                        {row.membership_number ? <> · رقم العضوية <bdi dir="ltr">{row.membership_number}</bdi></> : null}
                        {row.teams.length ? ` · ${row.teams.join("، ")}` : null}
                    </Text>
                </Box>
                <Group spacing="md" sx={{ flexWrap: "wrap" }}>
                    <Badge color={row.subscribedThisYear ? "teal" : "red"} variant="light">
                        {row.subscribedThisYear ? "سدّد هذه السنة" : "لم يسدّد هذه السنة"}
                    </Badge>
                    <Box>
                        <Text size="xs" color="gray.6">للفريق هذه السنة</Text>
                        <Text weight={700}>{money(row.paidToTeamThisYear ?? 0)}</Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="gray.6">للنادي هذه السنة</Text>
                        <Text weight={700}>{money(row.paidToClubThisYear ?? 0)}</Text>
                    </Box>
                    <Box>
                        <Text size="xs" color="gray.6">الإجمالي</Text>
                        <Text weight={700}>{money(row.totalPaid)}</Text>
                    </Box>
                    {row.payments.length ? (
                        <Button
                            size="xs" variant="subtle"
                            rightIcon={open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            onClick={() => setOpen((v) => !v)}
                        >
                            الدفعات ({row.payments.length})
                        </Button>
                    ) : null}
                </Group>
            </Group>
            <Collapse in={open}>
                <Stack spacing={4} mt="sm">
                    {row.payments.map((p, i) => (
                        <Group key={i} position="apart" px="xs" py={4}
                            sx={(t) => ({ borderTop: `1px solid ${t.colors.gray[2]}`, flexWrap: "wrap" })}>
                            <Text size="sm">
                                <Badge size="xs" variant="light" color={p.party === "club" ? "grape" : "blue"} mr={6}>
                                {p.party === "club" ? "للنادي" : "للفريق"}
                            </Badge>
                            <bdi dir="ltr">{p.date || "—"}</bdi> · {p.source}{p.team ? ` · ${p.team}` : ""}{p.note ? ` · ${p.note}` : ""}
                            </Text>
                            <Text size="sm" weight={600}>{money(p.amount)}</Text>
                        </Group>
                    ))}
                </Stack>
            </Collapse>
        </Paper>
    );
};

export default function MemberAccounts() {
    const thisYear = new Date().getFullYear();
    const [year, setYear] = useState(String(thisYear));
    const [filter, setFilter] = useState<AccountFilter>({ search: "", team: null, paid: "all" });
    const [shown, setShown] = useState(PAGE);
    const [load, { data, loading }] = useClubMemberAccounts();

    useEffect(() => {
        load({ variables: { year: Number(year) }, fetchPolicy: "cache-and-network" });
        setShown(PAGE);
    }, [year, load]);

    const result = data?.clubMemberAccounts;
    const ready = Boolean(result) || !loading;
    const rows: MemberAccount[] = result?.rows || [];
    const teamTable: TeamAccounts[] = result?.teams || [];
    // حتى تصل الأرقام تظهر «…» لا «0» — صفرٌ يُقرأ خبراً (اجتماع 2026-11-16).
    const shownValue = (value: string) => (ready ? value : "…");
    const teams = useMemo(() => teamsOf(rows), [rows]);
    const filtered = useMemo(() => filterAccounts(rows, filter), [rows, filter]);
    const years = Array.from({ length: 5 }, (_, i) => String(thisYear - i));

    const exportSheet = () => {
        const sheet = XLSX.utils.json_to_sheet(accountsSheet(filtered, Number(year)));
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, "حسابات الأعضاء");
        XLSX.writeFile(book, `حسابات-الأعضاء-${year}.xlsx`);
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>حسابات الأعضاء</title></Head>
            <Container size="lg" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Wallet size={22} />
                            <Title order={3} color="gray.8">حسابات الأعضاء</Title>
                        </Group>
                        <Text size="sm" color="gray.6">
                            حسابات أعضاء فرق النادي كلها ورسوم العضوية السنوية — كل شخص مرة واحدة.
                        </Text>
                    </Box>
                    <Button variant="light" leftIcon={<FileSpreadsheet size={16} />} onClick={exportSheet} disabled={!filtered.length}>
                        تصدير Excel
                    </Button>
                </Group>

                <Grid gutter="sm" mb="md">
                    {[
                        { label: `حسابات الفرق في ${year}`, value: money(result?.teamThisYear || 0) },
                        { label: `رسوم النادي في ${year}`, value: money(result?.clubThisYear || 0) },
                        { label: "الأعضاء", value: String(result?.members || 0) },
                        { label: `سدّدوا ${year}`, value: `${result?.paidMembers || 0} من ${result?.members || 0}` },
                    ].map((card) => (
                        <Grid.Col key={card.label} span={6} sm={3}>
                            <Paper p="md" radius="md" withBorder>
                                <Text size="xs" color="gray.6">{card.label}</Text>
                                <Text size="lg" weight={800} color="gray.8">{shownValue(card.value)}</Text>
                            </Paper>
                        </Grid.Col>
                    ))}
                </Grid>

                {/* كل فريق وحده — «نفصلهم: الفريق وحده… هذا وحده، هذا وحده، حق النادي وحده».
                    اضغط فريقاً لتظهر حسابات أعضائه وحدها. */}
                {teamTable.length ? (
                    <Paper withBorder radius="md" mb="md">
                        <ScrollArea>
                            <Table highlightOnHover verticalSpacing="xs" fontSize="sm" sx={{ minWidth: 560 }}>
                                <thead>
                                    <tr>
                                        <th>الفريق</th>
                                        <th>الأعضاء</th>
                                        <th>سدّدوا {year}</th>
                                        <th>حساب الفريق {year}</th>
                                        <th>رسوم النادي {year}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamTable.map((t) => {
                                        const active = filter.team === t.team && filter.team !== null;
                                        return (
                                            <tr key={t.team} style={{ background: active ? "#EEF2FF" : undefined }}>
                                                <td>
                                                    <UnstyledButton
                                                        onClick={() => { setFilter((f) => ({ ...f, team: active ? null : t.team })); setShown(PAGE); }}
                                                        sx={{ fontWeight: active ? 700 : 500, color: "#1E3A8A" }}
                                                    >
                                                        {teamLabel(t.team)}
                                                    </UnstyledButton>
                                                </td>
                                                <td>{t.members}</td>
                                                <td>{t.paidMembers}</td>
                                                <td>{money(t.teamThisYear)}</td>
                                                <td>{money(t.clubThisYear)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </ScrollArea>
                    </Paper>
                ) : null}

                <Group spacing="sm" mb="md" sx={{ flexWrap: "wrap" }}>
                    <TextInput
                        placeholder="بحث بالاسم أو الرقم المدني أو رقم العضوية"
                        icon={<Search size={16} />}
                        value={filter.search}
                        onChange={(e) => { const search = e.currentTarget.value; setFilter((f) => ({ ...f, search })); setShown(PAGE); }}
                        sx={{ flex: 1, minWidth: 220 }}
                    />
                    <Select
                        placeholder="كل الفرق" clearable withinPortal data={teams}
                        value={filter.team || null}
                        onChange={(team) => { setFilter((f) => ({ ...f, team })); setShown(PAGE); }}
                        sx={{ minWidth: 180 }}
                    />
                    <Select
                        withinPortal data={years} value={year}
                        onChange={(v) => v && setYear(v)}
                        sx={{ width: 110 }}
                        aria-label="السنة"
                    />
                    <SegmentedControl
                        value={filter.paid}
                        onChange={(paid: any) => { setFilter((f) => ({ ...f, paid })); setShown(PAGE); }}
                        data={[
                            { value: "all", label: "الكل" },
                            { value: "paid", label: "سدّد" },
                            { value: "unpaid", label: "لم يسدّد" },
                        ]}
                    />
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={filtered.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل حسابات الأعضاء"
                    emptyLabel="لا توجد حسابات بهذا البحث"
                >
                    <Stack spacing="xs">
                        {filtered.slice(0, shown).map((row) => <AccountRow key={row.key} row={row} />)}
                        {filtered.length > shown ? (
                            <Button variant="subtle" onClick={() => setShown((n) => n + PAGE)}>
                                عرض المزيد ({filtered.length - shown})
                            </Button>
                        ) : null}
                    </Stack>
                </DataState>
            </Container>
        </Box>
    );
}
