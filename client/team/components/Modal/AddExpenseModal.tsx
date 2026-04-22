import {Box, Button, Col, Grid, Group, Select, Text, Textarea, TextInput,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, { useRef, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddComment, Message, useAddExpense, AllExpense} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import {Notyf} from "notyf";
import {Dropzone, IMAGE_MIME_TYPE, PDF_MIME_TYPE, MS_WORD_MIME_TYPE, MS_EXCEL_MIME_TYPE} from "@mantine/dropzone";

type Props = {
    data?: any;
} & ModalProps;

export const AddExpenseModal = ({ data, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm();
    const [attachment, setAttachment] = useState<File[]>([]);
    const [createExpense] = useAddExpense();
    const openRef = useRef<() => void>(null);

    const onSubmit = ({content, note, value }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idTeam = userData?.person?.member?.team?.id

        createExpense({
            variables: {
                content: {
                    value: parseFloat(value) * parseInt(content),
                    note,
                    attachment: attachment?.[0],
                    id_team: idTeam
                }
            },
            refetchQueries: [AllExpense],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة المصروف بنجاح")
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
                            <Select
                                label="النوع"
                                placeholder="اختر النوع"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={[
                                    {label: "صادر", value: "1"},
                                    {label: "وارد", value: "-1"}
                                ]}

                                {...form.getInputProps("content")}
                            />
                        </Col>

                        <Col span={12}>
                            <TextInput
                                label="القيمة"
                                placeholder="القيمة"
                                type={"number"}
                                {...form.getInputProps("value")}
                            />
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                مرفق
                                {attachment && attachment?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setAttachment(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={20 * 1024 ** 2}
                                accept={[...IMAGE_MIME_TYPE, ...PDF_MIME_TYPE, ...MS_WORD_MIME_TYPE, ...MS_EXCEL_MIME_TYPE]}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>

                        <Col span={12}>
                            <Textarea
                                label="الملاحظة"
                                placeholder="اكتب ملاحظة او السبب ( اختياري )"
                                {...form.getInputProps("note")}
                                minRows={5}
                            />
                        </Col>

                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};