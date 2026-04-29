import {Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllAssembly, useAddAssembly} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput} from "@mantine/dates";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";

type Props = {
    setSelectedData?: (id: string) => void;
    onCompleted?: () => void;
    data?: any;
} & ModalProps;


export const AddAssemblyModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm<{
        first_name: string;
        second_name: string;
        third_name: string;
        tribe: string;
        date_birth: Date | null;
        card_number: string;
        phone: string;
        type: string;
        membership_date: Date | null;
        gender: string;
        subscription_date: Date | null;
    }>({
        initialValues: {
            first_name: "",
            second_name: "",
            third_name: "",
            tribe: "",
            date_birth: null,
            card_number: "",
            phone: "",
            type: "",
            membership_date: null,
            gender: "",
            subscription_date: null
        }
    });
    const [nationalID, setNationalID] = useState<File[]>([]);
    const [nationalIDBack, setNationalIDBack] = useState<File[]>([]);
    const [personalPicture, setPersonalPicture] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [oldNationalID, setOldNationalID] = useState("");
    const [oldNationalIDBack, setOldNationalIDBack] = useState("");
    const [oldPersonalPicture, setOldPersonalPicture] = useState("");
    const openRef = useRef<() => void>(null);
    const openRefBack = useRef<() => void>(null);
    const openRefPicture = useRef<() => void>(null);
    const [createAssembly] = useAddAssembly();

    useEffect(() => {
        if (props.opened && props.data) {
            // Handle both { person: {...} } and {...} structures
            const person = props.data.person || props.data;
            
            if (person && person.card_number) {
                form.setValues({
                    first_name:     person?.first_name || "",
                    second_name:    person?.second_name || "",
                    third_name:     person?.third_name || "",
                    tribe:          person?.tribe || "",

                    date_birth:     person?.date_birth ? new Date(person.date_birth) : null,
                    card_number:    person?.card_number || "",
                    phone:          person?.phone || "",
                    type:           "",
                    membership_date: null,
                    gender:         "",
                    subscription_date:     null
                });

                setOldNationalID(person?.player?.nationalID || "");
                setOldNationalIDBack(person?.player?.nationalIDBack || "");
                setOldPersonalPicture(person?.personal_picture || "");
            }
        } else if (props.opened && !props.data) {
             form.reset();
             setOldNationalID("");
             setOldNationalIDBack("");
             setOldPersonalPicture("");
        }
    }, [props.data, props.opened]);

    const onFormSubmit = ({first_name, second_name, third_name, tribe, date_birth, card_number, phone, type, membership_date, gender, subscription_date}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        setLoading(true)
        createAssembly({
            variables: {
                content: {
                    first_name,
                    second_name,
                    third_name,
                    tribe,
                    date_birth,
                    card_number,
                    phone,
                    type,

                    nationalID: nationalID?.[0],
                    nationalIDBack: nationalIDBack?.[0],
                    personal_picture: personalPicture?.[0],

                    oldNationalID: oldNationalID === "" ? null : oldNationalID,
                    oldNationalIDBack: oldNationalIDBack === "" ? null : oldNationalIDBack,
                    oldPersonalPicture: oldPersonalPicture === "" ? null : oldPersonalPicture,

                    membership_date,
                    gender,
                    subscription_date,

                    id_club: userData?.person?.clubManagement?.club?.id
                }
            },
            refetchQueries: [AllAssembly],
            onCompleted: () => {
                closeModal();
                props.onCompleted?.();
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                }
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        setNationalID([])
        props.onClose();
        form.reset();
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
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الاول"
                                placeholder="الاسم الاول"
                                withAsterisk
                                {...form.getInputProps("first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                withAsterisk
                                {...form.getInputProps("second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث"
                                placeholder="الاسم الثالث"
                                withAsterisk
                                {...form.getInputProps("third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="القبيلة"
                                placeholder="القبيلة"
                                withAsterisk
                                {...form.getInputProps("tribe")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                withAsterisk
                                {...form.getInputProps("card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                withAsterisk
                                {...form.getInputProps("phone")}
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
                                data={['الجمعيه العاملين', 'الجمعيه الرياضيه', 'الجمعيه الثقافيه', 'الجمعيه الفخرية']}
                                {...form.getInputProps("type")}
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
                            <Select
                                label="الجنس"
                                placeholder="الجنس"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={[{label: "ذكر", value: "male"}, {label: "أنثى", value: "female"}]}
                                {...form.getInputProps("gender")}
                            />
                        </Col>

                        <Col span={6}>
                            <DateInput
                                label="تاريخ  الاشتراك"
                                placeholder="تاريخ الاشتراك"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("subscription_date")}
                            />
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} color={"green"} mb={10} >
                                {oldPersonalPicture && oldPersonalPicture !== "" ? "موجود صورة شخصية بالفعل" : null}
                            </Text>
                            <Text size={"sm"} mb={10} >
                                مرفق صورة شخصية (image)
                                {personalPicture && personalPicture?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRefPicture}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setPersonalPicture(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRefPicture ? openRefPicture?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>


                        <Col span={12} >
                            <Text size={"sm"} color={"green"} mb={10} >
                                {oldNationalID && oldNationalID !== "" ? "موجود بطاقة هوية بالفعل" : null}
                            </Text>
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
                            <Text size={"sm"} color={"green"} mb={10} >
                                {oldNationalIDBack && oldNationalIDBack !== "" ? "موجود بطاقة هوية بالفعل" : null}
                            </Text>
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
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};