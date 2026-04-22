import {Box, Button, Group, Text, useMantineTheme} from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllAssembly, AllTeams, useDeleteAssembly, useUpdateAssembly} from "../../graphql";
import dayjs from "dayjs";

type Props = {
    data?: any;
} & ModalProps;

interface Duration {
    "years": number;
    "months": number;
    "days": number;
}

export const RenewAssemblyModal = ({ data, ...props }: Props) => {
    const [updateAssembly] = useUpdateAssembly();

    const [duration, setDuration ] = useState(0);

    useEffect(() => {
        const yearSubscription = dayjs(data?.subscription_date).format("YYYY")
        const yearNow = dayjs(new Date()).format("YYYY")



        setDuration(parseInt(yearNow) - parseInt(yearSubscription))
    }, [])

    const onSubmit = () => {
        updateAssembly({
            variables: {
                id: data?.id,
                content: {
                    subscription_date: dayjs(new Date()).format("YYYY-MM-DD")
                }
            },
            refetchQueries: [AllAssembly]
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
                        <Button rightIcon={<Check size={15} />} bg={"red"} onClick={onSubmit}>حذف</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                {duration > 0
                    ? <Text size={"lg"} ta={"center"} my={20} >متخلف لديه {duration} سنوات</Text>
                    : null
                }

                <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من تجديد الاشتراك ؟</Text>
            </Box>
        </Modal>
    );
};