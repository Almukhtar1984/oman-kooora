import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import {
    Box, Container, Group, Text, Title, Button, ThemeIcon, Paper, Stack, Switch,
    SegmentedControl, PasswordInput, Select, Badge, Loader, Divider, Anchor, Alert,
} from "@mantine/core";
import {
    IconRobot, IconKey, IconRefresh, IconPlugConnected, IconDeviceFloppy,
    IconCircleCheck, IconAlertTriangle, IconInfoCircle, IconShieldLock,
} from "@tabler/icons";
import { Notyf } from "notyf";
import { useAiSettings, useAiAvailableModels, useSaveAiSettings, useTestAiConnection } from "../graphql";

type ProviderKey = "openai" | "gemini";

const PROVIDERS: Record<ProviderKey, { label: string; brand: string; color: string; keyUrl: string; keyHint: string }> = {
    openai: {
        label: "ChatGPT — OpenAI",
        brand: "OpenAI",
        color: "teal",
        keyUrl: "https://platform.openai.com/api-keys",
        keyHint: "يبدأ عادةً بـ sk-…",
    },
    gemini: {
        label: "Gemini — Google",
        brand: "Google Gemini",
        color: "indigo",
        keyUrl: "https://aistudio.google.com/app/apikey",
        keyHint: "من Google AI Studio",
    },
};

const newNotyf = () => new Notyf({ duration: 3500, ripple: true, position: { x: "left", y: "bottom" } });

