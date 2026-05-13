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
import {Notyf} from "notyf";
import { getImageUrl } from "../../lib/helpers/image";

type Props = {
    data?: any;
} & ModalProps;

export const EditTeamModal = ({ data, ...props }: Props) => {
    let { opened } = props;
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();
    const [value, setValue] = useState<File | null>();
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
            });

            setCategory(data?.category.toString())
        }
    }, [opened]);

    // manager_name is intentionally NOT in this form. The visible "manager"
    // on the team card is sourced from the User account attached to the
    // team's Member (classification='manager') — editing the legacy
    // teams.manager_name string column from here only produced a
    // confusing mismatch where the card said "no manager" but the edit
    // form pre-populated a name. To change the displayed manager name,
    // edit the manager's person record via "تعديل بيانات المدير".
    const onSubmit = ({name, phone,  activities, code}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        setLoading(true)

        const content: any = {
            name,
            category: parseInt(category || "0"),
            phone,
            activities,
            code,
        };

        if (value) {
            content.logo = value;
        }

        updateTeam({
            variables: {
                id: data.id,
                content
            },
            refetchQueries: [AllTeams]
        })
        .then(() => {
            closeModal();
            notyf.success("تم التعديل بنجاح")
        })
        .catch(reason => {
            console.log(reason)
            setLoading(false)
            notyf.error("تعذر التعديل")
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
                            <Stack spacing={4}>
                                <Text size="sm" weight={500}>الشعار الحالي</Text>
                                <Box sx={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
                                    <img 
                                        src={data?.logo ? getImageUrl(data.logo) : '/unknow player.png'} 
                                        alt="Current Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </Box>
                            </Stack>
                        </Col>
                        <Col span={6}>
                            <FileInput
                                label="الشعار الجديد"
                                placeholder="الشعار الجديد"
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
                    </Grid>
                    <Text size="xs" color="dimmed" mt="md">
                        ملاحظة: لتعديل بيانات مدير الفريق (الاسم، الإيميل، كلمة المرور)، استعمل خيار &laquo;تعديل بيانات المدير&raquo; من قائمة الفريق.
                    </Text>
                </form>
            </Box>
        </Modal>
    );
};