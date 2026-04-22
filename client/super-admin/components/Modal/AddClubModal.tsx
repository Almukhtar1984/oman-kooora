import {Box, Button, Col, FileInput, Grid, Group, Select,} from "@mantine/core";
import {IconCheck, IconChevronDown, IconX} from "@tabler/icons";
import React, {useState} from "react";
import { useForm, Controller } from "react-hook-form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllClubs, useAddClub} from "./../../graphql";

type Props = {} & ModalProps;

const listCity = [
    {label: "مسندم",    value: "مسندم"},
    {label: "البريمي",  value: "البريمي"},
    {label: "شمال الباطنة", value: "شمال الباطنة"},
    {label: "جنوب الباطنة", value: "جنوب الباطنة"},
    {label: "مسقط", value: "مسقط"},
    {label: "الظاهرة",  value: "الظاهرة"},
    {label: "الداخلية", value: "الداخلية"},
    {label: "شمال الشرقية", value: "شمال الشرقية"},
    {label: "جنوب الشرقية", value: "جنوب الشرقية"},
    {label: "الوسطى",   value: "الوسطى"},
    {label: "ظفار",     value: "ظفار"}
]

export const AddClubModal = (props: Props) => {
    const {register, handleSubmit, control, watch, reset, formState: { errors }} = useForm();
    const [value, setValue] = useState<File | null>(null);
    const [governorate, setGovernorate] = useState<string | null>(null);
    const [createClub] = useAddClub();

    const onSubmit = ({name, phone}: any) => {
        createClub({
            variables: {
                content: {
                    name,
                    phone,
                    logo: value,
                    governorate: governorate || ""
                }
            },
            refetchQueries: [AllClubs]
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
        reset();
        setValue(null)
        setGovernorate(null)
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={handleSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="اسم النادي"
                                placeholder="اسم النادي"
                                withAsterisk
                                error={errors?.name_arabic && true}
                                {...register("name", { required: true })}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                withAsterisk
                                error={errors?.phone && true}
                                {...register("phone", { required: true })}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="المحافظه"
                                placeholder="المحافظه"
                                rightSection={<IconChevronDown size={14} />}
                                withAsterisk
                                data={listCity}
                                value={governorate}
                                onChange={setGovernorate}
                            />
                        </Col>
                        <Col span={6}>
                            <FileInput
                                label="الشعار"
                                placeholder="الشعار"
                                withAsterisk
                                error={errors?.logo && true}
                                value={value}
                                onChange={setValue}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
