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
    Stack,
    Text,
    Select,
} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMessagesSender, useAddMessage, useMessage, useUpdateMessage} from "../../graphql";
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

export const UpdateMessage = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm();
    const [logo, setLogo] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");

    const openRef = useRef<() => void>(null);
    const [updateMessage] = useUpdateMessage();
    const [getMessage] = useMessage();

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

    useEffect(() => {
        if (props.data && props.data !== "") {
            getMessage({
                variables: {id: props.data },
                onCompleted: ({message}) => {
                    setValues({
                        subject: message?.subject,
                        priority: message?.priority
                    })
                    setContent(message?.content)
                }
            })
        }
    }, [props.data, props.opened]);

    const onFormSubmit = ({subject, priority}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        setLoading(true)
        updateMessage({
            variables: {
                id: props.data,
                content: {
                    content: content,
                    subject,
                    logo: logo,
                    priority,
                    attachment: attachments
                }
            },
            refetchQueries: [AllMessagesSender],
            onCompleted: () => {
                closeModal();
                notyf.success("تم ارسال الرسالة")
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        setAttachments([])
        setLogo(null)
        setContent("")
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
                        <Col span={12} >
                            <TextInput
                                placeholder="الموضوع"
                                label="الموضوع"
                                withAsterisk
                                {...getInputProps("subject")}
                            />
                        </Col>

                        {content && content !== "" ?
                            <Col span={12}>
                                <Text component={"label"} >المحتوى</Text>
                                <RichTextEditor editor={editor} mih={120} >
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
                            : null
                        }

                        <Col span={6}>
                            <Select
                                label="الاولوية"
                                placeholder="اختر نوع الاولوية"
                                // rightSection={<IconChevronDown size="1rem" />}
                                rightSectionWidth={30}
                                withAsterisk
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={[
                                    {label: "عادي", value: "normal"},
                                    {label: "عاجل", value: "urgent"},
                                    {label: "عاجل جدا", value: "very_urgent"}
                                ]}
                                {...getInputProps("priority")}
                                clearable={true}
                            />
                        </Col>

                        <Col span={6} >
                            <FileInput
                                accept={"image/png, image/jpeg"}
                                multiple={false}
                                placeholder="الشعار"
                                label="الشعار"
                                withAsterisk
                                value={logo}
                                onChange={setLogo}
                            />
                        </Col>

                        {/*<Col span={4} >*/}
                        {/*    <FileInput*/}
                        {/*        accept={"image/png, image/jpeg"}*/}
                        {/*        multiple={false}*/}
                        {/*        placeholder="التوقيع"*/}
                        {/*        label="التوقيع"*/}
                        {/*        withAsterisk*/}
                        {/*    />*/}
                        {/*</Col>*/}

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                المرفقات
                                {logo && logo?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
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