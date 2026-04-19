import {Box, Button, Col, Grid, Group, Loader, Overlay, TextInput, Stack, Text, Select, MultiSelect, Textarea,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "../../components/Modal/Modal";
import {AllStadium, useAddStadium} from "../../graphql";
import useStore from "../../store/useStore";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddStadium = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {
            name: "",
            about: "",
            type: "",
            attachments: "",
            rent: ""
        }
    });
    const [images, setImages] = useState<File[]>([]);
    const [attachmentsData, setAttachments] = useState(["حمام", "مصلى", "غرفه تغير ملابس", "شرب الماء"]);

    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");

    const openRef = useRef<() => void>(null);
    const [createStadium] = useAddStadium();

    const onFormSubmit = ({name, about, type, attachments, rent}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idTeam = userData?.person?.member?.team?.id

        setLoading(true)
        createStadium({
            variables: {
                content: {
                    name,
                    about,
                    type,
                    attachments: attachments.join(","),
                    rent: parseFloat(rent),
                    images: images,

                    id_team: idTeam
                }
            },
            refetchQueries: [AllStadium],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الملعب")
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        setImages([])
        setContent("")
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
                        <Col span={12} >
                            <TextInput
                                placeholder="اسم الملعب"
                                label="اسم الملعب"
                                withAsterisk
                                {...getInputProps("name")}
                            />
                        </Col>
                        <Col span={12} >
                            <Textarea
                                placeholder="نبذه عن الملعب"
                                label="نبذه عن الملعب"
                                withAsterisk
                                minRows={3}
                                maxRows={3}
                                {...getInputProps("about")}
                            />
                        </Col>
                        <Col span={12} >
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
                        <Col span={12} >
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
                        <Col span={12} >
                            <TextInput
                                placeholder="أيجار"
                                label="أيجار"
                                withAsterisk
                                {...getInputProps("rent")}
                            />
                        </Col>
                        {/*<Col span={12} >*/}
                        {/*    <DateTimePicker*/}
                        {/*        placeholder="تاريخ بداية الحجز"*/}
                        {/*        label="تاريخ بداية الحجز"*/}
                        {/*        withAsterisk*/}
                        {/*        {...getInputProps("booking_start")}*/}
                        {/*    />*/}
                        {/*</Col>*/}
                        {/*<Col span={12} >*/}
                        {/*    <DateTimePicker*/}
                        {/*        placeholder="تاريخ نهاية الحجز"*/}
                        {/*        label="تاريخ نهاية الحجز"*/}
                        {/*        withAsterisk*/}
                        {/*        {...getInputProps("booking_end")}*/}
                        {/*    />*/}
                        {/*</Col>*/}

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                صورة الملعب
                                {images && images?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
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
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار صورة / اسحب صورة الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};