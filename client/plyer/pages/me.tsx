import {
    Badge, Box, Card, Col, Container, Grid, Group, Loader, Stack, Table, Text, Title,
} from "@mantine/core";
import Head from "next/head";
import React, { useEffect } from "react";
import { Coin, Id, Phone, Users } from "tabler-icons-react";

import { usePortalMe, usePortalPayments } from "../graphql";
import useStore from "../store/useStore";

// Landing page for a member who signed in with phone + civil ID. Read-only:
// the club owns these records, the member only reviews them.

const KIND_LABEL: Record<string, string> = {
    player: "لاعب",
    member: "عضو مجلس إدارة",
    technical: "جهاز فني",
};

const STATUS_LABEL: Record<string, string> = {
    accepted: "معتمد",
    waiting: "قيد الاعتماد",
    waiting_club: "قيد اعتماد النادي",
    rejected: "مرفوض",
    suspended: "موقوف",
};

const STATUS_COLOR: Record<string, string> = {
    accepted: "teal",
    waiting: "yellow",
    waiting_club: "yellow",
    rejected: "red",
    suspended: "orange",
};

const CLASS_LABEL: Record<string, string> = {
    young: "براعم",
    rookies: "ناشئين",
    secondDegree: "الدرجة الثانية",
    firstDegree: "الدرجة الأولى",
};

const fullName = (person: any) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(Boolean)
        .join(" ");

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Group position="apart" spacing="xs" noWrap>
        <Text size="sm" color="dimmed">{label}</Text>
        <Text size="sm" weight={500}>{value || "—"}</Text>
    </Group>
);

export default function Me() {
    const portalData = useStore((state: any) => state.portalData);

    const [getPortalMe, { loading: meLoading, data: meData }] = usePortalMe();
    const [getPortalPayments, { loading: payLoading, data: payData }] = usePortalPayments();

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
        getPortalMe();
        getPortalPayments();
    }, [getPortalMe, getPortalPayments]);

    // The guard in _auth.tsx already put the record in the store, so the page
    // paints immediately and the query above just refreshes it.
    const me = meData?.portalMe || portalData;
    const person = me?.person;
    const memberships: any[] = me?.memberships || [];
    const assemblies: any[] = me?.assemblies || [];

    const account = payData?.portalPayments;
    const payments: any[] = account?.payments || [];
    const totalPaid = Number(account?.totalPaid) || 0;

    if (!person && meLoading) {
        return (
            <Stack mih={300} align="center" justify="center"><Loader /></Stack>
        );
    }

    return (
        <Box>
            <Head><title>بطاقتي</title></Head>
            <Container size="lg" py="md">

                <Box mb="lg">
                    <Title order={3} color="#1E3A8A">{fullName(person)}</Title>
                    <Text color="dimmed" size="sm">بياناتك المسجّلة لدى النادي</Text>
                </Box>

                <Grid gutter="md">
                    <Col xs={12} md={5}>
                        <Card withBorder radius="md" p="lg" h="100%">
                            <Text weight={700} mb="md">المعلومات الشخصية</Text>
                            <Stack spacing="sm">
                                <InfoRow label="الاسم" value={fullName(person)} />
                                <InfoRow label="الرقم المدني" value={person?.card_number} />
                                <InfoRow label="رقم الهاتف" value={person?.phone} />
                                <InfoRow label="تاريخ الميلاد" value={person?.date_birth} />
                            </Stack>
                        </Card>
                    </Col>

                    <Col xs={12} md={7}>
                        <Card withBorder radius="md" p="lg" h="100%">
                            <Group position="apart" mb="md">
                                <Text weight={700}>عضوياتي</Text>
                                <Users size={18} color="#94A3B8" />
                            </Group>

                            {memberships.length === 0 ? (
                                <Text color="dimmed" size="sm">لا توجد عضويات مسجّلة</Text>
                            ) : (
                                <Stack spacing="md">
                                    {memberships.map((m: any) => (
                                        <Box key={`${m.kind}-${m.id}`} p="sm" sx={{ backgroundColor: "#F8FAFC", borderRadius: 8 }}>
                                            <Group position="apart" mb="xs">
                                                <Badge color="blue" variant="light">{KIND_LABEL[m.kind] || m.kind}</Badge>
                                                {m.status && (
                                                    <Badge color={STATUS_COLOR[m.status] || "gray"} variant="light">
                                                        {STATUS_LABEL[m.status] || m.status}
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Stack spacing={4}>
                                                <InfoRow label="النادي" value={m.club?.name} />
                                                <InfoRow label="الفريق" value={m.team?.name} />
                                                {m.class && <InfoRow label="الفئة" value={CLASS_LABEL[m.class] || m.class} />}
                                                {m.classification && <InfoRow label="النشاط" value={m.classification} />}
                                                {m.occupation && <InfoRow label="المهنة/الوظيفة" value={m.occupation} />}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    </Col>

                    {assemblies.length > 0 && (
                        <Col xs={12}>
                            <Card withBorder radius="md" p="lg">
                                <Group position="apart" mb="md">
                                    <Text weight={700}>الجمعية العمومية</Text>
                                    <Id size={18} color="#94A3B8" />
                                </Group>
                                <Stack spacing="sm">
                                    {assemblies.map((a: any) => (
                                        <Group key={a.id} position="apart">
                                            <Text size="sm">رقم العضوية: {a.membership_number || "—"}</Text>
                                            <Text size="sm" color="dimmed">تاريخ الاشتراك: {a.subscription_date || "—"}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Card>
                        </Col>
                    )}

                    <Col xs={12}>
                        <Card withBorder radius="md" p="lg">
                            <Group position="apart" mb="md">
                                <Group spacing="xs">
                                    <Coin size={18} color="#94A3B8" />
                                    <Text weight={700}>مصروفاتي ودفعاتي</Text>
                                </Group>
                                <Badge size="lg" color="green" variant="light">
                                    الإجمالي: {totalPaid.toLocaleString("en-US")} ر.ع
                                </Badge>
                            </Group>

                            {payLoading && payments.length === 0 ? (
                                <Stack align="center" py="md"><Loader size="sm" /></Stack>
                            ) : payments.length === 0 ? (
                                <Text color="dimmed" size="sm" align="center" py="md">
                                    لا توجد دفعات مسجّلة عليك حتى الآن
                                </Text>
                            ) : (
                                <Box sx={{ overflowX: "auto" }}>
                                    <Table striped highlightOnHover withBorder>
                                        <thead>
                                            <tr>
                                                <th>المبلغ</th>
                                                <th>التاريخ</th>
                                                <th>الفريق</th>
                                                <th>ملاحظة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <Text weight={700} color="green.7">
                                                            {(Number(p.amount) || 0).toLocaleString("en-US")} ر.ع
                                                        </Text>
                                                    </td>
                                                    <td>{p.payment_date || (p.createdAt ? String(p.createdAt).slice(0, 10) : "—")}</td>
                                                    <td>{p.team?.name || "—"}</td>
                                                    <td>{p.note || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Box>
                            )}
                        </Card>
                    </Col>
                </Grid>
            </Container>
        </Box>
    );
}
