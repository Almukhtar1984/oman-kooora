import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {
    AllAssembly,
    AllTeams,
    AllTransferTeam, useCreateTransfer,
    useDeleteAssembly,
    useUpdateAssembly,
    useUpdateTransfer
} from "../../graphql";
import dayjs from "dayjs";
import {dateDiff} from "date-differencer";

type Props = {
    data?: any;
} & ModalProps;

interface Duration {
    "years": number;
    "months": number;
    "days": number;
}

export const ReturningPlayerModal = ({ data, ...props }: Props) => {
    const [createTransfer] = useCreateTransfer();

    const onSubmit = () => {
        createTransfer({
            variables: {
                content: {
                    status: "waiting_team",
                    type: data?.type,
                    id_player: data?.player?.id,
                    id_team_from: data?.team_to?.id,
                    id_team_to: data?.team_from?.id,
                    transition_type: "returning"
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

                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من ارجاع اللاعب الى ناديه القديم ؟</Text>
            </Box>
        </Modal>
    );
};