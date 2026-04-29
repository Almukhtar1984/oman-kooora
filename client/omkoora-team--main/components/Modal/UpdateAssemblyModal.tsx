import {Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllAssembly, useAddAssembly, useUpdateAssembly} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput} from "@mantine/dates";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {searchSortedData} from "../../lib/helpers/sort";
import dayjs from "dayjs";

type Props = {
    data: any
} & ModalProps;


export const UpdateAssemblyModal = ({data, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm();
    const [nationalID, setNationalID] = useState<File[]>([]);
    const [nationalIDBack, setNationalIDBack] = useState<File[]>([]);
    const [personalPicture, setPersonalPicture] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const openRef = useRef<() => void>(null);
    const openRefBack = useRef<() => void>(null);
    const openRefPicture = useRef<() => void>(null);
    const [updateAssembly] = useUpdateAssembly();

    useEffect(() => {
        if (data) {
            setValues({
                first_name:     data.first_name,
                second_name:    data.second_name,
                third_name:     data.third_name,
                tribe:          data.tribe,

                date_birth:     new Date(data?.date_birth),
                card_number:    data.card_number,
                phone:          data.phone,
                type:           data.type,
                membership_date: new Date(data?.membership_date),
                gender:         data.gender,
                subscription_date:     new Date(data?.subscription_date)
            })
        }
    }, [data, props.opened]);

    const onFormSubmit = ({first_name, second_name, third_name, tribe, date_birth, card_number, phone, type, membership_date, gender, subscription_date}: any) => {
        setLoading(true)
        updateAssembly({
            variables: {
                id: data?.id,
                content: {
                    first_name,
                    second_name,
                    third_name,
                    tribe,
                    date_birth: dayjs(date_birth).format("YYYY-MM-DD"),
                    card_number,
                    phone,
                    type,

                    nationalID: nationalID?.[0] || null,
                    nationalIDBack: nationalIDBack?.[0] || null,
                    personal_picture: personalPicture?.[0] || null,
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    gender,
                    subscription_date: dayjs(subscription_date).format("YYYY-MM-DD")
                }
            },
            refetchQueries: [AllAssembly],
            onCompleted: () => {
                closeModal();
            },
            onError: (error) => {
                console.log(error)
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        setNationalID([])
        props.onClose();
        reset();
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
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الاول"
                                placeholder="الاسم الاول"
                                withAsterisk
                                {...getInputProps("first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                withAsterisk
                                {...getInputProps("second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث"
                                placeholder="الاسم الثالث"
                                withAsterisk
                                {...getInputProps("third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="القبيلة"
                                placeholder="القبيلة"
                                withAsterisk
                                {...getInputProps("tribe")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...getInputProps("date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                withAsterisk
                                {...getInputProps("card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                withAsterisk
                                {...getInputProps("phone")}
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
                                {...getInputProps("type")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ العضويه"
                                placeholder="تاريخ العضويه"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...getInputProps("membership_date")}
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
                                {...getInputProps("gender")}
                            />
                        </Col>

                        <Col span={6}>
                            <DateInput
                                label="تاريخ  الاشتراك"
                                placeholder="تاريخ الاشتراك"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...getInputProps("subscription_date")}
                            />
                        </Col>


                        <Col span={12} >
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
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};