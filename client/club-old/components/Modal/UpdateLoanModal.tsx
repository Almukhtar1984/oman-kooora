import React, { useEffect } from "react";
import { Box, Button, Col, Grid, Group } from "@mantine/core";
import { Calendar, Check, X } from "tabler-icons-react";
import Modal, { Props as ModalProps } from "./Modal"; // Ensure this path is correct
import { useUpdateLoan } from "../../graphql"; // Ensure this path is correct
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import { Notyf } from "notyf";
import { AllPlayersClubLoan } from "../../graphql";

type Props = {
    data: any; // The loan data to update
} & ModalProps;

export const UpdateLoanModal = ({ data, opened, onClose }: Props) => {
    const form = useForm({
        initialValues: {
            date_start: data?.date_start ? new Date(data.date_start) : null,
            date_end: data?.date_end ? new Date(data.date_end) : null,
        },
    });

    const [updateLoan] = useUpdateLoan();

    const onSubmit = async (formData: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const { date_start, date_end } = formData;

        try {
            await updateLoan({
                variables: {
                    id: data?.id,
                    date_start: date_start ? dayjs(date_start).format("YYYY-MM-DD") : "",
                    date_end: date_end ? dayjs(date_end).format("YYYY-MM-DD") : "",
                },
                refetchQueries: [AllPlayersClubLoan]
            });
            notyf.success("تم تحديث بيانات الإعارة بنجاح");
            closeModal();
        } catch (error) {
            console.error("Error updating loan:", error);
            notyf.error("حدث خطأ أثناء تحديث بيانات الإعارة");
        }
    };

    const closeModal = () => {
        onClose();
        form.reset();
    };

    useEffect(() => {
        if (opened) {
            form.setValues({
                date_start: data?.date_start ? new Date(data.date_start) : null,
                date_end: data?.date_end ? new Date(data.date_end) : null,
            });
        }
    }, [opened, data]);

    return (
        <Modal
            opened={opened}
            onClose={closeModal}
            title="إعارة اللاعب"
            footer={
                <Box py={16} px={20}>
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} onClick={closeModal}>
                            الغاء
                        </Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="update_form">
                        تاكيد
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={{ padding: 20, minHeight: 200 }}>
                <form onSubmit={form.onSubmit(onSubmit)} id="update_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <DateInput
                                label="تاريح بداية الإعارة
"
                                placeholder="MM/DD/YYYY"
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("date_start")}
                                clearable
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريح نهاية الإعارة"
                                placeholder="MM/DD/YYYY"
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("date_end")}
                                clearable
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
