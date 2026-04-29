import {Box, Button, Col, Grid, Group, Stack, Text, Textarea,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, AllPlayersClubLoan, AllPlayersClubTransferred, useChangeStatusPlayer} from "../../graphql";
import { useForm } from "react-hook-form";
import { Notyf } from "notyf";

type Props = {
    id: string;
    status: string;
} & ModalProps;

export const ChangeStatusPlayersModal = ({id, status, opened, ...props}: Props) => {
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();
    const [updatePlayer] = useChangeStatusPlayer();

    const onSubmit = ({note}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        updatePlayer({
            variables: {
                id,
                status: status,
                note
            },
            refetchQueries: [AllPlayers, AllPlayersClubLoan, AllPlayersClubTransferred],
            awaitRefetchQueries: true,
        })
        .then(() => {
            closeModal();
            notyf.success("تم تحديث حالة اللاعب بنجاح")
        })
        .catch(reason => {
            console.log(reason)
            notyf.error("حدث خطأ أثناء تحديث حالة اللاعب")
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
                {status === "accepted"
                    ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول اللاعب؟</Text>
                    : status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من رفض اللاعب؟</Text>
                        : null
                }

                <form style={{width: "100%"}} onSubmit={handleSubmit(onSubmit, () => console.log("error: ", errors))} id="submit_form">
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