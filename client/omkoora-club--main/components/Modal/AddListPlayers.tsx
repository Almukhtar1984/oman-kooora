import { Alert, Box, Button, Group, List, Loader, Overlay, Stack, Text, ThemeIcon } from "@mantine/core";
import { Check, InfoCircle, X, Upload, FileSpreadsheet } from "tabler-icons-react";
import React, { useRef, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { Dropzone, MS_EXCEL_MIME_TYPE } from "@mantine/dropzone";
import { Notyf } from "notyf";
import { useUploadPlayersSheet } from "../../graphql";

type Props = {
    // team id (passed from the team card)
    data?: string;
} & ModalProps;

// Uploads the Excel FILE to the server (multipart, up to 10MB) and lets the
// backend parse it — no giant JSON payload, tolerant of missing fields.
export const AddListPlayers = ({ data, ...props }: Props) => {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const openRef = useRef<() => void>(null);
    const [uploadPlayersSheet, { loading }] = useUploadPlayersSheet();

    const closeModal = () => {
        setFile(null);
        setResult(null);
        setErrorMsg(null);
        props.onClose();
    };

    const onConfirm = async () => {
        setErrorMsg(null);
        setResult(null);
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!file) { setErrorMsg("يرجى اختيار ملف الإكسل أولاً"); return; }
        if (!data) { setErrorMsg("تعذّر تحديد الفريق"); return; }
        try {
            const res = await uploadPlayersSheet({ variables: { teamId: data, file } });
            const r = res?.data?.uploadPlayersSheet;
            setResult(r);
            notyf.success(`تم إضافة ${r?.created ?? r?.numberOfPersonCreated ?? 0} لاعب`);
        } catch (e: any) {
            const msg = e?.graphQLErrors?.[0]?.message || "فشل رفع الملف";
            setErrorMsg(msg);
            notyf.error(msg);
        }
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            title="إضافة لاعبين من إكسل"
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal} disabled={loading}>إغلاق</Button>
                        <Button rightIcon={<Check size={15} />} onClick={onConfirm} loading={loading} disabled={!file}>استيراد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ? (
                <Overlay opacity={0.9} color="#fff" zIndex={5}>
                    <Stack align="center" justify="center" h="100%" w="100%">
                        <Loader size="xl" variant="dots" />
                        <Text size="lg" fw={500}>جارٍ استيراد اللاعبين… قد يستغرق دقيقة للملفات الكبيرة</Text>
                    </Stack>
                </Overlay>
            ) : null}

            <Box p={20}>
                <Alert variant="light" color="cyan" icon={<InfoCircle />} mb="md">
                    يُرفع الملف ويُعالَج في الخادم مباشرة (حتى 10MB) — يقرأ حسب عناوين الأعمدة:
                    <Text size="sm" mt={6} weight={600}>الاسم · الرقم المدني · تاريخ الميلاد · رقم الهاتف</Text>
                    <Text size="xs" color="dimmed" mt={6}>يُقسَّم الاسم تلقائيًا، وتُتخطّى الصفوف المكرّرة (بالرقم المدني)، ولا يلزم اكتمال كل الحقول.</Text>
                </Alert>

                <Text size="sm" mb={10}>
                    ملف الإكسل
                    {file ? <Text color="green" span> — {file.name}</Text> : null}
                </Text>
                <Dropzone
                    openRef={openRef}
                    activateOnClick={false}
                    multiple={false}
                    onDrop={(files) => { setFile(files[0]); setResult(null); }}
                    styles={{ inner: { pointerEvents: "all" } }}
                    maxSize={20 * 1024 ** 2}
                    accept={MS_EXCEL_MIME_TYPE}
                    style={{ borderColor: file ? "green" : "#9ca3af", background: file ? "#0080002e" : "#fff" }}
                >
                    <Group position="center" py="md">
                        <Button leftIcon={<Upload size={16} />} onClick={() => (openRef.current ? openRef.current() : undefined)}>
                            اختر ملف / اسحب ملف إلى هنا
                        </Button>
                    </Group>
                </Dropzone>

                {errorMsg ? <Alert variant="light" color="red" icon={<X />} mt="md">{errorMsg}</Alert> : null}

                {result ? (
                    <Box mt="md" p="md" sx={({ colors, radius }) => ({ borderRadius: radius.md, border: "1px solid " + colors.green[2], background: colors.green[0] })}>
                        <Group spacing={8} mb={8}>
                            <ThemeIcon color="green" radius="xl" size={26}><Check size={16} /></ThemeIcon>
                            <Text weight={700} color="green.8">تمّ الاستيراد</Text>
                        </Group>
                        <List spacing={4} size="sm" center>
                            <List.Item icon={<ThemeIcon color="green" size={18} radius="xl"><FileSpreadsheet size={12} /></ThemeIcon>}>
                                تمت الإضافة: <b>{result.created ?? result.numberOfPersonCreated}</b> لاعب
                            </List.Item>
                            {typeof result.duplicates === "number" ? <List.Item>مكرّر (تم تخطّيه): <b>{result.duplicates}</b></List.Item> : null}
                            {result.failed ? <List.Item>تعذّر إدخال: <b>{result.failed}</b></List.Item> : null}
                            {typeof result.total === "number" ? <List.Item>إجمالي الصفوف: <b>{result.total}</b></List.Item> : null}
                        </List>
                        <Text size="xs" color="gray.6" mt={6}>انتقل إلى صفحة اللاعبين لمشاهدة القائمة.</Text>
                    </Box>
                ) : null}
            </Box>
        </Modal>
    );
};
