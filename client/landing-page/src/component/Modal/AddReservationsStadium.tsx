import {Box, Button, Col, Grid, Group, TextInput, Select, Overlay, Stack, Loader, Text} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddReservations} from "../../graphql";
import {Notyf} from "notyf";
import {DatePickerInput, TimeInput} from "@mantine/dates";
import dayjs from "dayjs";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddReservationsStadium = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {
            name: "",
            about: "",
            type: "",
            attachments: "",
            rent: ""
        }
    });

    const openRef = useRef<() => void>(null);
    const [createReservations] = useAddReservations();
    const [loading, setLoading] = useState(false);

    const onFormSubmit = ({phone, booking_date, booking_start, booking_end}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        setLoading(true)
        createReservations({
            variables: {
                content: {
                    phone,
                    booking_date: dayjs(booking_date).format("YYYY-MM-DD"),
                    booking_start,
                    booking_end,
                    id_stadium: data
                }
            },
            onCompleted: () => {
                notyf.success("تم حجز الملعب ينجاح")
                closeModal()
            },
            onError: ({graphQLErrors}) => {
                notyf.error({message: "الوقت المرد الحجز فيه محجوز ادخل فترة زمنية اخرى", duration: 10000})
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        reset();
        setLoading(false)
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم الحجز يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({padding: 20, paddingBottom: 80})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <TextInput
                                placeholder="رقم الهاتف"
                                label="رقم الهاتف"
                                withAsterisk
                                {...getInputProps("phone")}
                            />
                        </Col>
                        <Col span={12} >
                            <DatePickerInput
                                placeholder="تاريخ الحجز"
                                label="تاريخ الحجز"
                                withAsterisk
                                {...getInputProps("booking_date")}
                            />
                        </Col>
                        <Col span={12} >
                            <TimeInput
                                placeholder="وقت بداية الحجز"
                                label="وقت بداية الحجز"
                                withAsterisk
                                {...getInputProps("booking_start")}
                            />
                        </Col>
                        <Col span={12} >
                            <TimeInput
                                placeholder="وقت نهاية الحجز"
                                label="وقت نهاية الحجز"
                                withAsterisk
                                {...getInputProps("booking_end")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
