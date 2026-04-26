import { Box, Button, Group, Text, Select,Alert,Col } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Calendar, Check, X, ChevronDown } from "tabler-icons-react";
import React, { useState } from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import { useConvertPlayerToTechnical, AllPlayers } from "../../graphql";

type Props = {
    id?: string;
    data?: any;
} & ModalProps;

export const ConvertPlayerToTechnicalModal = ({ id, ...props }: Props) => {
    const [convertPlayerToTechnical] = useConvertPlayerToTechnical();

    const form = useForm({
        initialValues: {
            classification: "",
            membershipDate: null as Date | null,
            membershipDateEnd: null as Date | null,
        },
        validate: {
            classification: (value) => (value ? null : "يجب اختيار التصنيف"),
            membershipDate: (value) => (value ? null : "يجب تحديد تاريخ العضوية"),
            membershipDateEnd: (value) => (value ? null : "يجب تحديد تاريخ انتهاء العضوية"),
        },
    });

    const onSubmit = () => {
        if (!id) return;

        if (!form.isValid()) {
            console.log("Validation failed");
            return;
        }

        convertPlayerToTechnical({
            variables: {
                idPlayer: id,
                classification: form.values.classification,
                membership_date: form.values.membershipDate ? form.values.membershipDate.toISOString() : "", // Ensure a string
                membership_date_end: form.values.membershipDateEnd ? form.values.membershipDateEnd.toISOString() : "", 
            },
            refetchQueries: [AllPlayers],
        })
        .then(() => closeModal())
        .catch(console.error);
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            size={"xl"}
           
          
            footer={
                <Box py={16} px={20} bg="slate.0"  style={{
                    marginTop: "39vh",  // Prevents excessive height
           
                }}>
                    <Group position={"right"} spacing={"xs"} >
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>
                            إلغاء
                        </Button>
                        <Button rightIcon={<Check size={15} />} bg={"blue"} onClick={onSubmit}>
                            تحويل
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={{ padding: 20 }} >
                                           
       
                <Alert variant="light" color="yellow">هل انت متأكد من تحويل هذا اللاعب إلى الجهاز الفني ؟</Alert>
                
                <Select
                    label="التصنيف"
                    placeholder="التصنيف"
                    withAsterisk
                    required
                    rightSection={<ChevronDown size={14} />}
                    rightSectionWidth={30}
                    styles={{ rightSection: { pointerEvents: "none" } }}
                    data={[
                        "مدرب",
                        "مساعد مدرب",
                        "مدير الفريق",
                        "مدرب اللياقة",
                        "مسؤول مهمات",
                        "مدرب حراس",
                        "طبي",
                        "اعلامي",
                    ]}
                    {...form.getInputProps("classification")}
                />

                <DateInput
                    label="تاريخ العضوية"
                    placeholder="اختر تاريخ العضوية"
                    withAsterisk
                    required
                    valueFormat="MM/DD/YYYY"
                    value={form.values.membershipDate}
                    onChange={(value) => form.setFieldValue("membershipDate", value)}
                    error={form.errors.membershipDate}
                    icon={<Calendar size={16} />}
                />

                <DateInput
                    label="تاريخ انتهاء العضوية"
                    placeholder="اختر تاريخ انتهاء العضوية"
                    withAsterisk
                    required
                    valueFormat="MM/DD/YYYY"
                    value={form.values.membershipDateEnd}
                    onChange={(value) => form.setFieldValue("membershipDateEnd", value)}
                    error={form.errors.membershipDateEnd}
                    icon={<Calendar size={16} />}
                />
            </Box>
        </Modal>
    );
};
