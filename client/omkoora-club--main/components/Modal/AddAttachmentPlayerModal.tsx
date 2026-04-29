import {Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddPlayer, AllPlayers, useAddAttachmentPlayer} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import {Dropzone, IMAGE_MIME_TYPE, PDF_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";

type Props = {
    id: any
} & ModalProps;


export const AddAttachmentPlayerModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const openRef = useRef<() => void>(null);
    const [attachments, setAttachments] = useState<File[]>([]);

    const [createAttachmentPlayer] = useAddAttachmentPlayer();
    const [load, setLoade] = useState(false);

    const onSubmit = () => {
        setLoade(true)
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        console.log({
            attachments: attachments,
            idPlayer: props.id
        });
        
        createAttachmentPlayer({
            variables: {
                attachments: attachments,
                idPlayer: props.id
            },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                closeModal();
                notyf.success("تم إضافة المرفقات بنجاح")
            },
            onError: ({graphQLErrors}) => {
                setLoade(false)
                notyf.open({message: "فشل اضافة المرفقات", type:"error", duration: 10000});
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        setAttachments([])
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