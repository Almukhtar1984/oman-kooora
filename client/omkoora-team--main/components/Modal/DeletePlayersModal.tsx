import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, AllTeams, useDeleteMember, useDeleteTeam, useUpdateTeam, useDeletePlayer} from "../../graphql";
import {Notyf} from "notyf";

type Props = {
    id?: any;
} & ModalProps;

export const DeletePlayersModal = ({ id, ...props }: Props) => {
    const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
    const [deletePlayer] = useDeletePlayer();

    const onSubmit = () => {
        deletePlayer({
            variables: {
                id: id
            },
            refetchQueries: [AllPlayers]
        })
        .then(() => {
            notyf?.success("تم حذف اللاعب بنجاح");
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
            // styles={(theme) => ({
            //     modal: {
            //         [theme.fn.largerThan("md")]: {
            //             maxWidth: "40% !important",
            //         }
            //     }
            // })}
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
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذا اللاعب ؟</Text>
            </Box>
        </Modal>
    );
};