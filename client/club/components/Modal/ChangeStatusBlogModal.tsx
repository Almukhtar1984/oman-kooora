import {Box, Button, Col, Grid, Group, Stack, Text, Textarea,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllBlog, AllPlayers, useChangeStatusPlayer, useUpdateBlog} from "../../graphql";
import { useForm } from "react-hook-form";

type Props = {
    id: string;
    status: string;
} & ModalProps;

export const ChangeStatusBlogModal = ({id, status, opened, ...props}: Props) => {
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();
    const [updateBlog] = useUpdateBlog();

    const onSubmit = () => {
        updateBlog({
            variables: {
                id,
                content: {
                    status: status,
                }
            },
            refetchQueries: [AllBlog]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
        })
    };

    const closeModal = () => {
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} onClick={onSubmit}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>
                {status === "accepted"
                    ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول الخبر؟</Text>
                    : status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من رفض الخبر؟</Text>
                        : null
                }
            </Stack>
        </Modal>
    );
};