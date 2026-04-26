import {Box, Button, Grid, Group, TextInput, Textarea, NumberInput} from "@mantine/core";
import {IconCalendar, IconCheck, IconChevronDown, IconX} from "@tabler/icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddLeague, useUpdateLeague} from "../../graphql";
import useStore from "../../store/useStore";
import {Notyf} from "notyf";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateLeague = ({data, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {name: "", description: "", numberTeams: 0, numberGroups: 0, startDate: "", expiryDate: ""}
    });

    const [updateLeague] = useUpdateLeague();

    useEffect(() => {
        if (data !== null && props.opened) {
            setValues({
                name: data.name,
                description: data.description,
                numberTeams: data.numberTeams,
                numberGroups: data.numberGroups
            })
        }
    }, [data, props.opened])

    const onFormSubmit = ({name, numberTeams, numberGroups, description, startDate, expiryDate}: any) => {
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;

        updateLeague({
            variables: {
                id: data.id,
                content: {
                    name,
                    numberTeams,
                    numberGroups,
                    description,

                    startDate: dayjs(startDate).format("YYYY-MM-DD"),
                    expiryDate: dayjs(expiryDate).format("YYYY-MM-DD")
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf?.success("تم تعديل الدورة")
            },
            onError: ({graphQLErrors}) => {
                console.log(false)
            }
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
                    <Group position={"left"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >

            <Box style={{padding: 20}}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <TextInput
                                placeholder="اسم الدورة"
                                label="اسم الدورة"
                                withAsterisk
                                {...getInputProps("name")}
                            />
                        </Col>
                        <Col span={12} >
                            <Textarea
                                placeholder="الوصف"
                                label="الوصف"
                                withAsterisk
                                {...getInputProps("description")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="عدد الفرق"
                                label="عدد الفرق"
                                withAsterisk
                                {...getInputProps("numberTeams")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="عدد المجموعات"
                                label="عدد المجموعات"
                                withAsterisk
                                {...getInputProps("numberGroups")}
                            />
                        </Col>


                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ البداية"
                                label="تاريخ البداية"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("startDate")}
                            />
                        </Col>
                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ النهاية"
                                label="تاريخ النهاية"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("expiryDate")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};