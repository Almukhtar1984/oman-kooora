import {Box, Button, Col, Grid, Group, Select, Divider, Text, Switch, FileInput} from "@mantine/core";
import {Calendar, Check, ChevronDown, X, Upload} from "tabler-icons-react";
import React, {useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTechnicals, useAddTechnical} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput} from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import {Notyf} from "notyf";

type Props = {
    id: any;
    onCompleted?: () => void;
} & ModalProps;

const init = {
    occupation: "",
    classification: "",
    membership_date: "",
    membership_date_end: "",
    paid: false,

    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: ""
    }
}

export const AddTechnicalModal = ({ id, ...props }: Props) => {
    const [testimonyExperience, setTestimonyExperience] = useState<File | null>(null);
    const form = useForm({
        initialValues: init
    });
    const [createTechnical] = useAddTechnical();

    const onSubmit = (data: any) => {
        const {occupation, classification, membership_date, membership_date_end, paid, person } = data
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        createTechnical({
            variables: {
                content: {
                    occupation,
                    classification,
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: membership_date_end ? dayjs(membership_date_end).format("YYYY-MM-DD") : undefined,
                    paid: paid,
                    testimony_experience: testimonyExperience,
                    person: {
                        ...person,
                        date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                    },
                    id_team: id
                }
            },
            refetchQueries: [AllTechnicals],
            onCompleted: () => {
                closeModal();
                notyf.success("تم إضافة عضو الجهاز فني بنجاح")
                props.onCompleted?.()
            },
            onError: ({graphQLErrors}) => {
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                }
                if (graphQLErrors?.[0]?.extensions?.code == "PHONE_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهاتف موجود مسبقا", type:"error", duration: 10000});
                }
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="add_technical_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="add_technical_form">
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
                                label="الوظيفة"
                                placeholder="الوظيفة"
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
                                data={['مدرب', 'مساعد مدرب', 'اداري', 'اخصائي علاج طبيعي']}
                                {...form.getInputProps("classification")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ العقد"
                                placeholder="تاريخ العقد"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("membership_date")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ نهاية العقد"
                                placeholder="تاريخ نهاية العقد"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("membership_date_end")}
                            />
                        </Col>

                        <Col span={12}>
                             <Group position="apart">
                                <Text size="sm" weight={500}>هل تم الدفع؟</Text>
                                <Switch 
                                    {...form.getInputProps("paid", { type: 'checkbox' })}
                                />
                             </Group>
                        </Col>

                        <Col span={12}>
                             <FileInput
                                label="شهادة الخبره تدريب (PDF)"
                                placeholder="اختار ملف / اسحب ملف الى هنا"
                                icon={<Upload size={14} />}
                                value={testimonyExperience}
                                onChange={setTestimonyExperience}
                                accept="application/pdf"
                                withAsterisk
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
