import {Box, Button, Col, Grid, Group, Stack, Text, Textarea} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { AllRequests, useUpdateRequest} from "../../graphql";
import { useForm } from "react-hook-form";

type Props = {
    data: any;
} & ModalProps;

export const UpdateRequestStatusModal = ({data, opened, ...props}: Props) => {
    const {register, handleSubmit, control, watch, reset} = useForm();
    const [updateRequest] = useUpdateRequest();

    const onSubmit = ({note}: any) => {
        updateRequest({
            variables: {
                id: data?.id,
                content: {
                    status: data?.status,
                    note
                }
            },
            refetchQueries: [AllRequests]
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form" onClick={onSubmit}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>
                {data?.status === "accepted"
                    ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول طلب اللاعب؟</Text>
                    : data?.status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من رفض طلب اللاعب؟</Text>
                        :  data?.status === "done"
                            ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من الانتهى من طلب اللاعب؟</Text>
                            : null
                }
                <form style={{width: "100%"}} onSubmit={handleSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Textarea
                                placeholder={(data?.status === "accepted" || data?.status === "done") ? "ملاحظة" : "السبب"}
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
