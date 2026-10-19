import {
    Box, Button, Group, Text, Stack, Paper, Badge, Loader, Center, ThemeIcon,
} from "@mantine/core";
import { Robot, Ballpen } from "tabler-icons-react";
import React, { useEffect } from "react";
import { Notyf } from "notyf";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import { AllBlog, useAiMatchCandidates, useGenerateMatchNews } from "../../graphql";

type Props = {} & ModalProps;

const stateBadge = (s: string) => {
    if (s === "end") return <Badge size="sm" color="teal" variant="light">انتهت</Badge>;
    if (s === "playing") return <Badge size="sm" color="orange" variant="light">جارية</Badge>;
    return <Badge size="sm" color="gray" variant="light">لم تبدأ</Badge>;
};

export const GenerateMatchNewsModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const idTeam = userData?.person?.member?.team?.id;

    const [fetchCandidates, { data, loading }] = useAiMatchCandidates();
    const [generate, { loading: generating }] = useGenerateMatchNews();
    const [busyId, setBusyId] = React.useState<string | null>(null);

    useEffect(() => {
        if (props.opened && idTeam) fetchCandidates({ variables: { id_team: idTeam, limit: 20 } });
    }, [props.opened, idTeam]);

    const matches: any[] = data?.aiMatchCandidates || [];

    const onGenerate = (m: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        setBusyId(m.id);
        generate({
            variables: { id_match: m.id, id_team: idTeam },
            refetchQueries: [AllBlog],
            onCompleted: () => {
                setBusyId(null);
                notyf.success("تم توليد الخبر وحفظه كمسودة — سيراجعه النادي");
                props.onClose();
            },
            onError: ({ graphQLErrors }: any) => {
                setBusyId(null);
                notyf.error(graphQLErrors?.[0]?.message || "تعذّر توليد الخبر (تأكد من تفعيل الذكاء الاصطناعي)");
            },
        });
    };

    return (
        <Modal {...props}>
            <Box p={20}>
                <Group spacing={8} mb={6}>
                    <ThemeIcon size={32} radius="md" variant="light" color="grape"><Robot size={18} /></ThemeIcon>
                    <Box>
                        <Text weight={600}>توليد خبر مباراة</Text>
                        <Text size="xs" color="dimmed">اختر مباراة ليكتب الذكاء الاصطناعي خبر نتيجتها (يُحفظ كمسودة لمراجعة النادي).</Text>
                    </Box>
                </Group>

                {loading ? (
                    <Center py={40}><Loader variant="dots" /></Center>
                ) : matches.length === 0 ? (
                    <Center py={40}><Text color="dimmed">لا توجد مباريات متاحة بعد.</Text></Center>
                ) : (
                    <Stack spacing="xs" mt="md">
                        {matches.map((m) => (
                            <Paper key={m.id} p="sm" radius="md" withBorder>
                                <Group position="apart" noWrap>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Text size="sm" weight={600} lineClamp={1}>
                                            {m.teamA} <Text span color="grape" weight={700}>{m.goalsA} - {m.goalsB}</Text> {m.teamB}
                                        </Text>
                                        <Group spacing={6} mt={4}>
                                            {stateBadge(m.matchState)}
                                            {m.stage ? <Badge size="sm" color="grape" variant="outline">{m.stage}</Badge> : null}
                                            {m.date ? <Text size="xs" color="dimmed">{m.date}</Text> : null}
                                        </Group>
                                    </Box>
                                    <Button
                                        size="xs" color="grape" radius="md"
                                        leftIcon={<Ballpen size={14} />}
                                        loading={generating && busyId === m.id}
                                        disabled={generating}
                                        onClick={() => onGenerate(m)}
                                    >
                                        توليد خبر
                                    </Button>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Modal>
    );
};
