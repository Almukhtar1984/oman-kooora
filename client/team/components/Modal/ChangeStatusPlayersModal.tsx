import {Box, Button, Col, Grid, Group, Stack, Text, Textarea,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, useChangeStatusPlayer} from "../../graphql";
import { useForm } from "react-hook-form";

type Props = {
    id: string;
    status: string;
} & ModalProps;

export const ChangeStatusPlayersModal = ({id, status, opened, ...props}: Props) => {
    const {register, handleSubmit, control, watch, reset} = useForm();
    const [updatePlayer] = useChangeStatusPlayer();

    const onSubmit = ({note}: any) => {
        updatePlayer({
            variables: {
                id,
                status: status,
                note
            },
            refetchQueries: [AllPlayers]
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>
                {status === "waiting_club"
                    ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول اللاعب؟</Text>
                    : status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من رفض اللاعب؟</Text>
                        : null
                }

                <form style={{width: "100%"}} onSubmit={handleSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Textarea
                                placeholder={status === "waiting_club" ? "ملاحظة" : "السبب"}
                                {...register("note", { required: false })}
                                w={"100%"}
                                minRows={3}
                                maxRows={5}
                                autosize={true}
                            />
                        </Col>
                    </Grid>
                </form>
            </Stack>
        </Modal>
    );
};