const Ai = () => {
    const { data, loading, refetch } = useAiSettings();
    const settings = data?.aiSettings;

    const [provider, setProvider] = useState<ProviderKey>("gemini");
    const [enabled, setEnabled] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState<string>("");
    const [models, setModels] = useState<{ id: string; recommended?: boolean }[]>([]);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

    const [fetchModels, { loading: fetchingModels }] = useAiAvailableModels();
    const [saveSettings, { loading: saving }] = useSaveAiSettings();
    const [testConnection, { loading: testing }] = useTestAiConnection();

    const meta = PROVIDERS[provider];
    const storedModel = provider === "openai" ? settings?.openai_model : settings?.gemini_model;
    const hasStoredKey = provider === "openai" ? settings?.openai_has_key : settings?.gemini_has_key;

    // Sync local state from the server settings once they arrive / change.
    useEffect(() => {
        if (!settings) return;
        setProvider((settings.active_provider as ProviderKey) || "gemini");
        setEnabled(Boolean(settings.enabled));
    }, [settings]);

    // When the chosen provider changes, reset the per-provider fields.
    useEffect(() => {
        setApiKey("");
        setModel(storedModel || "");
        setModels([]);
        setTestResult(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider]);

    // The dropdown options: fetched models merged with the already-saved one, so
    // the current model is always visible even before a refresh.
    const modelOptions = useMemo(() => {
        const map = new Map<string, { value: string; label: string }>();
        for (const m of models) {
            map.set(m.id, { value: m.id, label: m.recommended ? `${m.id}  ⭐ موصى به` : m.id });
        }
        if (storedModel && !map.has(storedModel)) map.set(storedModel, { value: storedModel, label: storedModel });
        if (model && !map.has(model)) map.set(model, { value: model, label: model });
        return Array.from(map.values());
    }, [models, storedModel, model]);

    const onRefreshModels = async () => {
        setTestResult(null);
        try {
            const res = await fetchModels({ variables: { provider, apiKey: apiKey.trim() || undefined } });
            const list = res?.data?.aiAvailableModels || [];
            if (!list.length) {
                newNotyf().open({ type: "error", message: "لم يتم العثور على موديلات لهذا المزوّد" });
                return;
            }
            setModels(list);
            // Auto-pick the recommended model if none is chosen yet.
            if (!model) {
                const rec = list.find((m: any) => m.recommended) || list[0];
                setModel(rec.id);
            }
            newNotyf().open({ type: "success", message: `تم جلب ${list.length} موديل` });
        } catch (e: any) {
            newNotyf().open({ type: "error", message: e?.message || "تعذّر جلب الموديلات" });
        }
    };

    const onTest = async () => {
        setTestResult(null);
        try {
            const res = await testConnection({ variables: { provider, apiKey: apiKey.trim() || undefined } });
            const r = res?.data?.testAiConnection;
            setTestResult({ ok: !!r?.ok, message: r?.message || "" });
            if (r?.ok && Array.isArray(r.models) && r.models.length) {
                setModels(r.models);
                if (!model) {
                    const rec = r.models.find((m: any) => m.recommended) || r.models[0];
                    setModel(rec.id);
                }
            }
        } catch (e: any) {
            setTestResult({ ok: false, message: e?.message || "فشل الاختبار" });
        }
    };

    const onSave = async () => {
        try {
            await saveSettings({
                variables: {
                    content: {
                        active_provider: provider,
                        enabled,
                        provider,
                        apiKey: apiKey.trim() || undefined,  // omit → keep the stored key
                        model: model || undefined,
                    },
                },
            });
            newNotyf().open({ type: "success", message: "تم حفظ إعدادات الذكاء الاصطناعي" });
            setApiKey("");
            await refetch();
        } catch (e: any) {
            newNotyf().open({ type: "error", message: e?.message || "فشل الحفظ" });
        }
    };

    const canSave = Boolean(model) && (hasStoredKey || apiKey.trim().length > 0);

    return (
        <Box bg="gray.0" sx={{ minHeight: "100%" }}>
            <Head><title>ربط الذكاء الاصطناعي</title></Head>
            <Container size="sm" py="xl">
                {/* Header */}
                <Group spacing={12} mb={6}>
                    <ThemeIcon size={42} radius="md" variant="light" color="grape">
                        <IconRobot size={26} />
                    </ThemeIcon>
                    <Box>
                        <Title order={2} color="gray.8">ربط الذكاء الاصطناعي</Title>
                        <Text color="gray.6" size="sm">اربط المنصة بـ ChatGPT أو Gemini لصياغة الأخبار والرسائل وتوليد أخبار نتائج المباريات.</Text>
                    </Box>
                </Group>

                <Alert icon={<IconInfoCircle size={18} />} color="gray" variant="light" radius="md" mt="md" mb="lg">
                    <Text size="xs" color="gray.7">
                        التوليد يتم على خوادم المزوّد (طلب خارجي واحد) — لا يوجد أي حِمل على خادمنا، والتكلفة بسيطة وتُحسب بالاستخدام.
                        المفتاح يُخزَّن <b>مشفّرًا</b> ولا يظهر مجددًا بعد الحفظ.
                    </Text>
                </Alert>

                {loading && !settings ? (
                    <Group position="center" py={60}><Loader variant="dots" /></Group>
                ) : (
                    <Stack spacing="lg">
                        {/* Master enable */}
                        <Paper p="md" radius="md" withBorder>
                            <Group position="apart">
                                <Box>
                                    <Text weight={600} color="gray.8">تفعيل ميزة الذكاء الاصطناعي</Text>
                                    <Text size="xs" color="gray.6">عند الإيقاف لن تعمل أي ميزة توليد نصوص.</Text>
                                </Box>
                                <Switch
                                    size="lg" color="grape"
                                    checked={enabled}
                                    onChange={(e) => setEnabled(e.currentTarget.checked)}
                                />
                            </Group>
                        </Paper>

                        {/* Provider picker */}
                        <Box>
                            <Text weight={600} color="gray.8" mb={8}>المزوّد</Text>
                            <SegmentedControl
                                fullWidth radius="md" color={meta.color}
                                value={provider}
                                onChange={(v) => setProvider(v as ProviderKey)}
                                data={[
                                    { label: PROVIDERS.openai.label, value: "openai" },
                                    { label: PROVIDERS.gemini.label, value: "gemini" },
                                ]}
                            />
                        </Box>

                        {/* Provider config */}
                        <Paper p="lg" radius="md" withBorder>
                            <Group position="apart" mb="md">
                                <Group spacing={8}>
                                    <ThemeIcon size={30} radius="md" variant="light" color={meta.color}><IconKey size={18} /></ThemeIcon>
                                    <Text weight={600} color="gray.8">{meta.brand}</Text>
                                </Group>
                                {hasStoredKey
                                    ? <Badge color="teal" variant="light" leftSection={<IconShieldLock size={12} />}>مفتاح محفوظ</Badge>
                                    : <Badge color="gray" variant="light">لا يوجد مفتاح</Badge>}
                            </Group>

                            <PasswordInput
                                label="مفتاح الـAPI"
                                description={hasStoredKey ? "محفوظ مسبقًا — اتركه فارغًا للإبقاء على المفتاح الحالي" : meta.keyHint}
                                placeholder={hasStoredKey ? "••••••••••••  (لن يتغيّر ما لم تُدخل مفتاحًا جديدًا)" : "أدخل مفتاح الـAPI"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.currentTarget.value)}
                                autoComplete="off"
                            />
                            <Text size="xs" color="gray.6" mt={6}>
                                احصل على المفتاح من <Anchor href={meta.keyUrl} target="_blank" rel="noreferrer" color={meta.color}>{meta.keyUrl}</Anchor>
                            </Text>

                            <Group mt="md" spacing="sm">
                                <Button
                                    variant="light" color={meta.color} radius="md"
                                    leftIcon={<IconPlugConnected size={16} />}
                                    loading={testing}
                                    onClick={onTest}
                                    disabled={!hasStoredKey && !apiKey.trim()}
                                >
                                    اختبار الاتصال
                                </Button>
                                <Button
                                    variant="subtle" color={meta.color} radius="md"
                                    leftIcon={<IconRefresh size={16} />}
                                    loading={fetchingModels}
                                    onClick={onRefreshModels}
                                    disabled={!hasStoredKey && !apiKey.trim()}
                                >
                                    تحديث الموديلات
                                </Button>
                            </Group>

                            {testResult && (
                                <Alert
                                    mt="md" radius="md"
                                    color={testResult.ok ? "teal" : "red"}
                                    icon={testResult.ok ? <IconCircleCheck size={18} /> : <IconAlertTriangle size={18} />}
                                >
                                    <Text size="sm">{testResult.message}</Text>
                                </Alert>
                            )}

                            <Divider my="lg" label="الموديل" labelPosition="center" />

                            <Select
                                label="الموديل المستخدم للتوليد"
                                placeholder={modelOptions.length ? "اختر موديلًا" : "اضغط «تحديث الموديلات» لجلب القائمة"}
                                searchable creatable
                                getCreateLabel={(q) => `استخدام الموديل: ${q}`}
                                onCreate={(q) => { setModel(q); return { value: q, label: q }; }}
                                nothingFound="لا توجد موديلات — اضغط «تحديث الموديلات»"
                                data={modelOptions}
                                value={model || null}
                                onChange={(v) => setModel(v || "")}
                            />
                            <Text size="xs" color="gray.6" mt={6}>
                                القائمة تعرض أشهر الموديلات وأحدثها أولًا؛ الموصى به مُعلَّم بـ ⭐.
                            </Text>
                        </Paper>

                        {/* Save */}
                        <Group position="right">
                            <Button
                                size="md" radius="md" color="grape"
                                leftIcon={<IconDeviceFloppy size={18} />}
                                loading={saving}
                                onClick={onSave}
                                disabled={!canSave}
                            >
                                حفظ الإعدادات
                            </Button>
                        </Group>
                        {!canSave && (
                            <Text size="xs" color="gray.5" align="left" mt={-8}>
                                للحفظ: اختر موديلًا{!hasStoredKey ? " وأدخل مفتاح الـAPI" : ""}.
                            </Text>
                        )}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default Ai;
