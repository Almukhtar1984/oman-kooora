import {Box, Button, Group, Text} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, useDeleteAttachmentPlayer} from "../../graphql";
import { Notyf } from "notyf";

type Props = {
    id?: any;
} & ModalProps;

export const DeleteAttachmentPlayerModal = ({ id, ...props }: Props) => {
    const [deleteAttachmentPlayer] = useDeleteAttachmentPlayer();

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!id) {
            notyf.error("لم يتم تحديد المرفق");
            return;
        }
        deleteAttachmentPlayer({
            variables: { id },
            refetchQueries: [AllPlayers],
            awaitRefetchQueries: true,
        })
        .then(({ data }) => {
            if (data?.deleteAttachmentPlayer?.status) {
                closeModal();
                notyf.success("تم حذف المرفق بنجاح");
            } else {
                notyf.error("لم يتم حذف المرفق");
            }
        })
        .catch(reason => {
            console.log(reason)
            notyf.error("حدث خطأ أثناء حذف المرفق");
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