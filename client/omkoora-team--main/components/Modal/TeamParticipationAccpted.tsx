import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {useAccepteParticipatingTeams, useDeleteMember, useRejecteParticipatingTeams , useUpdateParticipatingTeams} from "../../graphql";
import {Notyf} from "notyf";
type Props = {
    id?: any;
    SelectedParticipationTeam: any
} & ModalProps;

export const TeamParticipationAccptedModal = ({ id,SelectedParticipationTeam, ...props }: Props) => {
    const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
    const [deleteMember] = useDeleteMember();
    const [UpdateParticipatingTeams] = useUpdateParticipatingTeams();

    const [RejecteParticipatingTeams] = useRejecteParticipatingTeams();
    const [AccepteParticipatingTeams] = useAccepteParticipatingTeams();
    const onRejecte= () => {

        RejecteParticipatingTeams({
            variables: {
                id: SelectedParticipationTeam.id
            },
            //refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf?.success("تم رفض الانضمام")
                
            },
            onError: ({graphQLErrors}) => {
                console.log(false)
            }
        })
    };
    const onSubmit= () => {
        AccepteParticipatingTeams({
            variables: {
                id: SelectedParticipationTeam.id
            },
            //refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf?.success("تم قبول الانضمام")
                
            },
            onError: ({graphQLErrors}) => {
                console.log(false)
            }
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
                        <Button rightIcon={<Check size={15} />} bg={"red"} onClick={onRejecte}>الرفض</Button>
                        <Button rightIcon={<Check size={15} />}  onClick={onSubmit}>الانضمام</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <Text size={"lg"} ta={"center"} my={20} >هل تريد الانضمام الى البطولة ؟</Text>
            </Box>
        </Modal>
    );
};