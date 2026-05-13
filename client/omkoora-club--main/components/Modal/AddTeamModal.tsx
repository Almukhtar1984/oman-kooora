import {ActionIcon, Alert, Box, Button, Col, CopyButton, Divider, FileInput, Grid, Group, Loader, Overlay, PasswordInput, Select, Stack, Text, Title, Tooltip} from "@mantine/core";
import {Calendar, Check, Copy, Refresh, X} from "tabler-icons-react";
import {IconChevronDown} from "@tabler/icons-react";
import React, {useState} from "react";
import {DateInput} from "@mantine/dates";
import {useForm} from "@mantine/form";
import dayjs from "dayjs";
import {Notyf} from "notyf";

import TextInput from "../Input/TextInput";
import Modal, {Props as ModalProps} from "./Modal";
import {AllTeams, useCreateTeamWithAdmin} from "./../../graphql";
import useStore from "../../store/useStore";

type Props = {} & ModalProps;

const PASSWORD_LENGTH = 10;
const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_LOWER = "abcdefghijkmnpqrstuvwxyz";
const PASSWORD_DIGIT = "23456789";

const pickRandom = (pool: string) => pool[Math.floor(Math.random() * pool.length)];

const generatePassword = () => {
    const all = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGIT;
    const chars = [
        pickRandom(PASSWORD_UPPER),
        pickRandom(PASSWORD_LOWER),
        pickRandom(PASSWORD_DIGIT),
    ];
    while (chars.length < PASSWORD_LENGTH) chars.push(pickRandom(all));
    return chars.sort(() => Math.random() - 0.5).join("");
};

const init = () => ({
    name: "",
    phone: "",
    activities: "",
    code: "",
    manager: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        date_birth: null as Date | null,
        card_number: "",
        phone: "",
        email: "",
        password: generatePassword(),
    },
});

