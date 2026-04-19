import {Box, Button, Col, Grid, Group, Select, Textarea, TextInput,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddComment, Message, useAddExpense, AllExpense} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const AddExpenseModal = ({ data, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm();
    const [createExpense] = useAddExpense();

    const onSubmit = ({content, note, value }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        createExpense({
            variables: {
                content: {
                    value: parseFloat(value) * parseInt(content),
                    note,
                    id_club: idClub
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