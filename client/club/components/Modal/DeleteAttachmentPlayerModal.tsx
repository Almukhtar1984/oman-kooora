import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, useDeleteAttachmentPlayer} from "../../graphql";

type Props = {
    id?: any;
} & ModalProps;

export const DeleteAttachmentPlayerModal = ({ id, ...props }: Props) => {
    const [deleteAttachmentPlayer] = useDeleteAttachmentPlayer();
    
    const onSubmit = () => {
        deleteAttachmentPlayer({
            variables: {
                id
            },
            refetchQueries: [AllPlayers]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
        })
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            zIndex={205}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} bg={"red"} onClick={onSubmit}>حذف</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذا المرفق ؟</Text>
            </Box>
        </Modal>
    );
};