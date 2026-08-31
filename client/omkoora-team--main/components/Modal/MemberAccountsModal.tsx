import {
    ActionIcon, Badge, Box, Button, Group, Loader, NumberInput, ScrollArea,
    SegmentedControl, Select, Stack, Table, Text, TextInput,
} from "@mantine/core";
import { Check, ChevronDown, Search, Trash } from "tabler-icons-react";
import { DateInput } from "@mantine/dates";
import React, { useEffect, useMemo, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {
    useMemberAccounts, usePlayerAccounts, useCreateMemberPayment, useDeleteMemberPayment,
} from "../../graphql";
import { Notyf } from "notyf";
import dayjs from "dayjs";

type Mode = "members" | "players";

type Props = {
    // team id whose members'/players' accounts we manage
    idTeam?: string;
} & ModalProps;

const fullName = (p: any) =>
    [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ");

// Running payment ledger for a team's members OR players (toggle). Lists each
// person with the total they have paid, records a new payment, and expands each
// row to show/delete the individual payments. Players see their own ledger in
// the player portal ("مصروفاتي").
export const MemberAccountsModal = ({ idTeam, ...props }: Props) => {
    const [mode, setMode] = useState<Mode>("members");

    const [getMembers, { data: memberData, loading: mLoading, refetch: mRefetch }] = useMemberAccounts();
    const [getPlayers, { data: playerData, loading: pLoading, refetch: pRefetch }] = usePlayerAccounts();
    const [createPayment, { loading: creating }] = useCreateMemberPayment();
    const [deletePayment] = useDeleteMemberPayment();

    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number | "">("");
    const [date, setDate] = useState<Date | null>(null);
    const [note, setNote] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const isMembers = mode === "members";
    const word = isMembers ? "العضو" : "اللاعب";

    const fetchActive = () => {
        if (!idTeam) return;
        const opts = { variables: { idTeam }, fetchPolicy: "network-only" as const };
        isMembers ? getMembers(opts) : getPlayers(opts);
    };

    useEffect(() => {
        if (props.opened && idTeam) fetchActive();
        // reset the picker when switching lists
        setSubjectId(null);
        setSearch("");
        setExpanded(null);
    }, [props.opened, idTeam, mode]);

    // Normalise both shapes to { subject: person-holder, totalPaid, payments }.
    const accounts: any[] = isMembers
        ? (memberData?.memberAccountsTeam || [])
        : (playerData?.playerAccountsTeam || []);
    const subjectOf = (a: any) => (isMembers ? a?.member : a?.player);

    const loading = isMembers ? mLoading : pLoading;
    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    // Filter by name, civil number (الرقم المدني) or phone.
    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return accounts;
        return accounts.filter((a) => {
            const p = subjectOf(a)?.person;
            return [fullName(p), p?.card_number, p?.phone]
                .filter(Boolean).join(" ").toLowerCase().includes(needle);
        });
    }, [accounts, search, mode]);

    const grandTotal = useMemo(
        () => filtered.reduce((s, a) => s + (Number(a?.totalPaid) || 0), 0),
        [filtered]
    );

    const options = accounts.map((a) => {
        const s = subjectOf(a);
        return { value: s?.id, label: fullName(s?.person) || s?.person?.phone || word };
    });

    const reload = () => (isMembers ? (mRefetch ? mRefetch() : fetchActive()) : (pRefetch ? pRefetch() : fetchActive()));

    const submit = async () => {
        if (!subjectId) return notyf().error(`اختر ${word} أولاً`);
        if (!amount || Number(amount) <= 0) return notyf().error("أدخل مبلغًا صحيحًا");
        try {
            await createPayment({
                variables: {
                    content: {
                        amount: Number(amount),
                        note: note || null,
                        payment_date: date ? dayjs(date).format("YYYY-MM-DD") : null,
                        ...(isMembers ? { id_member: subjectId } : { id_player: subjectId }),
                        id_team: idTeam,
                    },
                },
            });
            notyf().success("تم تسجيل الدفعة");
            setAmount(""); setNote(""); setDate(null);
            reload();
        } catch (e) {
            notyf().error("تعذّر تسجيل الدفعة");
        }
    };

    const onDelete = async (id: string) => {
        try {
            await deletePayment({ variables: { id } });
            notyf().success("تم حذف الدفعة");
            reload();
        } catch (e) {
            notyf().error("تعذّر حذف الدفعة");
        }
    };

    return (
        <Modal {...props} title="حسابات الأعضاء واللاعبين" size="xl">
            <Box p={20}>
                <SegmentedControl
                    fullWidth
                    mb="md"
                    value={mode}
                    onChange={(v) => setMode(v as Mode)}
                    data={[
                        { label: "الأعضاء", value: "members" },
                        { label: "اللاعبون", value: "players" },
                    ]}
                />

                {/* Record a new payment */}
                <Box p="md" mb="lg" sx={(theme) => ({ border: `1px solid ${theme.colors.gray[3]}`, borderRadius: 8 })}>
                    <Text fw={600} mb="sm">تسجيل دفعة جديدة</Text>
                    <Group align="flex-end" grow>
                        <Select
                            label={word}
                            placeholder={`اختر ${word}`}
                            searchable
                            nothingFound="لا يوجد"
                            data={options}
                            value={subjectId}
                            onChange={setSubjectId}
                        />
                        <NumberInput label="المبلغ" placeholder="0.000" precision={3} min={0} value={amount} onChange={setAmount} />
                        <DateInput label="التاريخ" placeholder="اختياري" value={date} onChange={setDate} valueFormat="YYYY-MM-DD" clearable />
                        <TextInput label="ملاحظة" placeholder="اختياري" value={note} onChange={(e) => setNote(e.currentTarget.value)} />
                    </Group>
                    <Group position="right" mt="md">
                        <Button leftIcon={<Check size={16} />} loading={creating} onClick={submit}>
                            تسجيل الدفعة
                        </Button>
                    </Group>
                </Box>

                {/* Search + summary */}
                <TextInput
                    mb="sm"
                    icon={<Search size={16} />}
                    placeholder="ابحث بالاسم أو الرقم المدني أو رقم الهاتف"
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />
                <Group position="apart" mb="sm">
                    <Text fw={600}>{search.trim() ? "إجمالي المعروض" : `إجمالي مدفوعات ${isMembers ? "الأعضاء" : "اللاعبين"}`}</Text>
                    <Badge size="lg" color="green" variant="light">{grandTotal.toLocaleString("en-US")} ر.ع</Badge>
                </Group>

                {loading ? (
                    <Stack align="center" py="xl"><Loader /></Stack>
                ) : filtered.length === 0 ? (
                    <Text color="dimmed" align="center" py="xl">
                        {accounts.length === 0 ? `لا يوجد ${isMembers ? "أعضاء" : "لاعبون"} لعرضهم` : "لا يوجد مطابق للبحث"}
                    </Text>
                ) : (
                    <ScrollArea>
                        <Table striped highlightOnHover>
                            <thead>
                                <tr>
                                    <th>{word}</th>
                                    <th>الرقم المدني</th>
                                    <th>رقم الهاتف</th>
                                    <th>إجمالي المدفوع</th>
                                    <th>عدد الدفعات</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a) => {
                                    const s = subjectOf(a);
                                    return (
                                        <React.Fragment key={s?.id}>
                                            <tr>
                                                <td>{fullName(s?.person) || "—"}</td>
                                                <td>{s?.person?.card_number || "—"}</td>
                                                <td>{s?.person?.phone || "—"}</td>
                                                <td><Text fw={700} color="green.7">{(Number(a.totalPaid) || 0).toLocaleString("en-US")}</Text></td>
                                                <td>{a.payments?.length || 0}</td>
                                                <td>
                                                    {a.payments?.length ? (
                                                        <ActionIcon onClick={() => setExpanded(expanded === s?.id ? null : s?.id)}>
                                                            <ChevronDown size={16} />
                                                        </ActionIcon>
                                                    ) : null}
                                                </td>
                                            </tr>
                                            {expanded === s?.id && a.payments?.length ? (
                                                <tr>
                                                    <td colSpan={6} style={{ background: "#f8f9fa" }}>
                                                        <Stack spacing={6} p="xs">
                                                            {a.payments.map((p: any) => (
                                                                <Group key={p.id} position="apart" noWrap>
                                                                    <Text size="sm" fw={600}>{(Number(p.amount) || 0).toLocaleString("en-US")} ر.ع</Text>
                                                                    <Text size="xs" color="dimmed">{p.payment_date || (p.createdAt ? String(p.createdAt).slice(0, 10) : "—")}</Text>
                                                                    <Text size="xs" sx={{ flex: 1 }} color="gray.7">{p.note || ""}</Text>
                                                                    <ActionIcon color="red" variant="light" onClick={() => onDelete(p.id)}>
                                                                        <Trash size={14} />
                                                                    </ActionIcon>
                                                                </Group>
                                                            ))}
                                                        </Stack>
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Box>
        </Modal>
    );
};
