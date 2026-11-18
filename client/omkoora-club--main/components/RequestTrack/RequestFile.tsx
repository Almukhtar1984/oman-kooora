import { Alert, Anchor, Avatar, Box, Group, Image, Paper, SimpleGrid, Text } from "@mantine/core";
import { AlertTriangle, FileText } from "tabler-icons-react";
import React from "react";

import { getImageUrl } from "../../lib/helpers/image";

// «ملف الطلب»: ما أرسله الفريق، يراه النادي قبل أن يقرّر.
//
// قال العميل: «أنا لما أفتح المسار هو طوالي يعمل لي قبول مبدئي من دون ما أشوف
// الملف بتاعه». فصار الدرج يعرض الملف فوق الخط والأزرار: البيانات، والمستندات
// تُفتح بحجمها، وما لم يُرفق مسمّى باسمه. الخادم هو من يبني الملف لكل نوع
// (requestFile.mjs)، وهذا الملف نفسه في لوحتَي النادي والفريق.

export type RequestFileData = {
    photo?: string | null;
    fields?: { label: string; value: string }[];
    documents?: { label: string; file: string; kind: string }[];
    missing?: string[];
};

// المصغّر يُطلب مصغّراً من الخادم (?w=) — صور البطاقات تُرفع بالميغابايت من الهاتف.
const RESIZABLE = ["JPG", "JPEG", "PNG"];
const thumbOf = (file: string, width: number) => {
    const url = getImageUrl(file);
    const ext = file.split(".").pop()?.toUpperCase() || "";
    return RESIZABLE.includes(ext) ? `${url}?w=${width}` : url;
};

const linkStyle = { "&:hover": { textDecoration: "none" } };

export function RequestFile({ file }: { file?: RequestFileData | null }) {
    if (!file) return null;
    const fields = file.fields || [];
    const documents = file.documents || [];
    const missing = file.missing || [];
    if (!fields.length && !documents.length && !missing.length) return null;

    return (
        <Paper withBorder radius="md" p="md">
            <Text size="sm" weight={700} color="gray.8" mb="sm">ملف الطلب</Text>

            <Group align="flex-start" noWrap spacing="md">
                {file.photo && (
                    <Anchor href={getImageUrl(file.photo)} target="_blank" rel="noopener noreferrer" sx={linkStyle}>
                        <Avatar src={thumbOf(file.photo, 160)} size={72} radius="md" alt="الصورة الشخصية" />
                    </Anchor>
                )}
                <SimpleGrid cols={2} spacing="xs" verticalSpacing={8} sx={{ flex: 1 }}
                    breakpoints={[{ maxWidth: "xs", cols: 1 }]}>
                    {fields.map((field) => (
                        <Box key={field.label}>
                            <Text size="xs" color="gray.6">{field.label}</Text>
                            {/* الرقم المدني والهاتف والتواريخ تُقرأ من اليسار، والأسماء من اليمين. */}
                            <Text size="sm" weight={500} color="gray.8">
                                <span dir="auto">{field.value}</span>
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>
            </Group>

            {documents.length > 0 && (
                <>
                    <Text size="xs" color="gray.6" mt="md" mb={6}>المستندات المرفقة — اضغط لفتحها بحجمها</Text>
                    <SimpleGrid cols={3} spacing="xs" breakpoints={[{ maxWidth: "xs", cols: 2 }]}>
                        {documents.map((doc) => (
                            <Anchor
                                key={`${doc.label}-${doc.file}`}
                                href={getImageUrl(doc.file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={linkStyle}
                            >
                                <Paper withBorder radius="sm" p={4}>
                                    {doc.kind === "image" ? (
                                        <Image
                                            src={thumbOf(doc.file, 360)}
                                            height={90}
                                            fit="cover"
                                            radius="sm"
                                            alt={doc.label}
                                            withPlaceholder
                                        />
                                    ) : (
                                        <Group position="center" h={90} bg="gray.0" sx={{ borderRadius: 4 }}>
                                            <FileText size={32} />
                                        </Group>
                                    )}
                                    <Text size="xs" align="center" color="gray.8" mt={4} lineClamp={2}>
                                        {doc.label}
                                    </Text>
                                </Paper>
                            </Anchor>
                        ))}
                    </SimpleGrid>
                </>
            )}

            {missing.length > 0 && (
                <Alert mt="md" color="orange" variant="light" icon={<AlertTriangle size={16} />} title="لم يُرفق مع الطلب">
                    {missing.join("، ")}
                </Alert>
            )}
        </Paper>
    );
}
