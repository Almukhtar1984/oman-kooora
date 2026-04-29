import {Box, Button, Col, Grid, Group, Select, Text, Textarea, TextInput,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddMeeting, AllMeeting} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import {Notyf} from "notyf";
import {Dropzone, IMAGE_MIME_TYPE, MS_EXCEL_MIME_TYPE, MS_POWERPOINT_MIME_TYPE, MS_WORD_MIME_TYPE, PDF_MIME_TYPE} from "@mantine/dropzone";


type Props = {
    data?: any;
} & ModalProps;

export const AddMeetingModal = ({ data, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm();
    const [attachments, setAttachments] = useState<File[]>([]);
    const openRef = useRef<() => void>(null);

    const [createMeeting] = useAddMeeting();

    const onSubmit = ({subject, names_attending, description }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        createMeeting({
            variables: {
                content: {
                    subject,
                    names_attending,
                    description,
                    id_club: idClub,
                    attachment: attachments,
                }
            },
            refetchQueries: [AllMeeting],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة محضر الاجتماع")
            },
            onError: ({graphQLErrors}) => {

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
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
            zIndex={205}
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
                                المرفقات (اختياري)
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