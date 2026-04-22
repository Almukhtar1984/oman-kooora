import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useChangeStatusTeam, useDeleteAssembly, useUpdateAssembly} from "../../graphql";

type Props = {
    data?: any;
} & ModalProps;

export const ChangeStatusTeamModal = ({ data, ...props }: Props) => {
    const [changeStatusTeam] = useChangeStatusTeam();

    const onSubmit = () => {
        changeStatusTeam({
            variables: {
                id: data?.id,
                content: {
                    account_status: !data?.account_status
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
                        <Button rightIcon={<Check size={15} />} bg={"primary"} onClick={onSubmit}>{data?.account_status ? "توقيف" : "تفعيل"}</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                {data?.account_status
                    ? <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من توقيف هذا الفريق ؟</Text>
                    : <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من تفعيل هذا الفريق ؟</Text>
                }
            </Box>
        </Modal>
    );
};