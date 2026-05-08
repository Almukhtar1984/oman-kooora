import {ActionIcon, Box, Col, Grid, Group, Stack, Text} from "@mantine/core";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {Paperclip, Trash} from "tabler-icons-react";
import {IconDatabaseOff} from "@tabler/icons-react";
import {getImageUrl} from "../../lib/helpers/image";

type Props = {
    setSelectedData: (id: string) => void;
    setOpenDeleteAttachmentModal: (open: boolean) => void;
    data?: any;
} & ModalProps;

export const ShowAttachments = ({data, setSelectedData, setOpenDeleteAttachmentModal, ...props}: Props) => {
    const closeModal = () => {
        props.onClose();
    };

    const attachments = data?.attachmentsPlayer || [];

    return (
        <Modal
            {...props} onClose={closeModal}
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
                                                onClick={() => {
                                                    setSelectedData(item.id)
                                                    setOpenDeleteAttachmentModal(true)
                                                }}
                                            >
                                                <Trash size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Box>
                                ))}
                            </Group>
                        ) : (
                            <Stack mih={120} align="center" justify="center" spacing={6}>
                                <IconDatabaseOff size="3rem" strokeWidth={1} color="#ADB5BD" />
                                <Text size="sm" c="gray.6">لا توجد مرفقات لهذا اللاعب</Text>
                            </Stack>
                        )}
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};