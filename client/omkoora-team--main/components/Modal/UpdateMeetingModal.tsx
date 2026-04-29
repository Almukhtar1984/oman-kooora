import {Box, Button, Col, Grid, Group, Select, Text, Textarea,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {useUpdateMeeting, useMeeting, AllExpense, AllMeeting} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import {Dropzone, IMAGE_MIME_TYPE, MS_EXCEL_MIME_TYPE, MS_POWERPOINT_MIME_TYPE, MS_WORD_MIME_TYPE, PDF_MIME_TYPE} from "@mantine/dropzone";

type Props = {
    id: string;
} & ModalProps;

const init = {
    subject: "",
    names_attending: "",
    description: ""
}

export const UpdateMeetingModal = ({id, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const openRef = useRef<() => void>(null);
    const [updateMeeting] = useUpdateMeeting();

    const [getMeeting, { data: dataMeeting }] = useMeeting();

    useEffect(() => {
        if (id && id !== "") {
            getMeeting({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened])

    useEffect(() => {
        if (dataMeeting && "meeting" in dataMeeting) {
            form.setValues({
                // @ts-ignore
                subject: dataMeeting?.meeting?.subject,
                names_attending: dataMeeting?.meeting?.names_attending,
                description: dataMeeting?.meeting?.description
            })
        }
    }, [dataMeeting])

    const onSubmit = (data: any) => {
        const {subject, names_attending, description } = data

        updateMeeting({
            variables: {
                id,
                content: {
                    subject,
                    names_attending,
                    description,
                    attachment: attachments,
                }
            },
            refetchQueries: [AllMeeting]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
            console.log(reason)
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <TextInput
                                label="الموضوع"
                                placeholder="الموضوع"
                                {...form.getInputProps("subject")}
                            />
                        </Col>

                        <Col span={12}>
                            <Textarea
                                label="الاعضاء الحضور"
                                placeholder="العضو 1’ العضو 2 ...."
                                {...form.getInputProps("names_attending")}
                                minRows={2}
                            />
                        </Col>

                        <Col span={12}>
                            <Textarea
                                label="الوصف"
                                placeholder="الوصف ( اختيار )"
                                {...form.getInputProps("description")}
                                minRows={5}
                            />
                        </Col>


                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                المرفقات (اختياري). سيتم حذف المرفقات القديمة في حال قمت برفع مرفقات
                                {attachments && attachments?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={true}
                                onDrop={(file) => setAttachments(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={[...IMAGE_MIME_TYPE, ...PDF_MIME_TYPE, ...MS_WORD_MIME_TYPE, ...MS_EXCEL_MIME_TYPE, ...MS_POWERPOINT_MIME_TYPE]}
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