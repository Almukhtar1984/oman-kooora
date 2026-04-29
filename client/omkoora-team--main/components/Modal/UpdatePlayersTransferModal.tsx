import {Box, Button, Group, Stack, Text} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTransferTeam, useUpdateTransfer} from "../../graphql";
import { useForm } from "react-hook-form";

type Props = {
    data: any;
} & ModalProps;

export const UpdatePlayersTransferModal = ({data, opened, ...props}: Props) => {
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();
    const [updateTransfer] = useUpdateTransfer();

    const onSubmit = ({note}: any) => {
        updateTransfer({
            variables: {
                id: data?.id,
                content: {
                    status: data?.status
                }
            },
            refetchQueries: [AllTransferTeam]
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form" onClick={onSubmit}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>
                {data?.status === "waiting_club_1"
                    ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول انتقال هذا اللاعب إليكم؟</Text>
                    : data?.status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من رفض انتقال هذا اللاعب إليكم؟</Text>
                        : null
                }
            </Stack>
        </Modal>
    );
};