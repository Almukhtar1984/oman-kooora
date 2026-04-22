import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { IconCalendar, IconCheck, IconX } from "@tabler/icons";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllClubs, useChangeStatusClub, useDeleteClub, useUpdateClub} from "../../graphql";

type Props = {
    data?: any;
} & ModalProps;

export const ChangeStatusClubModal = ({ data, ...props }: Props) => {
    const [changeStatusClub] = useChangeStatusClub();

    const onSubmit = () => {
        changeStatusClub({
            variables: {
                id: data?.id,
                content: {
                    account_status: !data?.account_status
                }
            },
            refetchQueries: [AllClubs]
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
                        <Button rightIcon={<IconCheck size={15} />} bg={"primary"} onClick={onSubmit}>{data?.account_status ? "توقيف" : "تفعيل"}</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                {data?.account_status
                    ? <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من توقيف هذا النادي ؟</Text>
                    : <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من تفعيل هذا النادي ؟</Text>
                }
            </Box>
        </Modal>
    );
};