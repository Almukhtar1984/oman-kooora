import {Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddPlayer, AllPlayers} from "./../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {dateDiff } from "date-differencer";
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

interface FormValues {
    classes: string;
    activity: string;
    player_center: string;
    job: string;
    type: string;
    person: {
        first_name: string;
        second_name: string;
        third_name: string;
        tribe: string;
        phone: string;
        card_number: string;
        date_birth: string;
    }
}

const init: FormValues = {
    classes: "",
    activity: "",
    player_center: "",
    job: "",
    type: "", 
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

export const AddPlayersModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm<FormValues>({
        initialValues: init
    });
    const openRef = useRef<() => void>(null);
    const openRefBack = useRef<() => void>(null);
    const openRefParent = useRef<() => void>(null);
    const [nationalID, setNationalID] = useState<File[]>([]);
    const [nationalIDBack, setNationalIDBack] = useState<File[]>([]);
    const [cardNumberConfirmation, setCardNumberConfirmation] = useState("");
    const [parentApproval, setParentApproval] = useState<File[]>([]);
    const [age, setAge] = useState<Date | null>(new Date());


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
                    date_birth: person?.date_birth || ""
                }
            });
            setCardNumberConfirmation(person?.card_number || "");
            setAge(person?.date_birth ? new Date(person?.date_birth) : null);
        } else if (props.opened) {
            form.reset();
            setCardNumberConfirmation("");
            setAge(new Date());
        }
    }, [props.data, props.opened]);

    const [createPlayer] = useAddPlayer();
    const [load, setLoade] = useState(false);

    const onSubmit = (data: any) => {
        setLoade(true)
        const {classes, activity, player_center, job,type, person } = data
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
        console.log("form.values.person.card_number",form.values.person.card_number)
        if (form.values.person.card_number !== cardNumberConfirmation) {
            notyf?.error("الرقم المدني غير مطابق");
            setLoade(false);
            return;
        }
        
        createPlayer({
            variables: {
                content: {
                    class: classes,
                    activity,
                    player_center,
                    job,
                    type,
                    nationalID: nationalID?.[0],
                    nationalIDBack: nationalIDBack?.[0],
                    parentApproval: parentApproval?.[0],

                    person: {
                        ...person,
                        date_birth: dayjs(age).format("YYYY-MM-DD")
                    },
                    id_team: userData?.person?.member?.team?.id
                }
            },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                notyf?.success("تم إضافة اللاعب بنجاح");
                closeModal();
            },
            onError: ({graphQLErrors}) => {
                setLoade(false)
                console.log("graphQLErrors?.[0]?",graphQLErrors?.[0])
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf?.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                }

                if (graphQLErrors?.[0]?.extensions?.code == "PHONE_NUMBER_ALREADY_EXISTS") {
                    notyf?.open({message: "رقم الهاتف موجود مسبقا", type:"error", duration: 10000});
                }
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUBER_DONT_MATCH") {
                    notyf?.open({message: "الرقم المدني غير مطابق لي الصورة", type:"error", duration: 10000});
                }
              
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setNationalID([])
        setNationalIDBack([])
        setParentApproval([])
        setAge(null)
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
                                required
                                withAsterisk
                                {...form.getInputProps("person.first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                required
                                withAsterisk
                                {...form.getInputProps("person.second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث"
                                placeholder="الاسم الثالث"
                                required
                                withAsterisk
                                {...form.getInputProps("person.third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="القبيلة"
                                placeholder="القبيلة"
                                required
                                withAsterisk
                                {...form.getInputProps("person.tribe")}
                            />
                        </Col>

                        
                        <Col span={6}>
                            <TextInput
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                required
                                withAsterisk
                                {...form.getInputProps("person.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                        <TextInput
                            label="تأكيد الرقم المدني"
                            placeholder="تأكيد الرقم المدني"
                            required
                            withAsterisk
                            value={cardNumberConfirmation}
                            onChange={(event) => setCardNumberConfirmation(event.currentTarget.value)}
                        />
                        
                    </Col>
                    <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                required
                                withAsterisk
                                {...form.getInputProps("person.phone")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                required
                                valueFormat="MM/DD/YYYY"
                                value={age}
                                onChange={(value) => setAge(value)}
                                icon={<Calendar size={16} />}
                            />
                        </Col>


                        <Col span={6}>
                            <Select
                                label="الفئة العمرية"
                                placeholder="اختر الفئة العمرية"
                                withAsterisk
                                required
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}

                                data={[
                                    {label: "الفريق الاول", value: "firstDegree"},
                                    {label: "تحت 23 سنة", value: "secondDegree"},
                                    {label: "تحت 18 سنة", value: "young"},
                                    {label: "تحت 16 سنة", value: "rookies"}
                                ]}
                                
                                {...form.getInputProps("classes")}
                            />
                        </Col>

                        <Col span={6}>
                                <Select
                                    label="النشاط"
                                    placeholder="اختر النشاط"
                                    withAsterisk
                                    required
                                    rightSection={<ChevronDown size={14} />}
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}
                                    data={[{ label: "كرة القدم", value: "كرة القدم" }]} // Single selectable option
                                    {...form.getInputProps("activity")}
                                />
                            </Col>
                        <Col span={6}>
                            <Select
                                label="مركز لاعب"
                                placeholder="مركز لاعب"
                                withAsterisk
                                required    
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={['مهاجم', 'وسط', 'دفاع', 'حارس']}
                                {...form.getInputProps("player_center")}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="العمل"
                                placeholder="العمل"
                                withAsterisk
                                required
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={['طالب', 'باحث عن العمل', 'موظف']}
                                {...form.getInputProps("job")}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="نوع اللاعب"
                                placeholder="نوع اللاعب"
                                withAsterisk
                                required
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={[
                                { label: "محترف", value: "external" },
                                { label: "داخلي", value: "internal" }
                                ]}
                                {...form.getInputProps("type")}
                            />
                            </Col>


                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                مرفق صورة الواجهة الامامية للبطاقة المدنية (image)
                                {nationalID && nationalID?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setNationalID(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                مرفق صورة الواجهة الخلفية للبطاقة المدنية (image)
                                {nationalIDBack && nationalIDBack?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRefBack}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setNationalIDBack(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRefBack ? openRefBack?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>

                        {age && dateDiff(age, new Date())?.years < 18 ?
                            <Col span={12} >
                                <Text size={"sm"} mb={10} >استمارة موافقة ولي الامر (PDF)</Text>
                                <Dropzone
                                    openRef={openRefParent}
                                    activateOnClick={false}
                                    multiple={false}
                                    onDrop={(file) => setParentApproval(file)}
                                    styles={{ inner: { pointerEvents: 'all' } }}
                                    accept={{'application/pdf': ['.pdf'],}}
                                >
                                    <Group position="center">
                                        <Button onClick={() => {
                                            // @ts-ignore
                                            return openRefParent ? openRefParent?.current() : undefined
                                        }}>اختار ملف / اسحب ملف الى هنا</Button>
                                    </Group>
                                </Dropzone>
                            </Col>
                            : null
                        }
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};