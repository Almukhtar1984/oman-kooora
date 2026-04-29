import { Box, Button, Col, Grid, Group, Loader, Overlay, TextInput, Stack, Text, Select, Textarea, MultiSelect } from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "../../components/Modal/Modal";
import { AllStadium, useUpdateStadium } from "../../graphql";
import useStore from "../../store/useStore";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Notyf } from "notyf";
import { TimeInput } from '@mantine/dates';

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateStadium = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const { getInputProps, reset, onSubmit, setValues } = useForm({
        initialValues: {
            name: "",
            about: "",
            type: "",
            attachments: [],
            rent: "",
            booking_start: null,
            booking_end: null,
            mohafada: "",
            wiliya: "",
        }
    });
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [attachmentsData, setAttachments] = useState(["حمام", "مصلى", "غرفه تغير ملابس", "شرب الماء"]);
    
    const openRef = useRef<() => void>(null);
    const [updateStadium] = useUpdateStadium();

    useEffect(() => {
        if (props.data) {
            setValues({
                name: props.data?.name,
                about: props.data?.about,
                type: props.data?.type,
                attachments: props.data?.attachments?.split(",") || [],
                rent: props.data?.rent,
                booking_start: props.data?.booking_start || null,
                booking_end: props.data?.booking_end || null,
                mohafada: props.data?.mohafada || "",
                wiliya: props.data?.wiliya || "",
            });
        }
    }, [props.data, props.opened]);

    const onFormSubmit = ({ name, about, type, attachments, rent, booking_start, booking_end, mohafada, wiliya }: any) => {
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
        setLoading(true);
        updateStadium({
            variables: {
                id: props?.data?.id,
                content: {
                    name,
                    about,
                    type,
                    attachments: attachments.join(","),
                    rent: parseFloat(rent),
                    images: images,
                    start_time: booking_start,
                    end_time: booking_end,
                    mohafada,
                    wiliya,
                }
            },
            refetchQueries: [AllStadium],
            onCompleted: () => {
                closeModal();
                notyf?.success("تم تعديل الملعب");
            },
            onError: ({ graphQLErrors }) => {
                setLoading(false);
            }
        });
    };

    const closeModal = () => {
        setLoading(false);
        setImages([]);
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
                <Overlay opacity={0.9} color="#fff" zIndex={5}>
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({ padding: 20 })}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <TextInput
                                placeholder="اسم الملعب"
                                label="اسم الملعب"
                                withAsterisk
                                {...getInputProps("name")}
                            />
                        </Col>
                        <Col span={12}>
                            <Textarea
                                placeholder="نبذه عن الملعب"
                                label="نبذه عن الملعب"
                                withAsterisk
                                minRows={3}
                                maxRows={3}
                                {...getInputProps("about")}
                            />
                        </Col>
                        <Col span={12}>
                            <Select
                                label="نوع العشب"
                                placeholder="نوع العشب"
                                withAsterisk
                                data={[
                                    { value: 'natural', label: 'طبيعي' },
                                    { value: 'artificial', label: 'صناعي' }
                                ]}
                                {...getInputProps("type")}
                            />
                        </Col>
                        <Col span={12}>
                            <MultiSelect
                                placeholder="المرفقات"
                                label="المرفقات"
                                data={attachmentsData}
                                searchable
                                nothingFound="لا توجد بيانات"
                                creatable
                                getCreateLabel={(query) => `+ اضافة ${query} الى الخيارات`}
                                onCreate={(query) => {
                                    setAttachments((current) => [...current, query]);
                                    return query;
                                }}
                                {...getInputProps("attachments")}
                            />
                        </Col>
                        <Col span={12}>
                            <TextInput
                                placeholder="أيجار"
                                label="أيجار"
                                withAsterisk
                                {...getInputProps("rent")}
                            />
                        </Col>
                        <Col span={12}>
                            <TimeInput
                                label="وقت بداية الحجز"
                                placeholder="اختر وقت"
                                withAsterisk
                                {...getInputProps("booking_start")}
                            />
                        </Col>
                        <Col span={12}>
                            <TimeInput
                                label="وقت نهاية الحجز"
                                placeholder="اختر وقت"
                                withAsterisk
                                {...getInputProps("booking_end")}
                            />
                        </Col>
                        <Col span={12}>
                            <Select
                                label="المحافظة"
                                placeholder="اختر محافظة"
                                withAsterisk
                                data={[
                                    'ظفار', 'مسندم', 'البريمي', 'الداخلية', 'الباطنة',
                                    'شمال الشرقية', 'الجنوبية الشرقية', 'الظاهرة', 'الوسطى', 'مسقط'
                                ]}
                                {...getInputProps("mohafada")}
                            />
                        </Col>
                        <Col span={12}>
                            <Select
                                label="الولاية"
                                placeholder="اختر ولاية"
                                withAsterisk
                                data={[
                                    "شليم وجزر الحلانيات", "مقشن", "طاقة", "ثمريت", "صلالة",
                                    "رخيوت", "ضلكوت", "المزيونة", "مرباط", "خصب", "بخا", "دباء",
                                    "مدحاء", "محضة", "البريمي", "السنينة", "بهلا", "سمائل", "أدم",
                                    "إزكي", "منح", "بديد", "الحمراء", "نزوى", "لوى", "السويق",
                                    "صحم", "شناص", "صحار", "الخابورة", "نخل", "بركاء", "الرستاق",
                                    "العوابي", "المصنعة", "وادي المعاول", "إبراء", "المضيبي",
                                    "بدية", "القابل", "وادي بني خالد", "دماء والطائيين", "صور",
                                    "الكامل والوافي", "جعلان بني بو حسن", "جعلان بني بو علي",
                                    "مصيرة", "عبري", "ينقل", "ضنك", "هيما", "الدقم", "محوت",
                                    "الجازر", "العامرات", "السيب", "بوشر", "مسقط", "مطرح", "قريات"
                                ]}
                                {...getInputProps("wiliya")}
                            />
                        </Col>
                        <Col span={12}>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={true}
                                onDrop={(file) => setImages(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => openRef.current?.()}>اختار صورة / اسحب صورة الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
