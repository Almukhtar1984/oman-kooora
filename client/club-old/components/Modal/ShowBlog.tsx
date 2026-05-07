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
    Select, Avatar, Image, Title,
} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMessagesSender, useAddMessage, useBlog, useMessage} from "../../graphql";
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

export const ShowBlog = (props: Props) => {
    const userData = useStore((state: any) => state.userData);

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<Box py={16} px={20} bg="slate.0" />}
        >

            <Box sx={({ colors }) => ({padding: 20, paddingTop: 0})}>
                <Grid gutter={20}>
                    <Col span={12} >
                        <Title order={3} fw={"bold"} mb={20}>
                            {props?.data?.subject}
                        </Title>
                    </Col>

                    {props?.data?.attachment && props?.data?.attachment.length  > 0 ?
                        <Col span={12} >
                            <Group spacing={10}>
                                {props?.data?.attachment?.map((item: any) => (
                                    <Image
                                        key={item?.id}
                                        src={`${apiUrl}/images/${item?.content}`}
                                        alt={props?.data?.subject || "صورة الخبر"}
                                        width={"100%"} height={400}
                                        styles={{
                                            root: {border: "2px solid #eee", borderRadius: 8},
                                            image: {borderRadius: 8}
                                        }}
                                    />
                                ))}
                            </Group>
                        </Col>
                        : null
                    }

                    <Col span={12}>
                        <RichTextBox  content={props?.data?.description} />
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};
