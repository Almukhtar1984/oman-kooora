import {
    ActionIcon, Badge, Box, Button, Group, Loader, NumberInput, ScrollArea,
    Select, Stack, Table, Text, TextInput,
} from "@mantine/core";
import { Check, ChevronDown, Search, Trash } from "tabler-icons-react";
import { DateInput } from "@mantine/dates";
import React, { useEffect, useMemo, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { useMemberAccounts, useCreateMemberPayment, useDeleteMemberPayment } from "../../graphql";
import { Notyf } from "notyf";
import dayjs from "dayjs";

type Props = {
    // team id whose members' accounts we manage
    idTeam?: string;
} & ModalProps;

const fullName = (p: any) =>
    [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ");

// Members' running payment ledger. Lists every team member with the total they
// have paid, lets the admin record a new payment, and expands each row to show
// (and delete) the individual payments.
export const MemberAccountsModal = ({ idTeam, ...props }: Props) => {
    const [getAccounts, { data, loading, refetch }] = useMemberAccounts();
    const [createPayment, { loading: creating }] = useCreateMemberPayment();
    const [deletePayment] = useDeleteMemberPayment();

    const [memberId, setMemberId] = useState<string | null>(null);
    const [amount, setAmount] = useState<number | "">("");
    const [date, setDate] = useState<Date | null>(null);
    const [note, setNote] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (props.opened && idTeam) {
            getAccounts({ variables: { idTeam }, fetchPolicy: "network-only" });
        }
    }, [props.opened, idTeam]);

    const accounts: any[] = data?.memberAccountsTeam || [];
    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    // Filter by member name, civil number (الرقم المدني) or phone so the admin
    // can jump straight to one member and pull his payments.
    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return accounts;
        return accounts.filter((a) => {
            const p = a?.member?.person;
            return [fullName(p), p?.card_number, p?.phone]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(needle);
        });
    }, [accounts, search]);

    const grandTotal = useMemo(
        () => filtered.reduce((s, a) => s + (Number(a?.totalPaid) || 0), 0),
        [filtered]
    );

    const memberOptions = accounts.map((a) => ({
        value: a.member.id,
        label: fullName(a.member.person) || a.member.person?.phone || "عضو",
    }));

    const reload = () =>
        refetch ? refetch() : getAccounts({ variables: { idTeam }, fetchPolicy: "network-only" });

    const submit = async () => {
        if (!memberId) return notyf().error("اختر العضو أولاً");
        if (!amount || Number(amount) <= 0) return notyf().error("أدخل مبلغًا صحيحًا");
        try {
            await createPayment({
                variables: {
                    content: {
                        amount: Number(amount),
                        note: note || null,
                        payment_date: date ? dayjs(date).format("YYYY-MM-DD") : null,
                        id_member: memberId,
                        id_team: idTeam,
                    },
                },
            });
            notyf().success("تم تسجيل الدفعة");
            setAmount("");
            setNote("");
            setDate(null);
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
        <Modal {...props} title="حسابات الأعضاء" size="xl">
            <Box p={20}>
                {/* Record a new payment */}
                <Box p="md" mb="lg" sx={(theme) => ({ border: `1px solid ${theme.colors.gray[3]}`, borderRadius: 8 })}>
                    <Text fw={600} mb="sm">تسجيل دفعة جديدة</Text>
                    <Group align="flex-end" grow>
                        <Select
                            label="العضو"
                            placeholder="اختر العضو"
                            searchable
                            nothingFound="لا يوجد"
                            data={memberOptions}
                            value={memberId}
                            onChange={setMemberId}
                        />
                        <NumberInput
                            label="المبلغ"
                            placeholder="0.000"
                            precision={3}
                            min={0}
                            value={amount}
                            onChange={setAmount}
                        />
                        <DateInput
                            label="التاريخ"
                            placeholder="اختياري"
                            value={date}
                            onChange={setDate}
                            valueFormat="YYYY-MM-DD"
                            clearable
                        />
                        <TextInput
                            label="ملاحظة"
                            placeholder="اختياري"
                            value={note}
                            onChange={(e) => setNote(e.currentTarget.value)}
                        />
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
                    <Text fw={600}>
                        {search.trim() ? "إجمالي المعروض" : "إجمالي مدفوعات الأعضاء"}
                    </Text>
                    <Badge size="lg" color="green" variant="light">
                        {grandTotal.toLocaleString("en-US")} ر.ع
                    </Badge>
                </Group>

                {loading ? (
                    <Stack align="center" py="xl"><Loader /></Stack>
                ) : filtered.length === 0 ? (
                    <Text color="dimmed" align="center" py="xl">
                        {accounts.length === 0 ? "لا يوجد أعضاء لعرضهم" : "لا يوجد عضو مطابق للبحث"}
                    </Text>
                ) : (
                    <ScrollArea>
                        <Table striped highlightOnHover>
                            <thead>
                                <tr>
                                    <th>العضو</th>
                                    <th>الرقم المدني</th>
                                    <th>رقم الهاتف</th>
                                    <th>إجمالي المدفوع</th>
                                    <th>عدد الدفعات</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a) => (
                                    <React.Fragment key={a.member.id}>
                                        <tr>
                                            <td>{fullName(a.member.person) || "—"}</td>
                                            <td>{a.member.person?.card_number || "—"}</td>
                                            <td>{a.member.person?.phone || "—"}</td>
                                            <td>
                                                <Text fw={700} color="green.7">
                                                    {(Number(a.totalPaid) || 0).toLocaleString("en-US")}
                                                </Text>
                                            </td>
                                            <td>{a.payments?.length || 0}</td>
                                            <td>
                                                {a.payments?.length ? (
                                                    <ActionIcon
                                                        onClick={() => setExpanded(expanded === a.member.id ? null : a.member.id)}
                                                    >
                                                        <ChevronDown size={16} />
                                                    </ActionIcon>
                                                ) : null}
                                            </td>
                                        </tr>
                                        {expanded === a.member.id && a.payments?.length ? (
                                            <tr>
                                                <td colSpan={6} style={{ background: "#f8f9fa" }}>
                                                    <Stack spacing={6} p="xs">
                                                        {a.payments.map((p: any) => (
                                                            <Group key={p.id} position="apart" noWrap>
                                                                <Text size="sm" fw={600}>
                                                                    {(Number(p.amount) || 0).toLocaleString("en-US")} ر.ع
                                                                </Text>
                                                                <Text size="xs" color="dimmed">
                                                                    {p.payment_date || (p.createdAt ? String(p.createdAt).slice(0, 10) : "—")}
                                                                </Text>
                                                                <Text size="xs" sx={{ flex: 1 }} color="gray.7">
                                                                    {p.note || ""}
                                                                </Text>
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
                                ))}
                            </tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Box>
        </Modal>
    );
};
