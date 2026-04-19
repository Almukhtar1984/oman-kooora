import {Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React, {useState} from "react";
import { useForm, Controller } from "react-hook-form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useAddTeam} from "./../../graphql";
import useStore from "../../store/useStore";
import {IconChevronDown} from "@tabler/icons-react";

type Props = {} & ModalProps;


export const AddTeamModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {register, handleSubmit, control, watch, reset, formState: { errors }} = useForm();
    const [value, setValue] = useState<File | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [createTeam] = useAddTeam();

    const onSubmit = ({name, phone, activities, code, manager_name}: any) => {
        setLoading(true)
        createTeam({
            variables: {
                content: {
                    name,
                    category: parseInt(category || "0"),
                    phone,
                    logo: value,
                    activities,
                    code,
                    manager_name,
                    id_club: userData?.person?.clubManagement?.club?.id
                }
            },
            refetchQueries: [AllTeams]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
            console.log(reason)
            setLoading(false)
        })
    };

    const closeModal = () => {
        setLoading(false)
        props.onClose();
        reset();
        setValue(null)
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
            {loading ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={handleSubmit(onSubmit, () => console.log("error: ", errors))} id="submit_form">
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
                            <Select
                                label="التصنيف"
                                placeholder="اختر تصنيف الفريق"

                                rightSection={<IconChevronDown size="1rem" />}
                                rightSectionWidth={30}
                                withAsterisk
                                styles={{ rightSection: { pointerEvents: 'none' } }}

                                data={[
                                    {label: "الدرجة الاولى", value: "1"},
                                    {label: "الدرجة الثاني", value: "2"},
                                    {label: "الدرجة الثالثة", value: "3"}
                                ]}

                                value={category}

                                onChange={setCategory}
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