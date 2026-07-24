import {Box, Button, Col, Grid, Group, Loader, Overlay, Stack, Text,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTechnicals, useAddAttachmentTechnical} from "../../graphql";
import {Dropzone, IMAGE_MIME_TYPE, PDF_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";

type Props = {
    id: any
} & ModalProps;

// Upload attachments for a technical-staff member. Mirrors the player
// attachment modal (guard on empty, success/error toasts, loading overlay).
export const AddAttachmentTechnicalModal = (props: Props) => {
    const openRef = useRef<() => void>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [createAttachmentTechnical] = useAddAttachmentTechnical();
    const [load, setLoade] = useState(false);

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        if (!attachments.length) {
            notyf.open({ message: "يرجى اختيار ملف واحد على الأقل", type: "error", duration: 6000 });
            return;
        }
        if (!props.id) {
            notyf.open({ message: "تعذّر تحديد عضو الجهاز الفني", type: "error", duration: 6000 });
            return;
        }

        setLoade(true);

        createAttachmentTechnical({
            variables: {
                attachments: attachments,
                idTechnical: props.id
            },
            refetchQueries: [AllTechnicals],
            onCompleted: () => {
                setLoade(false);
                notyf.success("تم إضافة المرفقات بنجاح");
                closeModal();
            },
            onError: (error) => {
                setLoade(false);
                const message = error?.graphQLErrors?.[0]?.message || "فشل اضافة المرفقات";
                notyf.open({ message, type: "error", duration: 10000 });
            }
        });
    };

    const closeModal = () => {
        props.onClose();
        setAttachments([]);
        setLoade(false);
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button disabled={load} rightIcon={<Check size={15} />} onClick={onSubmit}>تأكيد</Button>
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
                <form id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                المرفقات
                                {attachments && attachments?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={true}
                                onDrop={(file) => setAttachments(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={[...IMAGE_MIME_TYPE, ...PDF_MIME_TYPE]}
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
