import {ActionIcon, Box, Button, Grid, Group, Select, TextInput, Tooltip} from "@mantine/core";
import {IconCheck, IconPlus, IconTrash, IconX} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, AllParticipatingPlayers, useAddParticipatingPlayers, useAllPlayers, useUpdateParticipatingPlayers} from "../../graphql";
import {Notyf} from "notyf";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";
import {Text, useMantineTheme} from "@mantine/core";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateParticipatingPlayers = ({data, ...props}: Props) => {
    const theme = useMantineTheme();
    const {getInputProps, reset, onSubmit, values, setValues, removeListItem} = useForm({
        initialValues: {number: ""}
    });
    const [updateParticipatingPlayers] = useUpdateParticipatingPlayers();


    useEffect(() => {
        if (data !== null && props.opened) {
            setValues({
                number: data.number
            })
        }
    }, [data, props.opened])

    const onFormSubmit = ({number}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateParticipatingPlayers({
            variables: {
                content: [{
                    id: data.id,
                    number
                }]
            },
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل اللاعب")
            },
            refetchQueries: [AllParticipatingPlayers],
            onError: () => void 0
        })
    };

    const closeModal = () => {
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightSection={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
            zIndex={201}
        >
            <Box style={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} mb={20} >
                            <Group justify={"center"} align="center">
                                <Text size={"16px"} c={theme.colors.gray[6]}>
                                    {`${data?.player?.person?.first_name} ${data?.player?.person?.second_name} ${data?.player?.person?.third_name} ${data?.player?.person?.tribe}`}
                                </Text>
                            </Group>
                        </Col>
                        <Col span={12} >
                            <TextInput
                                placeholder="رقم القميص"
                                label="رقم القميص"
                                withAsterisk
                                {...getInputProps(`number`)}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
