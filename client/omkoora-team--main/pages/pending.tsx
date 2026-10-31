import { Badge, Box, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ChevronLeft } from "tabler-icons-react";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect } from "react";

import { useTeamPendingRequests } from "../graphql";
import DataState from "../components/Loading/DataState";
import useStore from "../store/useStore";

// بانتظارك: كل ما ينتظر الفريق في مكان واحد — كما «بانتظار قرارك» في النادي.
//
// الفريق كان يعرف أن عليه شيئاً حين يفتح التتبّع أو المدفوعات أو طلبات لاعبيه
// صفحةً صفحة: «لازم يروح يتتبّع حتى يشوف الطلب» (العميل). والعدّاد محسوب من
// العمل نفسه، فلا ينزل بفتح الصفحة — بل بالسداد والتعديل والردّ.

export default function Pending() {
    const { data, loading } = useTeamPendingRequests();

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const summary = data?.teamPendingRequests;
    const groups = summary?.groups || [];

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>بانتظارك</title></Head>
            <Container size="md" py="lg">
                <Group spacing={10} mb={4}>
                    <Title order={3} color="gray.8">بانتظارك</Title>
                    {summary?.total > 0 && (
                        <Badge color="orange" variant="filled" size="lg">{summary.total}</Badge>
                    )}
                </Group>
                <Text size="sm" color="gray.6" mb="lg">
                    كل ما ينتظر فريقك: رسومٌ تسدّدها، وطلبٌ أعاده النادي لتعدّله، وطلبات لاعبيك. العدّاد ينزل عند إنجاز الأمر، لا بمجرد فتح الصفحة.
                </Text>

                <DataState
                    loading={loading && !data}
                    empty={groups.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل ما ينتظرك"
                    emptyLabel="لا شيء ينتظر فريقك الآن"
                >
                    <Stack spacing="sm">
                        {groups.map((group: any) => (
                            <Link key={group.key} href={group.href} style={{ textDecoration: "none" }}>
                                <Paper
                                    p="md" radius="md" withBorder
                                    sx={(theme) => ({
                                        cursor: "pointer",
                                        "&:hover": { borderColor: theme.colors.blue[4], background: theme.colors.gray[0] },
                                    })}
                                >
                                    <Group position="apart" noWrap>
                                        <Group spacing={12} noWrap>
                                            <Badge color="orange" variant="filled" size="lg">{group.count}</Badge>
                                            <Text weight={600} color="gray.8">{group.label}</Text>
                                        </Group>
                                        <ChevronLeft size={18} />
                                    </Group>
                                </Paper>
                            </Link>
                        ))}
                    </Stack>
                </DataState>
            </Container>
        </Box>
    );
}
