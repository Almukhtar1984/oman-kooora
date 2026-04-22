import {Box, Button, Col, FileInput, Grid, Group, Select, Switch,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTechnicals, useMember, useChangeStatusMember, useUpdateMember} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";

type Props = {
    id: string;
} & ModalProps;

const init = {
    occupation: "",
    classification: "",
    membership_date: new Date(),
    membership_date_end: new Date(),
    paid: false,
    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: new Date(),
    }
}

export const UpdateMemberModal = ({id, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [idPerson, setIdPerson] = useState("");
    const [updateMember] = useUpdateMember();

    const [getMember, { loading, error, data: dataMember }] = useMember();

    useEffect(() => {
        if (id && id !== "") {
            getMember({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened])

    useEffect(() => {
        if (dataMember && "member" in dataMember) {
            form.setValues({
                classification: dataMember?.member?.classification,
                membership_date: new Date(dataMember?.member?.membership_date) || null,

                membership_date_end: new Date(dataMember?.member?.membership_date_end) || null,
                paid: dataMember?.member?.paid,
                occupation: dataMember?.member?.occupation,
                person: {
                    first_name: dataMember?.member?.person?.first_name,
                    second_name: dataMember?.member?.person?.second_name,
                    third_name: dataMember?.member?.person?.third_name,
                    tribe: dataMember?.member?.person?.tribe,
                    card_number: dataMember?.member?.person?.card_number,
                    date_birth: new Date(dataMember?.member?.person?.date_birth) || null,
                    phone: dataMember?.member?.person?.phone
                }
            })
            setIdPerson(dataMember?.member?.person?.id)
        }
    }, [dataMember])

    const onSubmit = (data: any) => {
        const {occupation, classification, membership_date, membership_date_end, paid, person } = data

        updateMember({
            variables: {
                id,
                idPerson: idPerson,
                content: {
                    occupation,
                    classification,
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: dayjs(membership_date_end).format("YYYY-MM-DD"),
                    paid,
                    person: {
                        ...person,
                        date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                    }
                }
            },
            refetchQueries: [AllTechnicals]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الاول"
                                placeholder="الاسم الاول"
                                withAsterisk
                                {...form.getInputProps("person.first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                withAsterisk
                                {...form.getInputProps("person.second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث"
                                placeholder="الاسم الثالث"
                                withAsterisk
                                {...form.getInputProps("person.third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="القبيلة"
                                placeholder="القبيلة"
                                withAsterisk
                                {...form.getInputProps("person.tribe")}
                            />
                        </Col>

                        <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                withAsterisk
                                {...form.getInputProps("person.phone")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                withAsterisk
                                {...form.getInputProps("person.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("person.date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الوظيفه"
                                placeholder="الوظيفه"
                                withAsterisk
                                {...form.getInputProps("occupation")}
                            />
                        </Col>

                        <Col span={6}>
                            <Select
                                label="التصنيف"
                                placeholder="التصنيف"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={['رئيس', 'نائب رئيس', 'عضو', 'أمين السر', 'أمين الصندوق']}
                                {...form.getInputProps("classification")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ العضويه"
                                placeholder="تاريخ العضويه"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("membership_date")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ  نهاية العضويه"
                                placeholder="تاريخ نهاية العضويه"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("membership_date_end")}
                            />
                        </Col>


                        <Col span={6}>
                            <Switch
                                labelPosition="left"
                                label="هل تم الدفع؟"
                                {...form.getInputProps("paid")}
                                styles={()=>({
                                    root: {
                                        marginTop: 22,
                                        border: "1px solid #9ca3af",
                                        borderRadius: 3,
                                        padding: "7px 10px"
                                    },
                                    body: {
                                        justifyContent: "space-between"
                                    }
                                })}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};