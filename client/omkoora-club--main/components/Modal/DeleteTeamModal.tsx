import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useDeleteAssembly, useDeleteTeam, useUpdateAssembly} from "../../graphql";
import { Notyf } from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const DeleteTeamModal = ({ data, ...props }: Props) => {
    const [deleteTeam] = useDeleteTeam();

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        deleteTeam({
            variables: {
                id: data
            },
            refetchQueries: [AllTeams]
        })
        .then(() => {
            closeModal();
            notyf.success("تم حذف الفريق بنجاح")
        })
        .catch(reason => {
            console.log(reason)
            notyf.error("حدث خطأ أثناء حذف الفريق")
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
                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من حذف هذا النادي ؟</Text>
            </Box>
        </Modal>
    );
};