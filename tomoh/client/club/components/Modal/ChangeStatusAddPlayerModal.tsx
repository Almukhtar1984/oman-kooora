import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useChangeStatusAddPlayer, useChangeStatusTeam, useDeleteAssembly, useUpdateAssembly} from "../../graphql";

type Props = {
    data?: any;
} & ModalProps;

export const ChangeStatusAddPlayerModal = ({ data, ...props }: Props) => {
    const [changeStatusAddPlayer] = useChangeStatusAddPlayer();

    const onSubmit = () => {
        changeStatusAddPlayer({
            variables: {
                id: data?.id,
                content: {
                    enableAddPlayer: !data?.enableAddPlayer
                }
            },
            refetchQueries: [AllTeams]
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
                        <Button rightIcon={<Check size={15} />} bg={"primary"} onClick={onSubmit}>{data?.enableAddPlayer ? "توقيف" : "تفعيل"}</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                {data?.enableAddPlayer
                    ? <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من توقيف اضافة لاعبين لهذا الفريق ؟</Text>
                    : <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من تفعيل اضافة لاعبين لهذا الفريق ؟</Text>
                }
            </Box>
        </Modal>
    );
};