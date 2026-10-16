import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    Box, Container, Group, Text, Title, Button, ThemeIcon, Paper, Stack,
    SegmentedControl, Select, Textarea, TextInput, Alert, Anchor, Divider, Badge,
} from "@mantine/core";
import {
    IconFilePencil, IconRobot, IconAlertTriangle, IconDeviceFloppy,
    IconSend, IconCircleCheck,
} from "@tabler/icons";
import { Notyf } from "notyf";
import { useDraftNews, useCreateBlog, useAiSettings } from "../graphql";

const newNotyf = () => new Notyf({ duration: 4000, ripple: true, position: { x: "left", y: "bottom" } });

const MODES = [
    { value: "draft", label: "صياغة من فكرة" },
    { value: "reformulate", label: "إعادة صياغة" },
    { value: "improve", label: "تحسين" },
];
const CATEGORIES = [
    { value: "news", label: "أخبار" },
    { value: "competitions", label: "مسابقات" },
    { value: "players", label: "لاعبين" },
    { value: "clubs", label: "أندية" },
];
const MODE_HINT: Record<string, string> = {
    draft: "اكتب فكرة أو نقاطًا، وسيصوغها الذكاء الاصطناعي خبرًا متكاملًا.",
    reformulate: "ألصق نصًّا موجودًا ليُعاد صياغته بأسلوب صحفي مع الحفاظ على الوقائع.",
    improve: "ألصق نصًّا ليُحسَّن لغويًا وأسلوبيًا مع إبقاء المعنى كما هو.",
};

const NewsEditor = () => {
    const router = useRouter();
    const { data: settingsData } = useAiSettings();
    const [draftNews, { loading: drafting }] = useDraftNews();
    const [createBlog, { loading: saving }] = useCreateBlog();

    const [mode, setMode] = useState("draft");
    const [category, setCategory] = useState<string>("news");
    const [source, setSource] = useState("");

    const [subject, setSubject] = useState("");
    const [shortDesc, setShortDesc] = useState("");
    const [description, setDescription] = useState("");
    const [hasDraft, setHasDraft] = useState(false);
    const [savedAs, setSavedAs] = useState<"accepted" | "waiting" | null>(null);

    const aiReady = settingsData?.aiSettings?.enabled;

    const onDraft = async () => {
        if (!source.trim()) { newNotyf().open({ type: "error", message: "أدخل النص أو الفكرة أولًا" }); return; }
        setSavedAs(null);
        try {
            const res = await draftNews({ variables: { content: { text: source.trim(), mode, category } } });
            const d = res?.data?.draftNews;
            if (!d) throw new Error("لم يُرجَع خبر");
            setSubject(d.subject || "");
            setShortDesc(d.short_description || "");
            setDescription(d.description || "");
            setHasDraft(true);
            newNotyf().open({ type: "success", message: "تم التوليد — راجع وعدّل ثم احفظ" });
        } catch (e: any) {
            newNotyf().open({ type: "error", message: e?.message || "تعذّر التوليد" });
        }
    };

    const onSave = async (status: "waiting" | "accepted") => {
        if (!subject.trim() || !shortDesc.trim()) {
            newNotyf().open({ type: "error", message: "العنوان والمقدّمة مطلوبان" });
            return;
        }
        try {
            await createBlog({
                variables: {
                    content: {
                        subject: subject.trim(),
                        short_description: shortDesc.trim(),
                        description: description.trim(),
                        status,
                        category,
                        author_name: "محرّر طموح الذكي",
                    },
                },
            });
            setSavedAs(status);
            newNotyf().open({ type: "success", message: status === "accepted" ? "تم نشر الخبر" : "تم الحفظ كمسودة" });
        } catch (e: any) {
            newNotyf().open({ type: "error", message: e?.message || "فشل الحفظ" });
        }
    };

    const resetForNew = () => {
        setSource(""); setSubject(""); setShortDesc(""); setDescription("");
        setHasDraft(false); setSavedAs(null);
    };

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>محرّر الأخبار الذكي</title></Head>
            <Container size="md" py="xl">
                <Group spacing={12} mb="md">
                    <ThemeIcon size={42} radius="md" variant="light" color="grape"><IconFilePencil size={26} /></ThemeIcon>
                    <Box>
                        <Title order={2} color="gray.8">محرّر الأخبار الذكي</Title>
                        <Text color="gray.6" size="sm">صُغ خبرًا من فكرة، أو أعد صياغة نص موجود، ثم انشره في موجز الأخبار.</Text>
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

                {/* Source + controls */}
                <Paper p="lg" radius="md" withBorder mb="md">
                    <Group grow mb="sm">
                        <Box>
                            <Text size="sm" weight={600} color="gray.7" mb={6}>الوضع</Text>
                            <SegmentedControl fullWidth radius="md" color="grape" value={mode} onChange={setMode} data={MODES} />
                        </Box>
                        <Box>
                            <Text size="sm" weight={600} color="gray.7" mb={6}>التصنيف</Text>
                            <Select radius="md" data={CATEGORIES} value={category} onChange={(v) => setCategory(v || "news")} />
                        </Box>
                    </Group>
                    <Textarea
                        label={mode === "draft" ? "الفكرة / العناصر" : "النص المصدر"}
                        description={MODE_HINT[mode]}
                        placeholder={mode === "draft" ? "مثال: فاز النصر على السيب 3-1 في النهائي، سجّل سالم هدفين…" : "ألصق النص هنا…"}
                        minRows={5} autosize
                        value={source}
                        onChange={(e) => setSource(e.currentTarget.value)}
                    />
                    <Group position="right" mt="md">
                        <Button
                            color="grape" radius="md"
                            leftIcon={<IconRobot size={18} />}
                            loading={drafting}
                            disabled={!aiReady || !source.trim()}
                            onClick={onDraft}
                        >
                            توليد بالذكاء الاصطناعي
                        </Button>
                    </Group>
                </Paper>

                {/* Editable draft */}
                {hasDraft && (
                    <Paper p="lg" radius="md" withBorder>
                        <Group position="apart" mb="sm">
                            <Text weight={700} color="gray.8">الخبر — راجع وعدّل</Text>
                            {savedAs && (savedAs === "accepted"
                                ? <Badge color="teal" variant="light" leftSection={<IconCircleCheck size={12} />}>منشور</Badge>
                                : <Badge color="orange" variant="light">محفوظ كمسودة</Badge>)}
                        </Group>
                        <Stack spacing="sm">
                            <TextInput label="العنوان" value={subject} onChange={(e) => setSubject(e.currentTarget.value)} maxLength={255} />
                            <Textarea label="المقدّمة" value={shortDesc} onChange={(e) => setShortDesc(e.currentTarget.value)} minRows={2} autosize maxLength={255} />
                            <Textarea label="نص الخبر" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={6} autosize maxLength={1000} />
                        </Stack>
                        <Divider my="md" />
                        <Group position="apart">
                            <Button variant="subtle" color="gray" radius="md" onClick={resetForNew}>خبر جديد</Button>
                            <Group spacing="sm">
                                <Button variant="light" color="gray" radius="md" leftIcon={<IconDeviceFloppy size={16} />} loading={saving} onClick={() => onSave("waiting")}>
                                    حفظ كمسودة
                                </Button>
                                <Button color="teal" radius="md" leftIcon={<IconSend size={16} />} loading={saving} onClick={() => onSave("accepted")}>
                                    نشر
                                </Button>
                            </Group>
                        </Group>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default NewsEditor;
