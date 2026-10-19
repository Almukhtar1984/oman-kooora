import {
    Box,
    Button,
    Col,
    FileInput,
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
    Select,
} from "@mantine/core";
import {Calendar, Check, ChevronDown, X, Robot} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllBlog, AllMessagesSender, useAddBlog, useAddMessage, useAllTeams, useDraftNews} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput} from "@mantine/dates";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";

import {RichTextEditor, Link} from "@mantine/tiptap";

import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import {IconChevronDown} from "@tabler/icons-react";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddBlog = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {subject: "", short_description: ""}
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");

    // AI assist
    const [aiBrief, setAiBrief] = useState("");
    const [aiMode, setAiMode] = useState<string>("draft");
    const [aiLoading, setAiLoading] = useState(false);
    const [draftNews] = useDraftNews();

    const openRef = useRef<() => void>(null);
    const [createBlog] = useAddBlog();

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
        onUpdate: ({editor}) => setContent(editor.getHTML())
    });

    const onFormSubmit = ({subject, short_description}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        setLoading(true)
        createBlog({
            variables: {
                content: {
                    subject,
                    short_description,
                    description: content,
                    attachment: attachments,
                    status: "accepted",
                    id_club: idClub
                }
            },
            refetchQueries: [AllBlog],
            onCompleted: () => {
                closeModal();
                notyf.success("تم ارسال الرسالة")
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
                notyf.error("حدث خطأ أثناء إضافة المنشور");
            }
        })
    };

    const onGenerateAi = () => {
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
        if (!aiBrief.trim()) { notyf?.error("اكتب فكرة الخبر أولاً"); return; }
        setAiLoading(true);
        draftNews({
            variables: { content: { text: aiBrief.trim(), mode: aiMode, category: "news" } },
            onCompleted: (dataRes: any) => {
                setAiLoading(false);
                const d = dataRes?.draftNews;
                if (!d) { notyf?.error("تعذّر التوليد"); return; }
                setValues({ subject: d.subject || "", short_description: d.short_description || "" });
                const html = d.description ? `<p>${String(d.description).replace(/\n/g, "</p><p>")}</p>` : "";
                setContent(html);
                editor?.commands.setContent(html);
                notyf?.success("تم التوليد — راجع وعدّل ثم أرسل");
            },
            onError: ({ graphQLErrors }: any) => {
                setAiLoading(false);
                notyf?.error(graphQLErrors?.[0]?.message || "تعذّر التوليد (تأكد من تفعيل الذكاء الاصطناعي)");
            },
        });
    };

    const closeModal = () => {
        setLoading(false)
        setAttachments([])
        setContent("")
        setAiBrief("")
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Paper p="md" radius="md" withBorder bg="grape.0">
                                <Group spacing={8} mb={8}>
                                    <Robot size={18} />
                                    <Text weight={600} size="sm">مساعد الذكاء الاصطناعي</Text>
                                </Group>
                                <Textarea
                                    placeholder="اكتب فكرة الخبر أو النقاط، أو ألصق نصاً لإعادة صياغته…"
                                    minRows={2}
                                    autosize
                                    value={aiBrief}
                                    onChange={(e) => setAiBrief(e.currentTarget.value)}
                                />
                                <Group mt={10} position="apart">
                                    <Select
                                        size="xs"
                                        w={160}
                                        value={aiMode}
                                        onChange={(v) => setAiMode(v || "draft")}
                                        data={[
                                            { value: "draft", label: "صياغة من فكرة" },
                                            { value: "reformulate", label: "إعادة صياغة" },
                                            { value: "improve", label: "تحسين" },
                                        ]}
                                    />
                                    <Button
                                        size="xs"
                                        color="grape"
                                        loading={aiLoading}
                                        leftIcon={<Robot size={15} />}
                                        onClick={onGenerateAi}
                                    >
                                        توليد بالذكاء الاصطناعي
                                    </Button>
                                </Group>
                                <Text size="xs" color="dimmed" mt={6}>سيملأ الحقول تلقائياً — راجعها وعدّلها قبل الإرسال.</Text>
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
                        <Col span={12} >
                            <TextInput
                                label="وصف بسيط"
                                placeholder="وصف بسيط يظهر تحت العنوان"
                                withAsterisk
                                {...getInputProps("short_description")}
                            />
                        </Col>

                        <Col span={12}>
                            <Text component={"label"} >المحتوى</Text>
                            <RichTextEditor editor={editor} mih={200} >
                                <RichTextEditor.Toolbar sticky stickyOffset={60}>
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

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                المرفقات
                                {attachments && attachments?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={true}
                                onDrop={(file) => setAttachments(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};