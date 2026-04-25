import {
    Box,
    Button,
    Col,
    FileInput,
    Flex,
    Grid,
    Group,
    Loader,
    Overlay,
    Select,
    Stack,
    Text,
    Textarea
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { Calendar, Check, X } from "tabler-icons-react";
import dayjs from "dayjs";
import React, {useState} from "react";
import { useForm, Controller } from "react-hook-form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useUpdateAssembly, useUpdateTeam} from "../../graphql";
import {IconChevronDown} from "@tabler/icons-react";

type Props = {
    data?: any;
} & ModalProps;

export const EditTeamModal = ({ data, ...props }: Props) => {
    let { opened } = props;
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();
    const [value, setValue] = useState<File | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

            setCategory(data?.category.toString())
        }
    }, [
        opened,
        reset,
        data?.activities,
        data?.category,
        data?.code,
        data?.manager_name,
        data?.name,
        data?.phone
    ]);

    const onSubmit = ({name, phone,  activities, code, manager_name}: any) => {
        setLoading(true)
        updateTeam({
            variables: {
                id: data.id,
                content: {
                    name,
                    category: parseInt(category || "0"),
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
            setLoading(false)
        })
    };

    const closeModal = () => {
        setLoading(false)
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
