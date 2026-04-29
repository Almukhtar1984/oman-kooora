import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useChangeStatusAddPlayer, useChangeStatusTeam, useDeleteAssembly, useUpdateAssembly} from "../../graphql";
import { Notyf } from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const ChangeStatusAddPlayerModal = ({ data, ...props }: Props) => {
    const [changeStatusAddPlayer] = useChangeStatusAddPlayer();

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
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
            notyf.success("تم تحديث الحالة بنجاح");
        })
        .catch(reason => {
            console.log(reason)
            notyf.error("حدث خطأ أثناء تحديث الحالة");
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