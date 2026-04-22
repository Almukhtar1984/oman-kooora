import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { IconCalendar, IconCheck, IconX } from "@tabler/icons";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllClubs, useDeleteClub, useUpdateClub} from "../../graphql";

type Props = {
    data?: any;
} & ModalProps;

export const DeleteClubModal = ({ data, ...props }: Props) => {
    const [deleteClub] = useDeleteClub();

    const onSubmit = () => {
        deleteClub({
            variables: {
                id: data
            },
            refetchQueries: [AllClubs]
        })
        .then(() => {
            closeModal();
        })
        .catch(() => {})
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            styles={(theme) => ({
                modal: {
                    [theme.fn.largerThan("md")]: {
                        maxWidth: "40% !important",
                    }
                }
            })}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} bg={"red"} onClick={onSubmit}>حذف</Button>
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
