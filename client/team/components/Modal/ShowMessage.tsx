import {apiUrl} from "../../lib/config";
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
                    setContent(message?.content)
                }
            })
        }
    }, [props.data, props.opened, getMessage]);


    const closeModal = () => {
        setContent("")
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<Box py={16} px={20} bg="slate.0" />}
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
                            ? <Button component={"a"} target={"_blank"} href={dataMessage?.message?.club_sender?.logo} >
                                الشعار
                            </Button>
                            : dataMessage?.message?.team
                                ? <Button component={"a"} target={"_blank"} href={dataMessage?.message?.team_sender?.logo} >
                                    الشعار
                                </Button>
                                : null
                        }
                    </Col>

                    {dataMessage?.message?.attachment && dataMessage?.message?.attachment.length  > 0 ?
                        <Col span={12} >
                            <Group spacing={10}>
                                {dataMessage?.message?.attachment?.map((item: any) => (
                                    <Button key={item?.id} component={"a"} target={"_blank"} rel="noopener noreferrer" href={`${apiUrl}/files/${item.content}`} >
                                        تحميل
                                    </Button>
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
