import {
    Alert, Box, Button, Container, Group, NumberInput, Paper,
    Stack, Switch, Text, Title,
} from "@mantine/core";
import { AlertCircle, ArrowRight, Coin } from "tabler-icons-react";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Notyf } from "notyf";

import { useClubFees, useSaveClubFee } from "../graphql";
import DataState from "../components/Loading/DataState";

// أسعار الرسوم: النادي يسعّر خدماته بنفسه.
//
// السعر يختلف من نادٍ لنادٍ، ولذلك لا تُفرض من المنصة — «النادي يضبطها»، وهو
// ما طلبه المالك حرفياً. والخدمة غير المفعّلة لا يُطالب بها أحد.

type Draft = { amount: number; active: boolean };

export default function Fees() {
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [getFees, { data, loading }] = useClubFees();
    const [saveFee, { loading: saving }] = useSaveClubFee();

    useEffect(() => { getFees({ fetchPolicy: "cache-and-network" }); }, [getFees]);

    const fees = data?.clubFees || [];

    // النسخة المعروضة هي ما حُمّل، حتى يغيّره المستخدم.
    const draftOf = (fee: any): Draft =>
        drafts[fee.fee_type] || { amount: Number(fee.amount) || 0, active: Boolean(fee.active) };

    const edit = (fee: any, patch: Partial<Draft>) =>
        setDrafts((current) => ({ ...current, [fee.fee_type]: { ...draftOf(fee), ...patch } }));

    const changed = fees.filter((fee: any) => {
        const draft = drafts[fee.fee_type];
        if (!draft) return false;
        return draft.amount !== (Number(fee.amount) || 0) || draft.active !== Boolean(fee.active);
    });

    const notyf = () => new Notyf({ position: { x: "right", y: "bottom" } });

    const onSave = async () => {
        try {
            await Promise.all(changed.map((fee: any) => saveFee({
                variables: {
                    fee_type: fee.fee_type,
                    amount: draftOf(fee).amount,
                    active: draftOf(fee).active,
                },
            })));
            setDrafts({});
            await getFees({ fetchPolicy: "network-only" });
            notyf().success("تم حفظ الأسعار");
        } catch (error: any) {
            notyf().error(error?.message || "تعذّر حفظ الأسعار");
        }
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>أسعار الرسوم</title></Head>
            <Container size="md" py="lg">
                <Group position="apart" align="flex-end" mb="md">
                    <Box>
                        <Group spacing={10}>
                            <Coin size={22} />
                            <Title order={3} color="gray.8">أسعار الرسوم</Title>
                        </Group>
                        <Text size="sm" color="gray.6">
                            أسعار ناديك أنت — تحدّدها كما تشاء، والخدمة غير المفعّلة لا يُطالب بها الفريق.
                        </Text>
                    </Box>
                    <Link href="/payments" style={{ textDecoration: "none" }}>
                        <Button variant="subtle" rightIcon={<ArrowRight size={16} />}>المدفوعات</Button>
                    </Link>
                </Group>

                <DataState
                    loading={loading && !data}
                    empty={fees.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل الأسعار"
                    emptyLabel="لا توجد أنواع رسوم"
                >
                    <Stack spacing="sm">
                        {fees.map((fee: any) => {
                            const draft = draftOf(fee);
                            return (
                                <Paper key={fee.fee_type} p="md" radius="md" withBorder>
                                    <Group position="apart" noWrap align="center">
                                        <Box sx={{ flex: 1 }}>
                                            <Text weight={600} color="gray.8">{fee.label}</Text>
                                            <Text size="xs" color="gray.6">
                                                {draft.active
                                                    ? `يُطالب الفريق بـ ${draft.amount.toLocaleString("en-US")} ر.ع عند هذا الطلب`
                                                    : "لا رسوم على هذا الطلب"}
                                            </Text>
                                        </Box>
                                        <Group spacing="md" noWrap>
                                            <NumberInput
                                                w={150}
                                                min={0}
                                                precision={2}
                                                step={1}
                                                hideControls
                                                value={draft.amount}
                                                onChange={(value) => edit(fee, { amount: Number(value) || 0 })}
                                                rightSection={<Text size="xs" color="gray.5" pr={8}>ر.ع</Text>}
                                                disabled={!draft.active}
                                            />
                                            <Switch
                                                checked={draft.active}
                                                onChange={(event) => edit(fee, { active: event.currentTarget.checked })}
                                                // الحالة مكتوبة لا مستنتجة من وضع المفتاح.
                                                label={draft.active ? "مفعّل" : "موقوف"}
                                            />
                                        </Group>
                                    </Group>
                                </Paper>
                            );
                        })}
                    </Stack>
                </DataState>

                <Alert icon={<AlertCircle size={16} />} color="blue" variant="light" mt="md">
                    الدفع كامل لا مجزّأ، والفريق يرفع صورة الإيصال مع الرقم المرجعي للتحويل — ثم تعتمده أنت.
                </Alert>

                <Group position="left" mt="md">
                    <Button
                        loading={saving}
                        disabled={changed.length === 0}
                        onClick={onSave}
                    >
                        {changed.length > 0 ? `حفظ ${changed.length} تغيير` : "حفظ الأسعار"}
                    </Button>
                </Group>
            </Container>
        </Box>
    );
}
