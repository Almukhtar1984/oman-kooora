import {ActionIcon, Box, Col, Grid, Group, Stack, Text} from "@mantine/core";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {Paperclip, Trash} from "tabler-icons-react";
import {IconDatabaseOff} from "@tabler/icons-react";
import {getImageUrl} from "../../lib/helpers/image";
import {AllTechnicals, useDeleteAttachmentTechnical} from "../../graphql";
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

// Review a technical-staff member's saved attachments, open any of them, and
// remove one (with confirm). Deletion refetches the technical list so the modal
// reflects the change on reopen.
export const ShowAttachmentsTechnical = ({data, ...props}: Props) => {
    const [deleteAttachmentTechnical] = useDeleteAttachmentTechnical();

    const attachments = data?.attachmentsTechnical || [];

    const handleDelete = (id: string) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (typeof window !== "undefined" && !window.confirm("هل أنت متأكد من حذف هذا المرفق؟")) return;
        deleteAttachmentTechnical({
            variables: { id },
            refetchQueries: [AllTechnicals],
            onCompleted: (res: any) => {
                if (res?.deleteAttachmentTechnical?.status) {
                    notyf.success("تم حذف المرفق");
                    props.onClose();
                } else {
                    notyf.error("تعذّر حذف المرفق");
                }
            },
            onError: (err: any) => notyf.error(err?.message || "فشل حذف المرفق"),
        });
    };

    return (
        <Modal
            {...props}
            footer={<Box py={16} px={20} bg="slate.0" />}
            size="md"
        >
            <Box sx={({ colors }) => ({padding: 20, paddingTop: 0})}>
                <Grid gutter={20}>
                    <Col span={12} >
                        {attachments.length > 0 ? (
                            <Group position={"center"} spacing={20} >
                                {attachments.map((item: any, index: number) => (
                                    <Box key={item.id || index} bg={"#eee"} p={10}>
                                        <Group spacing={10} position={"center"}>
                                            <Box
                                                component="a"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={getImageUrl(item.content)}
                                            >
                                                <Group position={"center"}>
                                                    <Paperclip size={16} />
                                                    <Text size={"sm"}>المرفق {index+1}</Text>
                                                </Group>
                                            </Box>

                                            <ActionIcon
                                                color="red" variant="light"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Box>
                                ))}
                            </Group>
                        ) : (
                            <Stack align={"center"} justify={"center"} py={30} spacing={8}>
                                <IconDatabaseOff size={32} color={"#adb5bd"} />
                                <Text color={"dimmed"} size={"sm"}>لا توجد مرفقات</Text>
                            </Stack>
                        )}
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};
