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

    // المحتوى يصل من الخادم بعد أن يُنشأ المحرّر، و«content» في useEditor يُقرأ مرة
    // واحدة: فكان صندوق «المحتوى» في التعليقات فارغاً (اجتماع العميل، 2026-11-16).
    useEffect(() => {
        if (editor && !editor.isDestroyed && editor.getHTML() !== (content || "")) {
            editor.commands.setContent(content || "", false);
        }
    }, [editor, content]);

    return (
        <RichTextEditor editor={editor} mih={120} >
            <RichTextEditor.Content />
        </RichTextEditor>
    );
}