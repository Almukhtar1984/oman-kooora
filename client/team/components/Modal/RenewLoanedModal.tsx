import {Box, Button, Col, Grid, Group, Select, Switch, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {
    AllAssembly,
    AllTeams,
    AllTransferTeam,
    useDeleteAssembly,
    useUpdateAssembly,
    useUpdateTransfer
} from "../../graphql";
import dayjs from "dayjs";
import {dateDiff} from "date-differencer";
import {DateInput, DatePicker, DatePickerInput} from "@mantine/dates";
import {useForm} from "@mantine/form";

type Props = {
    data?: any;
} & ModalProps;

interface Duration {
    "years": number;
    "months": number;
    "days": number;
}

export const RenewLoanedModal = ({ data, ...props }: Props) => {
    const [updateTransfer] = useUpdateTransfer();
    const form = useForm({
        initialValues: {date_end: ""}
    });


    const onSubmit = ({date_end}) => {
        updateTransfer({
            variables: {
                id: data?.id,
                content: {
                    date_end: dayjs(date_end).format("YYYY-MM-DD")
                }
            },
            refetchQueries: [AllTransferTeam]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
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
                        <Button  type="submit" form="submit_form" rightIcon={<Check size={15} />} >تجديد</Button>
                    </Group>
                </Box>
            }
            size={"sm"}
        >
            <Box sx={({ colors }) => ({padding: 20, minHeight: 200})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20} justify={"center"}>
                        <Col span={12}>
                            <Text size={"sm"} >تاريخ نهاية الاعارة الجديد</Text>
                            <DatePicker
                                {...form.getInputProps("date_end")}

                                styles={{
                                    monthLevelGroup: {justifyContent: "center"}
                                }}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};