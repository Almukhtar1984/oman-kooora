import {Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Switch, Text,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import { Dropzone } from '@mantine/dropzone';
import React, {useRef, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTechnicals, AllTeams, useAddTechnical, useAddTeam} from "./../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

interface FormValues {
    occupation: string;
    classification: string;
    membership_date: Date | null;
    membership_date_end: Date | null;
    paid: boolean;
    person: {
        first_name: string;
        second_name: string;
        third_name: string;
        tribe: string;
        phone: string;
        card_number: string;
        date_birth: Date | null;
    }
}

const init: FormValues = {
    occupation: "",
    classification: "",
    membership_date: null,
    membership_date_end: null,
    paid: false,
    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: null
    }
}

export const AddTechnicalModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm<FormValues>({
        initialValues: init
    });

    React.useEffect(() => {
        if (props.data && typeof props.data === "object" && "person" in props.data && props.data.person) {
            const { person } = props.data;
            form.setValues({
                ...init,
                person: {
                    first_name: person?.first_name || "",
                    second_name: person?.second_name || "",
                    third_name: person?.third_name || "",
                    tribe: person?.tribe || "",
                    phone: person?.phone || "",
                    card_number: person?.card_number || "",
                    date_birth: person?.date_birth ? new Date(person?.date_birth) : null
                }
            });
        } else if (props.opened) {
            form.reset();
        }
    }, [props.data, props.opened]);

    const [file, setFile] = useState<File[] | null>(null);
    const openRef = useRef<() => void>(null);
    const [createTechnical] = useAddTechnical();
    const [load, setLoade] = useState(false);

    const onSubmit = (data: any) => {
        setLoade(true)
        const {occupation, classification, membership_date, membership_date_end, paid, person } = data
        const notyf = typeof window !== "undefined" ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;

        createTechnical({
            variables: {
                content: {
                    occupation,
                    classification,
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: dayjs(membership_date_end).format("YYYY-MM-DD"),
                    paid,
                    testimony_experience: file?.[0],
                    person: {
                        ...person,
                        date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                    },
                    id_team: userData?.person?.member?.team?.id
                }
            },
            refetchQueries: [AllTechnicals],
            onCompleted: () => {
                notyf?.success("تم إضافة العضو بنجاح");
                closeModal();
            },
            onError: ({graphQLErrors}) => {
                setLoade(false)
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf?.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                }

                if (graphQLErrors?.[0]?.extensions?.code == "PHONE_NUMBER_ALREADY_EXISTS") {
                    notyf?.open({message: "رقم الهاتف موجود مسبقا", type:"error", duration: 10000});
                }
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setFile(null)
        setLoade(false)
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button disabled={load} rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {load ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الاول"
                                placeholder="الاسم الاول"
                                withAsterisk
                                required
                                {...form.getInputProps("person.first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                withAsterisk
                                required
                                {...form.getInputProps("person.second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث"
                                placeholder="الاسم الثالث"
                                withAsterisk
                                required
                                {...form.getInputProps("person.third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="القبيلة"
                                placeholder="القبيلة"
                                withAsterisk
                                required
                                {...form.getInputProps("person.tribe")}
                            />
                        </Col>

                        <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                withAsterisk
                                required
                                {...form.getInputProps("person.phone")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                withAsterisk
                                required
                                {...form.getInputProps("person.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                required
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
                                required
                                {...form.getInputProps("occupation")}
                            />
                        </Col>

                        <Col span={6}>
                            <Select
                                label="التصنيف"
                                placeholder="التصنيف"
                                withAsterisk
                                required
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={['مدرب', 'مساعد مدرب', 'مدير الفريق', 'مدرب اللياقة',"مسؤول مهمات","مدرب حراس","طبي", "اعلامي"]}
                                {...form.getInputProps("classification")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ العقد "
                                placeholder="تاريخ العقد "
                                withAsterisk
                                required
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("membership_date")}
                            />
                        </Col>

                        <Col span={6}>
                            <DateInput
                                label="تاريخ  نهاية العقد "
                                placeholder="تاريخ نهاية العقد "
                                withAsterisk
                                required
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

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                شهاده الخبره تدريب (PDF)
                                {file && file.length > 0
                                    ? <Text size={"md"} fw={700} color={"green"} span={true} mx={5}>تم إضافة الملف</Text>
                                    : null
                                }
                            </Text>
                            <Dropzone
                                //placeholder={"شهاده الخبره تدريب"}
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setFile(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                accept={{
                                    'application/pdf': ['.pdf'],
                                }}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>

                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};