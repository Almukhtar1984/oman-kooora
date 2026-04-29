import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {
    AllExpense,
    AllMessagesSender,
    AllTeams,
    useDeleteAssembly,
    useDeleteExpense,
    useDeleteMessage,
    useUpdateAssembly
} from "../../graphql";
import {AddExpenseModal} from "./AddExpenseModal";
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const DeleteExpenseModal = ({ data, ...props }: Props) => {
    const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
    const [deleteExpense] = useDeleteExpense();

    const onSubmit = () => {
        deleteExpense({
            variables: {
                id: data
            },
            refetchQueries: [AllExpense]
        })
        .then(() => {
            notyf?.success("تم حذف المصروف بنجاح");
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
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذا المصروف ؟</Text>
            </Box>
        </Modal>
    );
};