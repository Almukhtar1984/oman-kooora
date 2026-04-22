import {Box, Button, Col, Grid, Group, Select, Divider, PasswordInput, Textarea} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllRequests, useAddRequest} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from "@mantine/form";

type Props = {} & ModalProps;

const init = {
    content: ""
}

export const AddComplaintModal = ({ ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [createReques] = useAddRequest();

    const onSubmit = (data: any) => {
        const {content } = data
        const idPlayer = userData?.person?.player?.id;

        createReques({
            variables: {
                content: {
                    content,
                    status: "waiting",
                    type: "complaint",
                    id_player: idPlayer
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
