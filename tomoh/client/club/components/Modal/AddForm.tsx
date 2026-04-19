import {Box, Button, Col, Grid, Group, Loader, Overlay, TextInput, Stack, Text} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllForm, useAddForm } from "../../graphql";
import useStore from "../../store/useStore";
import {Dropzone, IMAGE_MIME_TYPE, MS_WORD_MIME_TYPE, MS_EXCEL_MIME_TYPE, PDF_MIME_TYPE, MS_POWERPOINT_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";


type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddForm = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {subject: "", short_description: ""}
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);

    const openRef = useRef<() => void>(null);
    const [createForm] = useAddForm();

    const onFormSubmit = ({subject, short_description}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        setLoading(true)
        createForm({
            variables: {
                content: {
                    subject,
                    file: attachments?.[0],
                    id_club: idClub
                }
            },
            refetchQueries: [AllForm],
            onCompleted: () => {
                closeModal();
                notyf.success("تم ارسال الرسالة")
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
                                placeholder="العنوان"
                                label="العنوان"
                                withAsterisk
                                {...getInputProps("subject")}
                            />
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                الاستمارة
                                {attachments && attachments.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setAttachments(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={[...IMAGE_MIME_TYPE, ...MS_WORD_MIME_TYPE, ...MS_EXCEL_MIME_TYPE, ...PDF_MIME_TYPE, ...MS_POWERPOINT_MIME_TYPE]}
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