import {Box, Button, Col, Grid, Group, Loader, Overlay, TextInput, Stack, Text, Select, Textarea, MultiSelect,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "../../components/Modal/Modal";
import {AllStadium, useUpdateStadium} from "../../graphql";
import useStore from "../../store/useStore";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateStadium = (props: Props) => {
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
                attachments: props.data?.attachments?.split(","),
                rent: props.data?.rent,
            })

            const result = uniqueElements(props.data?.attachments?.split(","), attachmentsData);

            setAttachments((prevState) => [...prevState, ...result])

        }
    }, [props.data, props.opened, attachmentsData, setValues]);

    const uniqueElements = (arr1, arr2) => {
        const uniqueArr1 = arr1.filter(item => !arr2.includes(item));
        const uniqueArr2 = arr2.filter(item => !arr1.includes(item));
        return [...uniqueArr1, ...uniqueArr2];
    };

    const onFormSubmit = ({name, about, type, attachments, rent, booking_start, booking_end}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        setLoading(true)
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
                }
            },
            refetchQueries: [AllStadium],
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل الملعب")
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        setAttachments([])
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
