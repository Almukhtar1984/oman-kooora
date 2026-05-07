import {Box, Button, Col, Grid, Group, Select, Divider, Text, FileInput} from "@mantine/core";
import {Calendar, Check, ChevronDown, X, Upload} from "tabler-icons-react";
import React, {useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, useAddPlayer} from "../../graphql";
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
    activity: "",
    player_center: "",
    job: "",
    class: "",
    type: "",

    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        confirm_card_number: "",
        date_birth: ""
    }
}

export const AddPlayerModal = ({ id, ...props }: Props) => {
    const [nationalID, setNationalID] = useState<File | null>(null);
    const [nationalIDBack, setNationalIDBack] = useState<File | null>(null);
    const [parentApproval, setParentApproval] = useState<File | null>(null);

    const form = useForm({
        initialValues: init,
        validate: {
            person: {
                confirm_card_number: (value, values) => value !== values.person.card_number ? 'رقم المدني غير متطابق' : null,
            }
        }
    });
    const [createPlayer] = useAddPlayer();

    const onSubmit = (data: any) => {
        const {activity, player_center, job, person, type, class: className } = data
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        createPlayer({
            variables: {
                content: {
                    activity,
                    player_center,
                    job,
                    type,
                    class: className,
                    nationalID,
                    nationalIDBack,
                    parentApproval,
                    person: {
                        first_name: person.first_name,
                        second_name: person.second_name,
                        third_name: person.third_name,
                        tribe: person.tribe,
                        phone: person.phone,
                        card_number: person.card_number,
                        date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                    },
                    id_team: id
                }
            },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                closeModal();
                notyf.success("تم إضافة اللاعب بنجاح")
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="add_player_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="add_player_form">
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
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                withAsterisk
                                {...form.getInputProps("person.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="تأكيد الرقم المدني"
                                placeholder="تأكيد الرقم المدني"
                                withAsterisk
                                {...form.getInputProps("person.confirm_card_number")}
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
                             <Select
                                label="الفئة العمرية"
                                placeholder="اختر الفئة العمرية"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                data={[
                                    { label: 'الدرجة الاولى', value: 'firstDegree' },
                                    { label: 'الدرجة الثانية', value: 'secondDegree' },
                                    { label: 'الشباب', value: 'young' },
                                    { label: 'الناشئين', value: 'rookies' },
                                ]}
                                {...form.getInputProps("class")}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="النشاط"
                                placeholder="اختر النشاط"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                data={[
                                    { label: 'كرة القدم', value: 'كرة القدم' },
                                    { label: 'كرة السلة', value: 'كرة السلة' },
                                    { label: 'كرة اليد', value: 'كرة اليد' },
                                    { label: 'كرة الطائرة', value: 'كرة الطائرة' },
                                ]}
                                {...form.getInputProps("activity")}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="مركز لاعب"
                                placeholder="مركز لاعب"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                data={[
                                    { label: 'حارس مرمى', value: 'حارس مرمى' },
                                    { label: 'مدافع', value: 'مدافع' },
                                    { label: 'وسط', value: 'وسط' },
                                    { label: 'هجوم', value: 'هجوم' },
                                ]}
                                {...form.getInputProps("player_center")}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="العمل"
                                placeholder="العمل"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                data={[
                                    { label: 'طالب', value: 'طالب' },
                                    { label: 'موظف', value: 'موظف' },
                                    { label: 'أعمال حرة', value: 'أعمال حرة' },
                                    { label: 'غير ذلك', value: 'غير ذلك' },
                                ]}
                                {...form.getInputProps("job")}
                            />
                        </Col>
                        <Col span={6}>
                             <Select
                                label="نوع اللاعب"
                                placeholder="نوع اللاعب"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                 data={[
                                    { label: 'محلي', value: 'internal' },
                                    { label: 'محترف', value: 'external' },
                                ]}
                                {...form.getInputProps("type")}
                            />
                        </Col>

                        <Col span={12}>
                            <FileInput
                                label="مرفق صورة الواجهة الامامية للبطاقة المدنية (image)"
                                placeholder="اختار ملف / اسحب ملف الى هنا"
                                icon={<Upload size={14} />}
                                value={nationalID}
                                onChange={setNationalID}
                                accept="image/*"
                                withAsterisk
                            />
                        </Col>
                        <Col span={12}>
                            <FileInput
                                label="مرفق صورة الواجهة الخلفية للبطاقة المدنية (image)"
                                placeholder="اختار ملف / اسحب ملف الى هنا"
                                icon={<Upload size={14} />}
                                value={nationalIDBack}
                                onChange={setNationalIDBack}
                                accept="image/*"
                                withAsterisk
                            />
                        </Col>
                        <Col span={12}>
                            <FileInput
                                label="استمارة موافقة ولي الامر (PDF)"
                                placeholder="اختار ملف / اسحب ملف الى هنا"
                                icon={<Upload size={14} />}
                                value={parentApproval}
                                onChange={setParentApproval}
                                accept="application/pdf"
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
