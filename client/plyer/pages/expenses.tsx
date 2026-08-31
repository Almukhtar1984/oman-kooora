import { useTheme } from "@emotion/react";
import { Badge, Box, Container, Group, Loader, MantineTheme, Stack, Table, Text, Title } from "@mantine/core";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { usePlayerPayments } from "../graphql";
import useStore from "../store/useStore";

// The logged-in player's own payment ledger ("مصروفاتي"). Read-only — the club/
// team records the payments; the player only reviews what he has paid.
export default function Expenses() {
    const userData = useStore((state: any) => state.userData);
    const theme = useTheme() as MantineTheme;

    const [getPlayerPayments, { loading, data }] = usePlayerPayments();

    useEffect(() => {
        const idPlayer = userData?.person?.player?.id;
        if (idPlayer) {
            getPlayerPayments({ variables: { idPlayer }, fetchPolicy: "network-only" });
        }
    }, [userData, getPlayerPayments]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const account = data?.playerPayments;
    const payments: any[] = account?.payments || [];
    const total = Number(account?.totalPaid) || 0;

    return (
        <Box>
            <Head><title>مصروفاتي</title></Head>
            <Container size="lg" py="xl">
                <Group position="apart" align="flex-end" mb="lg">
                    <Box>
                        <Title order={3} color="#1E3A8A">مصروفاتي</Title>
                        <Text color="dimmed" size="sm">سجلّ الدفعات التي سجّلها النادي لك</Text>
                    </Box>
                    <Badge size="xl" color="green" variant="light">
                        الإجمالي: {total.toLocaleString("en-US")} ر.ع
                    </Badge>
                </Group>

                {loading ? (
                    <Stack align="center" py="xl"><Loader /></Stack>
                ) : payments.length === 0 ? (
                    <Text color="dimmed" align="center" py="xl">لا توجد دفعات مسجّلة بعد</Text>
                ) : (
                    <Table striped highlightOnHover withBorder>
                        <thead>
                            <tr>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>ملاحظة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <Text fw={700} color="green.7">
                                            {(Number(p.amount) || 0).toLocaleString("en-US")} ر.ع
                                        </Text>
                                    </td>
                                    <td>{p.payment_date || (p.createdAt ? String(p.createdAt).slice(0, 10) : "—")}</td>
                                    <td>{p.note || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Container>
        </Box>
    );
}
