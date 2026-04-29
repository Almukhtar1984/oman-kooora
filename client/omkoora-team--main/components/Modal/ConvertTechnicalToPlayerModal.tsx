import { Box, Button, Group, Text, Select, Alert } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Calendar, Check, X, ChevronDown } from "tabler-icons-react";
import React, { useEffect } from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import { useConvertTechnicalToPlayer, AllTechnicals } from "../../graphql";

type Props = {
    id?: string;
} & ModalProps;

export const ConvertTechnicalToPlayerModal = ({ id, ...props }: Props) => {
    const [convertTechnicalToPlayer] = useConvertTechnicalToPlayer();

    const form = useForm({
        initialValues: {
            activity: "",
            player_center: "",
            class: "firstDegree", // Default class
        },
        validate: {
            activity: (value) => (value ? null : "يجب اختيار النشاط"),
            player_center: (value) => (value ? null : "يجب تحديد مركز اللاعب"),
            class: (value) => (value ? null : "يجب تحديد فئة اللاعب"),
        },
    });



    const onSubmit = () => {
        if (!id || !form.isValid()) {
            console.log("Validation failed");
            return;
        }

        convertTechnicalToPlayer({
            variables: {
                idTechnical: id,
                activity: form.values.activity,
                player_center: form.values.player_center,
                class: form.values.class,
            },
            refetchQueries: [AllTechnicals],
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
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
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
            <Box sx={{ padding: 20 }}>
                <Alert variant="light" color="yellow">
                    هل انت متأكد من تحويل هذا الفني إلى لاعب ؟
                </Alert>

                <Select
                    label="النشاط"
                    placeholder="اختر النشاط"
                    withAsterisk
                    required
                    rightSection={<ChevronDown size={14} />}
                    rightSectionWidth={30}
                    styles={{ rightSection: { pointerEvents: "none" } }}
                    data={[
                        "كرة القدم",
             
                    ]}
                    {...form.getInputProps("activity")}
                />

                <Select
                    label="مركز اللاعب"
                    placeholder="اختر مركز اللاعب"
                    withAsterisk
                    required
                    rightSection={<ChevronDown size={14} />}
                    rightSectionWidth={30}
                    styles={{ rightSection: { pointerEvents: "none" } }}
                    data={[
                        "حارس مرمى",
                        "مدافع",
                        "وسط ميدان",
                        "مهاجم",
                    ]}
                    {...form.getInputProps("player_center")}
                />

                <Select
                    label="فئة اللاعب"
                    placeholder="اختر الفئة"
                    withAsterisk
                    required
                    rightSection={<ChevronDown size={14} />}
                    rightSectionWidth={30}
                    styles={{ rightSection: { pointerEvents: "none" } }}
                    data={[
                        { value: "firstDegree", label: "الفريق الأول" },
                        { value: "secondDegree", label: "تحت 23 سنة" },
                        { value: "rookies", label: "تحت 18 سنة" },
                        { value: "young", label: "تحت 16 سنة" }
                    ]}
                    {...form.getInputProps("class")}
                />
            </Box>
        </Modal>
    );
};
