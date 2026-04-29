import {Box, Button, Col, Grid, Group, Select, Text, Textarea,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {useUpdateExpense, useExpense, AllExpense} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import {Dropzone, IMAGE_MIME_TYPE, PDF_MIME_TYPE } from "@mantine/dropzone";
import {Notyf} from "notyf";

type Props = {
    id: string;
} & ModalProps;

const init = {
    content: "",
    value: "",
    note: ""
}

export const UpdateExpenseModal = ({id, opened, ...props}: Props) => {
    const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [updateExpense] = useUpdateExpense();
    const [attachment, setAttachment] = useState<File[]>([]);
    const openRef = useRef<() => void>(null);

    const [getExpense, { data: dataExpense }] = useExpense();

    useEffect(() => {
        if (id && id !== "") {
            getExpense({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened])

    useEffect(() => {
        if (dataExpense && "expense" in dataExpense) {
            form.setValues({
                // @ts-ignore
                content: dataExpense?.expense?.value > 0 ? "1" :  "-1",
                value: dataExpense?.expense?.value > 0 ? dataExpense?.expense?.value :  dataExpense?.expense?.value * -1,
                note: dataExpense?.expense?.note
            })
        }
    }, [dataExpense])

    const onSubmit = (data: any) => {
        const {content, note, value } = data

        updateExpense({
            variables: {
                id,
                content: {
                    value: parseFloat(value) * parseInt(content),
                    attachment: attachment?.[0],
                    note,
                }
            },
            refetchQueries: [AllExpense]
        })
        .then(() => {
            notyf?.success("تم تعديل المصروف بنجاح");
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

                        <Col span={12}>
                            <Textarea
                                label="الملاحظة"
                                placeholder="اكتب ملاحظة او السبب ( اختيار )"
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