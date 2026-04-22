import { useDisclosure } from '@mantine/hooks';
import {Drawer, Button, Group, DrawerProps, Text, Col, Box, Grid} from '@mantine/core';
import {RichTextEditor} from "@mantine/tiptap";
import React, {useEffect, useState} from "react";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {useMessage} from "../../graphql";

type Props = {
    content?: string;
};

export function RichTextBox({ content }: Props) {

    const editor = useEditor({
        extensions: [StarterKit],
        editable: false,
        content
    });

    return (
        <RichTextEditor editor={editor} mih={120} >
            <RichTextEditor.Content />
        </RichTextEditor>
    );
}