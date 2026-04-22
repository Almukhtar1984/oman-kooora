import {Box, Button, Col, FileInput, Grid, Group,} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import { useForm, Controller } from "react-hook-form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useAddTeam} from "./../../graphql";
import useStore from "../../store/useStore";

type Props = {} & ModalProps;


export const AddTeamModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {register, handleSubmit, control, watch, reset, formState: { errors }} = useForm();
    const [value, setValue] = useState<File | null>(null);
    const [createTeam] = useAddTeam();

    const onSubmit = ({name, phone, activities, code, manager_name}: any) => {
        createTeam({
            variables: {
                content: {
                    name,
                    phone,
                    logo: value,
                    activities,
                    code,
                    manager_name,
                    id_club: userData?.person?.member?.team?.id
                }
            },
            refetchQueries: [AllTeams]
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
                                label="الشعار"
                                placeholder="الشعار"
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
