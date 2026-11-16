import { Badge } from "@mantine/core";
import { Message } from "tabler-icons-react";
import React from "react";

// على الرسالة تعليقات؟ يُقال في القائمة نفسها، لا خلف قائمة الخيارات: «فيه طريقة
// سهلة… عشان يعرفون أن هنا فيه تعليق» (اجتماع العميل، 2026-11-16).
export const CommentsBadge = ({ count, onClick }: { count?: number | null; onClick?: () => void }) => {
    if (!count) return null;
    const label = count === 1 ? "تعليق" : `${count} تعليقات`;
    return (
        <Badge
            component={onClick ? "button" : "span"}
            type={onClick ? "button" : undefined}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick?.(); }}
            color="orange"
            variant="light"
            size="sm"
            leftSection={<Message size={12} style={{ marginTop: 3 }} />}
            sx={{ cursor: onClick ? "pointer" : "default", flexShrink: 0, border: 0 }}
            aria-label={`عرض التعليقات (${count})`}
        >
            {label}
        </Badge>
    );
};

export default CommentsBadge;
