import {Box, Button, Col, Grid, Group, Stack, Text, Textarea,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React, {useEffect} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllRequests, useAddRequest, useUpdateRequest} from "../../graphql";
import { useForm } from "@mantine/form";
import useStore from "../../store/useStore";

type Props = {
    data: any;
} & ModalProps;

export const UpdateComplaintModal = ({data, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm();

    const [updateReques] = useUpdateRequest();


    useEffect(() => {
        form.setValues({
            content: data?.content
        })
    }, [opened, data])

    const onSubmit = ({content }: any) => {
        updateReques({
            variables: {
                id: data?.id,
                content: {
                    content
                }
            },
            refetchQueries: [AllRequests]
        })
            .then(() => {
                closeModal();
            })
            .catch(() => {})
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Textarea
                                label="الشكوى"
                                withAsterisk
                                {...form.getInputProps("content")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
