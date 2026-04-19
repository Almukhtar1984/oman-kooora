import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllRequests, useDeleteRequest} from "../../graphql";

type Props = {
    id?: string;
} & ModalProps;

export const DeleteProposalModal = ({ id, ...props }: Props) => {
    const [deleteRequest] = useDeleteRequest();

    const onSubmit = () => {
        deleteRequest({
            variables: {
                id
            },
            refetchQueries: [AllRequests]
        })
            .then(() => {
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
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذه المقترح ؟</Text>
            </Box>
        </Modal>
    );
};