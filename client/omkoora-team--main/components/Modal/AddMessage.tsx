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
    Select, Alert,
} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMessagesSender, useAddMessage, useAllTeams} from "../../graphql";
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
export const AddMessage = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm();
    const [logo, setLogo] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [teams, setTeams] = useState<{label: string; value: string;}[]>([]);

    const [getAllTeam, {data: dataAllTeams }] = useAllTeams();
    const openRef = useRef<() => void>(null);
    const [createMessage] = useAddMessage();

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
        if (userData?.person?.member?.team?.club?.id) {
            const idClub = userData?.person?.member?.team?.club?.id;
            const idTeam = userData?.person?.member?.team?.id;
            getAllTeam({
                variables: {idClub},
                onCompleted: ({allTeam}) => {
                    let listTeam: any = []
                    allTeam.map((item: any) => {
                        listTeam.push({label: item.name, value: item.id, disabled: item.id === idTeam})
                    })

                    setTeams(listTeam)
                }
            })
        }
    }, [userData])

    useEffect(() => {
        if (props.data && typeof props.data === "object" && "person" in props.data && props.data.person) {
            const {person} = props.data

            setValues({
                first_name:     person?.first_name,
                second_name:    person?.second_name,
                third_name:     person?.third_name,
                tribe:          person?.tribe,

                date_birth:     new Date(person?.date_birth),
                card_number:    person?.card_number,
                phone:          person?.phone,
                type:           null,
                membership_date: null,
                gender:         null,
                subscription_date:     null
            })
        }
    }, [props.data, props.opened]);

    const onFormSubmit = ({subject, priority, id_team_receiver}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idTeam = userData?.person?.member?.team?.id

        setLoading(true)
        createMessage({
            variables: {
                content: {
                    content: content,
                    subject,
                    priority,
                    attachment: attachments,
                    id_club_sender: "",
                    id_team_receiver,
                    id_team_sender: userData?.person?.member?.team?.id
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

            <Alert color={"yellow"} >
                أذا لم تختار فريق سيتم ارسالها الى النادي
            </Alert>

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
                            <Select
                                label="الفريق المرسل اليه"
                                placeholder="اختر الفريق المرسل اليهة"
                                // rightSection={<IconChevronDown size="1rem" />}
                                rightSectionWidth={30}
                                withAsterisk
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={teams}
                                {...getInputProps("id_team_receiver")}
                                clearable={true}
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