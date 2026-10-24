import { Badge, Box, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ChevronLeft } from "tabler-icons-react";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import { useClubPendingRequests } from "../graphql";
import DataState from "../components/Loading/DataState";

// الطلبات: كل ما ينتظر قرار النادي في مكان واحد.
//
// النادي كان يطارد عمله المعلّق عبر ست صفحات؛ ومع ٤٥ فريقاً يرسلون طلباتهم،
// ما لا يكون أمام عينيك يُنسى.

export default function Requests() {
    const { data, loading } = useClubPendingRequests();

    const summary = data?.clubPendingRequests;
    const groups = summary?.groups || [];

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>الطلبات</title></Head>
            <Container size="md" py="lg">
                <Group spacing={10} mb={4}>
                    <Title order={3} color="gray.8">الطلبات</Title>
                    {summary?.total > 0 && (
                        <Badge color="red" variant="filled" size="lg">{summary.total}</Badge>
                    )}
                </Group>
                <Text size="sm" color="gray.6" mb="lg">
                    كل ما يحتاج قراراً من النادي. العدّاد ينزل عند اتخاذ الإجراء على الطلب، لا بمجرد فتح الصفحة.
                </Text>

                <DataState
                    loading={loading && !data}
                    empty={groups.length === 0}
                    variant="rows"
                    loadingLabel="جارٍ تحميل الطلبات"
                    emptyLabel="لا توجد طلبات تنتظر قرارك"
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
                                            <Badge color="red" variant="filled" size="lg">{group.count}</Badge>
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