export const AddTeamModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init(),
        validate: {
            name: (v) => (!v ? "مطلوب" : null),
            phone: (v) => (!v ? "مطلوب" : null),
            activities: (v) => (!v ? "مطلوب" : null),
            code: (v) => (!v ? "مطلوب" : null),
            manager: {
                first_name: (v) => (!v ? "مطلوب" : null),
                second_name: (v) => (!v ? "مطلوب" : null),
                tribe: (v) => (!v ? "مطلوب" : null),
                date_birth: (v) => {
                    if (!v) return "مطلوب";
                    if (!dayjs(v).isBefore(dayjs(), "day")) return "يجب أن يكون قبل اليوم";
                    return null;
                },
                card_number: (v) => (!v ? "مطلوب" : null),
                phone: (v) => (!v ? "مطلوب" : null),
                email: (v) => {
                    if (!v) return "مطلوب";
                    if (!v.includes("@")) return "بريد غير صالح";
                    return null;
                },
                password: (v) => (v && v.length >= 8 ? null : "كلمة المرور قصيرة"),
            },
        },
    });

    const [logo, setLogo] = useState<File | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [categoryError, setCategoryError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<{email: string; password: string} | null>(null);

    const [createTeamWithAdmin, {loading: mutationLoading}] = useCreateTeamWithAdmin();

    const onSubmit = async (data: ReturnType<typeof init>) => {
        const notyf = new Notyf({position: {x: "right", y: "bottom"}});

        if (!category) {
            setCategoryError(true);
            return;
        }
        setCategoryError(false);

        // Guard against double-submit. The single-mutation server endpoint is
        // already atomic, but if the user mashes the confirm button we still
        // want to ignore subsequent clicks until the first round-trip lands.
        if (loading || mutationLoading) return;

        const {name, phone, activities, code, manager} = data;
        const manager_name = `${manager.first_name} ${manager.tribe}`.trim();

        setLoading(true);
        try {
            await createTeamWithAdmin({
                variables: {
                    team: {
                        name,
                        category: parseInt(category || "0"),
                        phone,
                        logo,
                        activities,
                        code,
                        manager_name,
                        id_club: userData?.person?.clubManagement?.club?.id,
                    },
                    manager: {
                        email: manager.email,
                        password: manager.password,
                        occupation: "مدير الفريق",
                        classification: "manager",
                        membership_date: dayjs().format("YYYY-MM-DD"),
                        membership_date_end: "",
                        person: {
                            first_name: manager.first_name,
                            second_name: manager.second_name,
                            third_name: manager.third_name,
                            tribe: manager.tribe,
                            phone: manager.phone,
                            card_number: manager.card_number,
                            date_birth: dayjs(manager.date_birth).format("YYYY-MM-DD"),
                        },
                    },
                },
                refetchQueries: [AllTeams],
            });

            setLoading(false);
            setCredentials({email: manager.email, password: manager.password});
            notyf.success("تم التسجيل بنجاح");
        } catch (err: any) {
            setLoading(false);
            const gqlErr = err?.graphQLErrors?.[0];
            const code = gqlErr?.extensions?.code;
            const serverMessage = gqlErr?.message || err?.message;
            console.error("[AddTeamModal] failed:", code, serverMessage, err);

            if (code === "CARD_NUMBER_ALREADY_EXISTS") {
                notyf.error("رقم البطاقة المدنية موجود مسبقاً");
            } else if (code === "PHONE_NUMBER_ALREADY_EXISTS") {
                notyf.error("رقم الهاتف موجود مسبقاً");
            } else if (code === "EMAIL_ALREADY_EXIST" || code === "USER_ALREADY_EXISTS") {
                notyf.error("البريد الإلكتروني مستخدم بالفعل");
            } else if (code === "INVALID_LOGO") {
                notyf.error("نوع ملف الشعار غير مدعوم");
            } else if (code === "FORBIDDEN_ROLE") {
                notyf.error("ليس لديك صلاحية لإضافة فريق");
            } else if (code === "SequelizeUniqueConstraintError" || /unique/i.test(serverMessage || "")) {
                notyf.error("بيانات مكررة في قاعدة البيانات (هاتف / بطاقة / إيميل)");
            } else {
                notyf.error(`تعذرت الإضافة: ${serverMessage || "خطأ غير متوقع"}`);
            }
        }
    };

    const closeModal = () => {
        setLoading(false);
        setLogo(null);
        setCategory(null);
        setCategoryError(false);
        setCredentials(null);
        form.setValues(init());
        form.reset();
        props.onClose();
    };

    if (credentials) {
        return (
            <Modal
                {...props}
                onClose={closeModal}
                footer={
                    <Box py={16} px={20} bg="slate.0">
                        <Group position="right" spacing="xs">
                            <Button rightIcon={<Check size={15} />} onClick={closeModal}>تم</Button>
                        </Group>
                    </Box>
                }
            >
                <Box p={20}>
                    <Stack spacing="md">
                        <Title order={4}>تم إنشاء الفريق ومديره</Title>
                        <Alert color="orange" title="احفظ هذه البيانات الآن">
                            لن تظهر كلمة المرور مرة أخرى. سلّمها لمدير الفريق بأمان.
                        </Alert>
                        <CredentialRow label="البريد الإلكتروني" value={credentials.email} />
                        <CredentialRow label="كلمة المرور" value={credentials.password} mono />
                    </Stack>
                </Box>
            </Modal>
        );
    }

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal} disabled={loading}>إلغاء</Button>
                        <Button
                            rightIcon={<Check size={15} />}
                            type="submit"
                            form="submit_form"
                            loading={loading}
                            disabled={loading}
                        >
                            تأكيد
                        </Button>
                    </Group>
                </Box>
            }
        >
            {loading ? (
                <Overlay opacity={0.9} color="#fff" zIndex={5}>
                    <Stack align="center" justify="center" h="100%" w="100%">
                        <Loader size="xl" variant="dots" />
                        <Text size="lg" fw={500}>يتم إنشاء الفريق ومديره، يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
            ) : null}

            <Box p={20}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Divider label="معلومات الفريق" labelPosition="center" mb="md" />
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="اسم الفريق"
                                placeholder="اسم الفريق"
                                withAsterisk
                                {...form.getInputProps("name")}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                label="التصنيف"
                                placeholder="اختر تصنيف الفريق"
                                rightSection={<IconChevronDown size="1rem" />}
                                rightSectionWidth={30}
                                withAsterisk
                                styles={{rightSection: {pointerEvents: "none"}}}
                                data={[
                                    {label: "الدرجة الاولى", value: "1"},
                                    {label: "الدرجة الثاني", value: "2"},
                                    {label: "الدرجة الثالثة", value: "3"},
                                ]}
                                value={category}
                                onChange={(v) => {
                                    setCategory(v);
                                    setCategoryError(false);
                                }}
                                error={categoryError ? "مطلوب" : null}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم هاتف الفريق"
                                placeholder="رقم هاتف الفريق"
                                withAsterisk
                                {...form.getInputProps("phone")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="النشاط"
                                placeholder="النشاط"
                                withAsterisk
                                {...form.getInputProps("activities")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الكود"
                                placeholder="الكود"
                                withAsterisk
                                {...form.getInputProps("code")}
                            />
                        </Col>
                        <Col span={6}>
                            <FileInput
                                label="الشعار"
                                placeholder="الشعار"
                                value={logo}
                                onChange={setLogo}
                            />
                        </Col>
                    </Grid>

                    <Divider label="معلومات المدير" labelPosition="center" my="lg" />
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الأول"
                                placeholder="الاسم الأول"
                                withAsterisk
                                {...form.getInputProps("manager.first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                withAsterisk
                                {...form.getInputProps("manager.second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث (اختياري)"
                                placeholder="الاسم الثالث"
                                {...form.getInputProps("manager.third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="اسم القبيلة"
                                placeholder="اسم القبيلة"
                                withAsterisk
                                {...form.getInputProps("manager.tribe")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="YYYY-MM-DD"
                                maxDate={dayjs().subtract(1, "day").toDate()}
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("manager.date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم البطاقة المدنية"
                                placeholder="رقم البطاقة المدنية"
                                withAsterisk
                                {...form.getInputProps("manager.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم هاتف المدير"
                                placeholder="رقم هاتف المدير"
                                withAsterisk
                                {...form.getInputProps("manager.phone")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="البريد الإلكتروني"
                                placeholder="البريد الإلكتروني"
                                withAsterisk
                                type="email"
                                {...form.getInputProps("manager.email")}
                            />
                        </Col>
                        <Col span={12}>
                            <Group align="flex-end" spacing="xs" noWrap>
                                <PasswordInput
                                    label="كلمة المرور"
                                    description="تم إنشاؤها تلقائياً (10 محارف). يمكنك التعديل أو إعادة الإنشاء."
                                    withAsterisk
                                    sx={{flex: 1}}
                                    {...form.getInputProps("manager.password")}
                                />
                                <Tooltip label="إنشاء كلمة مرور جديدة">
                                    <ActionIcon
                                        size="lg"
                                        variant="light"
                                        color="blue"
                                        onClick={() => form.setFieldValue("manager.password", generatePassword())}
                                    >
                                        <Refresh size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};

const CredentialRow = ({label, value, mono}: {label: string; value: string; mono?: boolean}) => (
    <Group position="apart" spacing="xs" sx={(t) => ({border: `1px solid ${t.colors.slate[2]}`, borderRadius: 6, padding: 12})}>
        <Box>
            <Text size="xs" c="slate.6">{label}</Text>
            <Text fw={600} sx={mono ? {fontFamily: "monospace", letterSpacing: 1} : undefined}>{value}</Text>
        </Box>
        <CopyButton value={value} timeout={1500}>
            {({copied, copy}) => (
                <Tooltip label={copied ? "تم النسخ" : "نسخ"} withArrow>
                    <ActionIcon color={copied ? "teal" : "blue"} onClick={copy} variant="light">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </ActionIcon>
                </Tooltip>
            )}
        </CopyButton>
    </Group>
);
