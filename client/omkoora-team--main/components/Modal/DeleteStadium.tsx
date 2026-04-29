import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "../../components/Modal/Modal";
import {AllStadium, useDeleteStadium} from "../../graphql";
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const DeleteStadium = ({ data, ...props }: Props) => {
    const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
    const [deleteStadium] = useDeleteStadium();

    const onSubmit = () => {
        deleteStadium({
            variables: {
                id: data?.id
            },
            refetchQueries: [AllStadium]
        })
        .then(() => {
            notyf?.success("تم حذف الملعب بنجاح");
            closeModal();
        })
        .catch(reason => {
            console.log(reason)
        })
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
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
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذا الملعب ؟</Text>
            </Box>
        </Modal>
    );
};