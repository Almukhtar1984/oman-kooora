import {ActionIcon, Box, Button, Col, Grid, Group, Image, Text, Title} from "@mantine/core";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import {Paperclip, Trash} from "tabler-icons-react";

type Props = {
    setSelectedData: (id: string) => void;
    setOpenDeleteAttachmentModal: (open: boolean) => void;
    data?: any;
} & ModalProps;

export const ShowAttachments = ({data, setSelectedData, setOpenDeleteAttachmentModal, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<Box py={16} px={20} bg="slate.0" />}
            size="md"
        >
            <Box sx={({ colors }) => ({padding: 20, paddingTop: 0})}>
                <Grid gutter={20}>
                    <Col span={12} >
                        {data?.attachmentsPlayer && data.attachmentsPlayer.length > 0 ?
                            <Group position={"center"} spacing={20} >
                                {data.attachmentsPlayer.map((item: any, index: number) => (
                                    <Box key={index} bg={"#eee"} p={10}>
                                        <Group spacing={10} position={"center"}>
                                            <Box
                                                key={index}

                                                component="a"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${item.content}`}
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
                            : null
                        }
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};