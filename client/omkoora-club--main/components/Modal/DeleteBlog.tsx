import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllBlog, useDeleteBlog} from "../../graphql";
import { Notyf } from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const DeleteBlog = ({ data, ...props }: Props) => {
    const [deleteBlog] = useDeleteBlog();

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        deleteBlog({
            variables: {
                id: data?.id
            },
            refetchQueries: [AllBlog]
        })
        .then(() => {
            closeModal();
            notyf.success("تم حذف المنشور بنجاح")
        })
        .catch(reason => {
            console.log(reason)
            notyf.error("حدث خطأ أثناء حذف المنشور")
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
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذا المنشور ؟</Text>
            </Box>
        </Modal>
    );
};