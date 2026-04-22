import {Box, Button, Col, FileInput, Flex, Grid, Group, Select, Textarea} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { Calendar, Check, X } from "tabler-icons-react";
import dayjs from "dayjs";
import React, {useState} from "react";
import { useForm, Controller } from "react-hook-form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useUpdateTeam} from "../../graphql";

type Props = {
    data?: any;
} & ModalProps;

export const EditTeamModal = ({ data, ...props }: Props) => {
    let { opened } = props;
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();
    const [value, setValue] = useState<File | null>(null);

    const [updateTeam] = useUpdateTeam();

    React.useEffect(() => {
        if (opened) {
            reset({
                name: data?.name,
                phone: data?.phone,
                activities: data?.activities,
                code: data?.code,
                manager_name: data?.manager_name,
            });
        }
    }, [opened]);

    const onSubmit = ({name, phone,  activities, code, manager_name}: any) => {
        updateTeam({
            variables: {
                id: data.id,
                content: {
                    name,
                    phone,
                    logo: value,
                    activities,
                    code,
                    manager_name
                }
            },
            refetchQueries: [AllTeams]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
        })
    };

    const closeModal = () => {
        props.onClose();
        reset();
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
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={handleSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="اسم فريق"
                                placeholder="اسم فريق"
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
                            <TextInput
                                label="النشاط"
                                placeholder="النشاط"
                                withAsterisk
                                error={errors?.activities && true}
                                {...register("activities", { required: true })}
                            />
                        </Col>
                        <Col span={6}>
                            <FileInput
                                label="الشعار الجديد"
                                placeholder="الشعار الجديد"
                                withAsterisk
                                error={errors?.logo && true}
                                value={value}
                                onChange={setValue}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الكود"
                                placeholder="الكود"
                                withAsterisk
                                error={errors?.code && true}
                                {...register("code", { required: true })}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="اسم المدير"
                                placeholder="اسم المدير"
                                withAsterisk
                                error={errors?.manager_name && true}
                                {...register("manager_name", { required: true })}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
