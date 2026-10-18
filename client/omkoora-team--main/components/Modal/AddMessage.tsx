import {
    ActionIcon,
    Box,
    Button,
    Col,
    Grid,
    Group,
    Loader,
    Overlay,
    TextInput,
    Textarea,
    Paper,
    Divider,
    Stack,
    Text,
    Select, Alert,
} from "@mantine/core";
import {Check, Paperclip, Trash, X, Robot} from "tabler-icons-react";
import React, {useEffect, useMemo, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMessagesSender, useAddMessage, useAllTeams, useDraftMessage} from "../../graphql";
import useStore from "../../store/useStore";
import {
    Dropzone,
    FileRejection,
    MS_EXCEL_MIME_TYPE,
    MS_POWERPOINT_MIME_TYPE,
    MS_WORD_MIME_TYPE,
    PDF_MIME_TYPE,
} from "@mantine/dropzone";
import {Notyf} from "notyf";

import {RichTextEditor, Link} from "@mantine/tiptap";

import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

// Only the extensions createMessage stores (see Resolvers/Message.mjs) — the
// backend rejects anything else after the message row is already created.
const ATTACHMENT_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "video/mp4",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
    ...PDF_MIME_TYPE,
    ...MS_WORD_MIME_TYPE,
    ...MS_EXCEL_MIME_TYPE,
    ...MS_POWERPOINT_MIME_TYPE,
];
const MAX_ATTACHMENT_SIZE = 10 * 1024 ** 2; // graphqlUploadExpress maxFileSize

const PRIORITIES = [
    {label: "عادي", value: "normal"},
    {label: "عاجل", value: "urgent"},
    {label: "عاجل جدا", value: "very_urgent"}
];

const initialValues = {
    subject: "",
    priority: null as string | null,
    id_team_receiver: null as string | null,
};

