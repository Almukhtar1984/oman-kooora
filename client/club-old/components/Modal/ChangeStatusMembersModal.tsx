import {Box, Button, Col, Grid, Group, Stack, Text, Textarea,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMembers, useChangeStatusMember} from "../../graphql";
import { useForm } from "react-hook-form";

type Props = {
    id: string;
    status: string;
} & ModalProps;

export const ChangeStatusMembersModal = ({id, status, opened, ...props}: Props) => {
    const {register, handleSubmit, control, watch, reset} = useForm();
    const [updateMember] = useChangeStatusMember();


    const onSubmit = ({note}: any) => {
        updateMember({
            variables: {
                id,
                status: status,
                note
            },
            refetchQueries: [AllMembers]
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"} p={20}>
                {status === "accepted"
                    ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول عضو مجلس الأدارة؟</Text>
                    : status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت من متأكد رفض عضو مجلس الأدارة؟</Text>
                        : null
                }


                <form style={{width: "100%"}} onSubmit={handleSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Textarea
                                placeholder={status === "accepted" ? "ملاحظة" : "السبب"}
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
