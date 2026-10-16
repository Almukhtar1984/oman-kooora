import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    Box, Container, Group, Text, Title, Button, ThemeIcon, Paper, Stack,
    SegmentedControl, Select, Textarea, TextInput, Alert, Anchor, Divider,
} from "@mantine/core";
import {
    IconMail, IconRobot, IconAlertTriangle, IconCopy, IconCheck,
} from "@tabler/icons";
import { Notyf } from "notyf";
import { useDraftMessage, useAiSettings } from "../graphql";

const newNotyf = () => new Notyf({ duration: 4000, ripple: true, position: { x: "left", y: "bottom" } });

const RECIPIENTS = [
    { value: "club", label: "نادٍ" },
    { value: "team", label: "فريق" },
];
const TONES = [
    { value: "formal", label: "رسمية" },
    { value: "friendly", label: "ودّية" },
    { value: "firm", label: "حازمة" },
];

const MessageDraft = () => {
    const router = useRouter();
    const { data: settingsData } = useAiSettings();
    const [draftMessage, { loading: drafting }] = useDraftMessage();

    const [recipientType, setRecipientType] = useState("club");
    const [recipientName, setRecipientName] = useState("");
    const [tone, setTone] = useState<string>("formal");
    const [brief, setBrief] = useState("");

    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [hasDraft, setHasDraft] = useState(false);
    const [copied, setCopied] = useState(false);

    const aiReady = settingsData?.aiSettings?.enabled;

    const onDraft = async () => {
        if (!brief.trim()) { newNotyf().open({ type: "error", message: "أدخل موضوع الرسالة أولًا" }); return; }
        setCopied(false);
        try {
            const res = await draftMessage({
                variables: { content: { brief: brief.trim(), tone, recipientType, recipientName: recipientName.trim() || undefined } },
            });
            const d = res?.data?.draftMessage;
            if (!d) throw new Error("لم تُرجَع رسالة");
            setSubject(d.subject || "");
            setContent(d.content || "");
            setHasDraft(true);
            newNotyf().open({ type: "success", message: "تم التوليد — راجع وعدّل ثم انسخ" });
        } catch (e: any) {
            newNotyf().open({ type: "error", message: e?.message || "تعذّر التوليد" });
        }
    };

    const onCopy = async () => {
        const text = `${subject}\n\n${content}`.trim();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            newNotyf().open({ type: "success", message: "تم نسخ الرسالة" });
            setTimeout(() => setCopied(false), 2500);
        } catch {
            newNotyf().open({ type: "error", message: "تعذّر النسخ — انسخها يدويًا" });
        }
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>صياغة الرسائل</title></Head>
            <Container size="md" py="xl">
                <Group spacing={12} mb="md">
                    <ThemeIcon size={42} radius="md" variant="light" color="grape"><IconMail size={26} /></ThemeIcon>
                    <Box>
                        <Title order={2} color="gray.8">صياغة الرسائل</Title>
                        <Text color="gray.6" size="sm">دع الذكاء الاصطناعي يصوغ رسالة رسمية إلى نادٍ أو فريق، ثم انسخها وأرسلها.</Text>
                    </Box>
                </Group>

                {!aiReady && (
                    <Alert icon={<IconAlertTriangle size={18} />} color="orange" variant="light" radius="md" mb="md">
                        <Text size="sm">
                            ميزة الذكاء الاصطناعي غير مفعّلة. فعّلها واربط مزوّدًا من{" "}
                            <Anchor color="grape" onClick={() => router.push("/ai")} sx={{ cursor: "pointer" }}>صفحة الربط</Anchor>.
                        </Text>
                    </Alert>
                )}

                <Paper p="lg" radius="md" withBorder mb="md">
                    <Group grow mb="sm" align="flex-start">
                        <Box>
                            <Text size="sm" weight={600} color="gray.7" mb={6}>المرسَل إليه</Text>
                            <SegmentedControl fullWidth radius="md" color="grape" value={recipientType} onChange={setRecipientType} data={RECIPIENTS} />
                        </Box>
                        <Box>
                            <Text size="sm" weight={600} color="gray.7" mb={6}>النبرة</Text>
                            <Select radius="md" data={TONES} value={tone} onChange={(v) => setTone(v || "formal")} />
                        </Box>
                    </Group>
                    <TextInput
                        label="اسم الجهة (اختياري)"
                        placeholder={recipientType === "club" ? "مثال: نادي النصر" : "مثال: فريق الشباب"}
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.currentTarget.value)}
                        mb="sm"
                    />
                    <Textarea
                        label="موضوع الرسالة / النقاط"
                        description="اذكر الغرض والعناصر الأساسية — لن يُضاف أي تفصيل غير مذكور."
                        placeholder="مثال: دعوة لحضور اجتماع الجمعية العمومية يوم الخميس القادم في مقر الاتحاد…"
                        minRows={4} autosize
                        value={brief}
                        onChange={(e) => setBrief(e.currentTarget.value)}
                    />
                    <Group position="right" mt="md">
                        <Button
                            color="grape" radius="md"
                            leftIcon={<IconRobot size={18} />}
                            loading={drafting}
                            disabled={!aiReady || !brief.trim()}
                            onClick={onDraft}
                        >
                            توليد بالذكاء الاصطناعي
                        </Button>
                    </Group>
                </Paper>

                {hasDraft && (
                    <Paper p="lg" radius="md" withBorder>
                        <Text weight={700} color="gray.8" mb="sm">الرسالة — راجع وعدّل</Text>
                        <Stack spacing="sm">
                            <TextInput label="العنوان" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} maxLength={255} />
                            <Textarea label="نص الرسالة" value={content} onChange={(e) => setContent(e.currentTarget.value)} minRows={7} autosize maxLength={500} />
                        </Stack>
                        <Divider my="md" />
                        <Group position="right">
                            <Button
                                color={copied ? "teal" : "grape"} radius="md"
                                leftIcon={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                onClick={onCopy}
                            >
                                {copied ? "تم النسخ" : "نسخ الرسالة"}
                            </Button>
                        </Group>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default MessageDraft;
