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
    Select, Avatar,
} from "@mantine/core";
import {Calendar, Check, ChevronDown, Download, Printer, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMessagesSender, useAddMessage, useMessage} from "../../graphql";
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
import {RichTextBox} from "../RichTextEditor";
import { getImageUrl } from "../../lib/helpers/image";
import { printAttachment, printDocument } from "../../lib/helpers/print";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const ShowMessage = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const [content, setContent] = useState("");

    const [getMessage, {data: dataMessage}] = useMessage();

    useEffect(() => {
        if (props.data && props.data !== "") {
            getMessage({
                variables: {id: props.data },
                onCompleted: ({message}) => {
                    console.log(message)
                    setContent(message?.content)
                }
            })
        }
    }, [props.data, props.opened]);


    // Attachments are scans of the letter itself, so printing one straight from
    // the message saves downloading it first. Popups are the only way to hand a
    // cross-origin file to the print dialog, so say so when one is blocked.
    const popupBlocked = () =>
        new Notyf({position: {x: "right", y: "bottom"}}).error("المتصفح منع نافذة الطباعة، اسمح بالنوافذ المنبثقة لهذا الموقع");

    // The whole letter: heading, sender, date, body and every scanned page —
    // available on any message, including one that carries no attachment.
    const handlePrintMessage = () => {
        const msg = dataMessage?.message;
        if (!msg) return;

        const sender = msg?.club_sender?.name || msg?.team_sender?.name || "";
        const attachments = (msg?.attachment || []).map((item: any) => getImageUrl(item?.content));
        const isImage = (url: string) => /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);

        const opened = printDocument({
            title: msg?.subject || "رسالة",
            heading: msg?.subject || "رسالة",
            subtitle: sender ? `من: ${sender}` : null,
            logoUrl: msg?.club_sender?.logo || msg?.team_sender?.logo
                ? getImageUrl(msg?.club_sender?.logo || msg?.team_sender?.logo)
                : null,
            fields: [
                {label: "التاريخ", value: msg?.createdAt ? String(msg.createdAt).slice(0, 10) : null},
                {label: "الجهة المرسلة", value: sender || null},
                {label: "الجهة المستقبلة", value: msg?.team_receiver?.name || null},
            ],
            bodyHtml: content || msg?.content || null,
            images: attachments.filter(isImage),
            files: attachments.filter((url: string) => !isImage(url)).map((url: string, i: number) => ({label: `مرفق ${i + 1}`, url})),
        });
        if (!opened) popupBlocked();
    };

    const handlePrint = (fileName: string) => {
        const opened = printAttachment(getImageUrl(fileName), dataMessage?.message?.subject || "طباعة المرفق");
        if (!opened) popupBlocked();
    };

    const closeModal = () => {
        setContent("")
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"left"}>
                        <Button leftIcon={<Printer size={16} />} onClick={handlePrintMessage} disabled={!dataMessage?.message}>
                            طباعة الرسالة
                        </Button>
                    </Group>
                </Box>
            }
        >

            <Box sx={({ colors }) => ({padding: 20})}>
                <Grid gutter={20}>
                    <Col span={12} >
                        <Text size={"md"} fw={"bold"} mb={20}>
                            الموضوع :
                            <Text ml={5} span={true} size={"lg"} fw={400}>
                                {dataMessage?.message?.subject}
                            </Text>
                        </Text>
                    </Col>

                    {content && content !== "" ?
                        <Col span={12}>
                            <Text component={"label"} >المحتوى :</Text>
                            <RichTextBox content={content} />
                        </Col>
                        : null
                    }

                    <Col span={12} >
                        {dataMessage?.message?.club
                            ? <Button component={"a"} target={"_blank"} href={getImageUrl(dataMessage?.message?.club_sender?.logo)} >
                                الشعار
                            </Button>
                            : dataMessage?.message?.team
                                ? <Button component={"a"} target={"_blank"} href={getImageUrl(dataMessage?.message?.team_sender?.logo)} >
                                    الشعار
                                </Button>
                                : null
                        }
                    </Col>

                    {dataMessage?.message?.attachment && dataMessage?.message?.attachment.length  > 0 ?
                        <Col span={12} >
                            <Group spacing={10}>
                                {dataMessage?.message?.attachment?.map((item: any) => (
                                    <Button.Group key={item?.id}>
                                        <Button component={"a"} target={"_blank"} href={getImageUrl(item.content)} leftIcon={<Download size={16} />} >
                                            تحميل
                                        </Button>
                                        <Button
                                            variant={"light"}
                                            leftIcon={<Printer size={16} />}
                                            onClick={() => handlePrint(item?.content)}
                                        >
                                            طباعة
                                        </Button>
                                    </Button.Group>
                                ))}
                            </Group>
                        </Col>
                        : null
                    }
                </Grid>
            </Box>
        </Modal>
    );
};