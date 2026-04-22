import {RichTextEditor} from "@mantine/tiptap";
import React from "react";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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
        <RichTextEditor
            editor={editor} mih={120}
            styles={{
                root: {border: "none"}
            }}
        >
            <RichTextEditor.Content />
        </RichTextEditor>
    );
}