export const AddMessage = ({data, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const idClub = userData?.person?.member?.team?.club?.id;
    const idTeam = userData?.person?.member?.team?.id;
    const {getInputProps, reset, onSubmit, setFieldValue} = useForm({
        initialValues,
        validate: {
            subject: (value) => (value?.trim() ? null : "الموضوع مطلوب"),
            priority: (value) => (value ? null : "اختر الاولوية"),
        },
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");

    // AI assist
    const [aiBrief, setAiBrief] = useState("");
    const [aiTone, setAiTone] = useState<string>("formal");
    const [aiLoading, setAiLoading] = useState(false);
    const [draftMessage] = useDraftMessage();

    const openRef = useRef<() => void>(null);
    const [createMessage] = useAddMessage();
    const [getAllTeam, {data: dataAllTeams, loading: loadingTeams}] = useAllTeams();

    useEffect(() => {
        if (idClub) getAllTeam({variables: {idClub}});
    }, [idClub]);

    // Read the list straight from the query result: a per-call onCompleted is
    // skipped when Apollo answers from cache, which left the dropdown empty
    // (and an empty Mantine Select never opens).
    const teams = useMemo(
        () => (dataAllTeams?.allTeam || []).map((item: any) => ({
            label: item.name,
            value: item.id,
            disabled: item.id === idTeam,
        })),
        [dataAllTeams, idTeam]
    );

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Superscript,
            SubScript,
            Highlight,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content,
        onUpdate: ({editor}) => setContent(editor.isEmpty ? "" : editor.getHTML())
    });

    const onFormSubmit = ({subject, priority, id_team_receiver}: typeof initialValues) => {
        if (loading) return;
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        setLoading(true)
        createMessage({
            variables: {
                content: {
                    content: content,
                    subject: subject.trim(),
                    priority: priority as string,
                    attachment: attachments,
                    id_club_sender: "",
                    id_team_receiver,
                    id_team_sender: idTeam
                }
            },
            refetchQueries: [AllMessagesSender],
            onCompleted: () => {
                closeModal();
                notyf.success("تم ارسال الرسالة")
            },
            onError: () => {
                setLoading(false)
                notyf.error("حدث خطأ أثناء إرسال الرسالة");
            }
        })
    };

    const onGenerateAi = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!aiBrief.trim()) { notyf.error("اكتب موضوع الرسالة أولاً"); return; }
        setAiLoading(true);
        draftMessage({
            variables: { content: { brief: aiBrief.trim(), tone: aiTone, recipientType: "club" } },
            onCompleted: (dataRes: any) => {
                setAiLoading(false);
                const d = dataRes?.draftMessage;
                if (!d) { notyf.error("تعذّر التوليد"); return; }
                setFieldValue("subject", d.subject || "");
                const html = d.content ? `<p>${String(d.content).replace(/\n/g, "</p><p>")}</p>` : "";
                setContent(html);
                editor?.commands.setContent(html);
                notyf.success("تم التوليد — راجع وعدّل ثم أرسل");
            },
            onError: ({ graphQLErrors }: any) => {
                setAiLoading(false);
                notyf.error(graphQLErrors?.[0]?.message || "تعذّر التوليد (تأكد من تفعيل الذكاء الاصطناعي)");
            },
        });
    };

    const onDrop = (files: File[]) => setAttachments((current) => [...current, ...files]);

    const onReject = (rejections: FileRejection[]) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const names = rejections.map(({file}) => file.name).join("، ");
        notyf.error(`لم يتم إرفاق: ${names} (الأنواع المسموحة: صور PNG/JPG، PDF، Word، Excel، PowerPoint، CSV، ZIP، MP4 — حتى 10MB)`);
    };

    const removeAttachment = (index: number) =>
        setAttachments((current) => current.filter((_, i) => i !== index));

    const closeModal = () => {
        setLoading(false)
        setAttachments([])
        setContent("")
        setAiBrief("")
        editor?.commands.clearContent()
        reset();
        props.onClose();
    };

    const selectProps = {
        withinPortal: true,
        clearable: true,
        maxDropdownHeight: 240,
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form" loading={loading} disabled={loading}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>جاري إرسال الرسالة يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Alert color={"yellow"} >
                إذا لم تختر فريقاً سيتم إرسال الرسالة إلى النادي
            </Alert>

            <Box sx={() => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Paper p="md" radius="md" withBorder bg="grape.0">
                                <Group spacing={8} mb={8}>
                                    <Robot size={18} />
                                    <Text weight={600} size="sm">صياغة بالذكاء الاصطناعي</Text>
                                </Group>
                                <Textarea
                                    placeholder="اكتب موضوع الرسالة ونقاطها، ودع الذكاء الاصطناعي يصوغها رسمياً…"
                                    minRows={2}
                                    autosize
                                    value={aiBrief}
                                    onChange={(e) => setAiBrief(e.currentTarget.value)}
                                />
                                <Group mt={10} position="apart">
                                    <Select
                                        size="xs"
                                        w={140}
                                        withinPortal
                                        value={aiTone}
                                        onChange={(v) => setAiTone(v || "formal")}
                                        data={[
                                            { value: "formal", label: "رسمية" },
                                            { value: "friendly", label: "ودّية" },
                                            { value: "firm", label: "حازمة" },
                                        ]}
                                    />
                                    <Button
                                        size="xs"
                                        color="grape"
                                        loading={aiLoading}
                                        leftIcon={<Robot size={15} />}
                                        onClick={onGenerateAi}
                                    >
                                        صياغة بالذكاء الاصطناعي
                                    </Button>
                                </Group>
                                <Text size="xs" color="dimmed" mt={6}>سيملأ العنوان والمحتوى — راجعهما قبل الإرسال.</Text>
                            </Paper>
                            <Divider my="md" label="أو أدخلها يدوياً" labelPosition="center" />
                        </Col>
                        <Col span={12} >
                            <TextInput
                                placeholder="الموضوع"
                                label="الموضوع"
                                withAsterisk
                                {...getInputProps("subject")}
                            />
                        </Col>

                        <Col span={12}>
                            <Text component={"label"} >المحتوى</Text>
                            <RichTextEditor editor={editor} mih={120} >
                                <RichTextEditor.Toolbar>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Bold />
                                        <RichTextEditor.Italic />
                                        <RichTextEditor.Underline />
                                        <RichTextEditor.Strikethrough />
                                        <RichTextEditor.ClearFormatting />
                                        <RichTextEditor.Highlight />
                                        <RichTextEditor.Code />
                                    </RichTextEditor.ControlsGroup>

                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.H1 />
                                        <RichTextEditor.H2 />
                                        <RichTextEditor.H3 />
                                        <RichTextEditor.H4 />
                                    </RichTextEditor.ControlsGroup>

                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Blockquote />
                                        <RichTextEditor.Hr />
                                        <RichTextEditor.BulletList />
                                        <RichTextEditor.OrderedList />
                                        <RichTextEditor.Subscript />
                                        <RichTextEditor.Superscript />
                                    </RichTextEditor.ControlsGroup>

                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Link />
                                        <RichTextEditor.Unlink />
                                    </RichTextEditor.ControlsGroup>

                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.AlignLeft />
                                        <RichTextEditor.AlignCenter />
                                        <RichTextEditor.AlignJustify />
                                        <RichTextEditor.AlignRight />
                                    </RichTextEditor.ControlsGroup>
                                </RichTextEditor.Toolbar>
                                <RichTextEditor.Content />
                            </RichTextEditor>
                        </Col>

                        <Col xs={12} sm={6}>
                            <Select
                                {...selectProps}
                                withAsterisk
                                label="الاولوية"
                                placeholder="اختر نوع الاولوية"
                                data={PRIORITIES}
                                {...getInputProps("priority")}
                            />
                        </Col>

                        <Col xs={12} sm={6}>
                            <Select
                                {...selectProps}
                                searchable
                                label="الفريق المرسل اليه"
                                placeholder="اختر الفريق المرسل اليه"
                                data={teams}
                                nothingFound={loadingTeams ? "جاري تحميل الفرق..." : "لا توجد فرق أخرى في النادي"}
                                {...getInputProps("id_team_receiver")}
                            />
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                المرفقات
                                {attachments.length > 0 ? <Text color={"green"} span={true}> ({attachments.length}) </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={true}
                                onDrop={onDrop}
                                onReject={onReject}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={MAX_ATTACHMENT_SIZE}
                                accept={ATTACHMENT_MIME_TYPES}
                            >
                                <Group position="center">
                                    <Button onClick={() => openRef.current?.()}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>

                            {attachments.length > 0 ?
                                <Stack spacing={6} mt={10}>
                                    {attachments.map((file, index) => (
                                        <Group key={`${file.name}-${index}`} position="apart" noWrap data-attachment>
                                            <Group spacing={6} noWrap>
                                                <Paperclip size={16} />
                                                <Text size="sm">{file.name}</Text>
                                            </Group>
                                            <ActionIcon color="red" aria-label="حذف المرفق" onClick={() => removeAttachment(index)}>
                                                <Trash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    ))}
                                </Stack>
                                : null
                            }
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
