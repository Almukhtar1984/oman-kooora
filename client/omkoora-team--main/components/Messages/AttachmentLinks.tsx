import { Anchor, Group, Text } from "@mantine/core";
import { FileText, Paperclip } from "tabler-icons-react";
import React from "react";
import { getImageUrl } from "../../lib/helpers/image";

type Attachment = { id?: string | null; content?: string | null };

/** نوع الملف كما يُقرأ: PDF، Word، صورة… */
export const fileKind = (name: string | null | undefined): string => {
    const ext = String(name || "").split(".").pop()?.toUpperCase() || "";
    if (["JPG", "JPEG", "PNG"].includes(ext)) return "صورة";
    if (ext === "PDF") return "PDF";
    if (["DOC", "DOCX"].includes(ext)) return "Word";
    if (["XLS", "XLSX", "CSV"].includes(ext)) return "Excel";
    if (["PPT", "PPTX"].includes(ext)) return "PowerPoint";
    return ext || "ملف";
};

// المستندات المرفقة — ظاهرةً بأسمائها حيث تُقرأ الرسالة وتعليقاتها، فلا يُقال
// «ما في مرفق» وهو موجود (اجتماع العميل، 2026-11-16).
export const AttachmentLinks = ({
    items, label = "مستند", empty = null,
}: { items?: Attachment[] | null; label?: string; empty?: React.ReactNode }) => {
    const list = (items || []).filter((item) => item?.content);
    if (!list.length) return empty ? <Text size="xs" color="dimmed">{empty}</Text> : null;
    return (
        <Group spacing="xs" sx={{ flexWrap: "wrap" }}>
            {list.map((item, i) => (
                <Anchor
                    key={item.id || i}
                    href={getImageUrl(item.content)}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    sx={(t) => ({
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 6, background: t.colors.blue[0],
                    })}
                >
                    {fileKind(item.content) === "صورة" ? <Paperclip size={14} /> : <FileText size={14} />}
                    {label} {list.length > 1 ? i + 1 : ""} ({fileKind(item.content)})
                </Anchor>
            ))}
        </Group>
    );
};

export default AttachmentLinks;
