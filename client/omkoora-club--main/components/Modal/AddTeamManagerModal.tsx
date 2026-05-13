import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Col,
    CopyButton,
    Divider,
    Grid,
    Group,
    Loader,
    Overlay,
    PasswordInput,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";
import {Calendar, Check, Copy, Refresh, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import {DateInput} from "@mantine/dates";
import {useForm} from "@mantine/form";
import dayjs from "dayjs";
import {Notyf} from "notyf";

import TextInput from "../Input/TextInput";
import Modal, {Props as ModalProps} from "./Modal";
import {AllTeams, useAddMember} from "./../../graphql";

type Props = {
    data?: {id?: string; name?: string} | null;
} & ModalProps;

// ── Password generator (matches AddTeamModal) ─────────────────────────
const PASSWORD_LENGTH = 10;
const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_LOWER = "abcdefghijkmnpqrstuvwxyz";
const PASSWORD_DIGIT = "23456789";
const pickRandom = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
const generatePassword = () => {
    const all = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGIT;
    const chars = [pickRandom(PASSWORD_UPPER), pickRandom(PASSWORD_LOWER), pickRandom(PASSWORD_DIGIT)];
    while (chars.length < PASSWORD_LENGTH) chars.push(pickRandom(all));
    return chars.sort(() => Math.random() - 0.5).join("");
};

// ── Validators ────────────────────────────────────────────────────────
const isArabicOrLatin = (v: string) => /^[؀-ۿa-zA-Z\s'’-]{2,}$/.test(v.trim());
const isDigits = (v: string, min: number, max: number) => {
    const t = v.trim();
    return /^\d+$/.test(t) && t.length >= min && t.length <= max;
};
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const init = () => ({
    first_name: "",
    second_name: "",
    third_name: "",
    tribe: "",
    date_birth: null as Date | null,
    card_number: "",
    phone: "",
    email: "",
    password: generatePassword(),
});

export const AddTeamManagerModal = ({data, ...props}: Props) => {
    const teamId = data?.id;
    const teamName = data?.name;

    const form = useForm({
        initialValues: init(),
        validate: {
            first_name: (v) => (!v ? "الاسم الأول مطلوب" : !isArabicOrLatin(v) ? "اسم غير صالح" : null),
            second_name: (v) => (!v ? "الاسم الثاني مطلوب" : !isArabicOrLatin(v) ? "اسم غير صالح" : null),
            third_name: (v) => (v && !isArabicOrLatin(v) ? "اسم غير صالح" : null),
            tribe: (v) => (!v ? "القبيلة مطلوبة" : !isArabicOrLatin(v) ? "قيمة غير صالحة" : null),
            date_birth: (v) => {
                if (!v) return "تاريخ الميلاد مطلوب";
                const d = dayjs(v);
                if (!d.isValid()) return "تاريخ غير صالح";
                if (!d.isBefore(dayjs(), "day")) return "يجب أن يكون قبل اليوم";
                const age = dayjs().diff(d, "year");
                if (age < 18) return "يجب أن يكون 18 عاما أو أكثر";
                if (age > 100) return "تاريخ ميلاد غير منطقي";
                return null;
            },
            card_number: (v) => {
                if (!v) return "رقم البطاقة المدنية مطلوب";
                if (!isDigits(v, 6, 12)) return "أرقام فقط (6 – 12 رقم)";
                return null;
            },
            phone: (v) => {
                if (!v) return "رقم الهاتف مطلوب";
                if (!isDigits(v, 8, 12)) return "أرقام فقط (8 – 12 رقم)";
                return null;
            },
            email: (v) => {
                if (!v) return "البريد الإلكتروني مطلوب";
                if (!isValidEmail(v)) return "صيغة البريد غير صحيحة";
                return null;
            },
            password: (v) => {
                if (!v) return "كلمة المرور مطلوبة";
                if (v.length < 8) return "8 محارف على الأقل";
                if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v))
                    return "يجب أن تتضمن حرفا كبيرا وحرفا صغيرا ورقما";
                return null;
            },
        },
    });

    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<{email: string; password: string} | null>(null);
    const [createAdminMember] = useAddMember();

    useEffect(() => {
        if (props.opened) {
            form.setValues(init());
            form.resetDirty();
            setCredentials(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.opened]);

    const onSubmit = async (values: ReturnType<typeof init>) => {
        const notyf = new Notyf({position: {x: "right", y: "bottom"}});
        if (!teamId) {
            notyf.error("لم يتم تحديد الفريق");
            return;
        }
        if (loading) return;
        setLoading(true);
        try {
            await createAdminMember({
                variables: {
                    content: {
                        occupation: "مدير الفريق",
                        classification: "manager",
                        membership_date: dayjs().format("YYYY-MM-DD"),
                        membership_date_end: "",
                        id_team: teamId,
                        user: {
                            email: values.email.trim(),
                            password: values.password,
                            role: "3",
                            person: {
                                first_name: values.first_name.trim(),
                                second_name: values.second_name.trim(),
                                third_name: values.third_name.trim(),
                                tribe: values.tribe.trim(),
                                phone: values.phone.trim(),
                                card_number: values.card_number.trim(),
                                date_birth: dayjs(values.date_birth).format("YYYY-MM-DD"),
                            },
                        },
                    },
                },
                refetchQueries: [AllTeams],
            });
            setCredentials({email: values.email.trim(), password: values.password});
            notyf.success("تم إضافة المدير بنجاح");
        } catch (err: any) {
            const gqlErr = err?.graphQLErrors?.[0];
            const code = gqlErr?.extensions?.code;
            const serverMessage = gqlErr?.message || err?.message;
            // Diagnostic line — server's error code/message is the only handle
            // we have when something unexpected happens (DB constraint, etc.)
            console.error("[AddTeamManager] failed:", code, serverMessage, err);

            if (code === "CARD_NUMBER_ALREADY_EXISTS") {
                notyf.error("رقم البطاقة المدنية موجود مسبقا");
                form.setFieldError("card_number", "موجود مسبقا");
            } else if (code === "PHONE_NUMBER_ALREADY_EXISTS") {
                notyf.error("رقم الهاتف موجود مسبقا");
                form.setFieldError("phone", "موجود مسبقا");
            } else if (code === "EMAIL_ALREADY_EXIST" || code === "USER_ALREADY_EXISTS") {
                notyf.error("البريد الإلكتروني مستخدم بالفعل");
                form.setFieldError("email", "مستخدم بالفعل");
            } else if (code === "FORBIDDEN_ROLE") {
                notyf.error("ليس لديك صلاحية لإضافة مدير");
            } else if (code === "SequelizeUniqueConstraintError" || /unique/i.test(serverMessage || "")) {
                // Surface the Sequelize-side uniqueness conflict that the
                // app-level pre-check missed (e.g. unique index on phone
                // alone, or email casing differences).
                notyf.error("بيانات مكررة في قاعدة البيانات (هاتف / بطاقة / إيميل)");
            } else {
                notyf.error(`تعذرت الإضافة: ${serverMessage || "خطأ غير متوقع"}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setLoading(false);
        setCredentials(null);
        form.setValues(init());
        form.reset();
        props.onClose();
    };

    // ── Success screen ──────────────────────────────────────────────
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
                        <Title order={4}>تم إنشاء حساب مدير الفريق</Title>
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

    // ── Form ────────────────────────────────────────────────────────
    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal} disabled={loading}>
                            إلغاء
                        </Button>
                        <Button
                            rightIcon={<Check size={15} />}
                            type="submit"
                            form="add_team_manager_form"
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
                        <Text size="lg" fw={500}>جاري إنشاء حساب المدير، يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
            ) : null}

            <Box p={20}>
                <Stack spacing="xs" mb="md">
                    <Title order={5}>إضافة مدير للفريق</Title>
                    {teamName ? (
                        <Text size="xs" c="dimmed">
                            الفريق: <Text span fw={600}>{teamName}</Text>
                        </Text>
                    ) : null}
                </Stack>

                <form onSubmit={form.onSubmit(onSubmit)} id="add_team_manager_form">
                    <Divider label="المعلومات الشخصية" labelPosition="center" mb="md" />
                    <Grid gutter={20}>
                        <Col span={6}>
                            <TextInput label="الاسم الأول" placeholder="الاسم الأول" withAsterisk
                                {...form.getInputProps("first_name")} />
                        </Col>
                        <Col span={6}>
                            <TextInput label="الاسم الثاني" placeholder="الاسم الثاني" withAsterisk
                                {...form.getInputProps("second_name")} />
                        </Col>
                        <Col span={6}>
                            <TextInput label="الاسم الثالث (اختياري)" placeholder="الاسم الثالث"
                                {...form.getInputProps("third_name")} />
                        </Col>
                        <Col span={6}>
                            <TextInput label="القبيلة" placeholder="القبيلة" withAsterisk
                                {...form.getInputProps("tribe")} />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="YYYY-MM-DD"
                                maxDate={dayjs().subtract(1, "day").toDate()}
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput label="رقم البطاقة المدنية" placeholder="رقم البطاقة المدنية" withAsterisk
                                {...form.getInputProps("card_number")} />
                        </Col>
                        <Col span={6}>
                            <TextInput label="رقم الهاتف" placeholder="رقم الهاتف" withAsterisk
                                {...form.getInputProps("phone")} />
                        </Col>
                    </Grid>

                    <Divider label="بيانات الحساب" labelPosition="center" my="lg" />
                    <Grid gutter={20}>
                        <Col span={12}>
                            <TextInput label="البريد الإلكتروني" placeholder="البريد الإلكتروني" type="email" withAsterisk
                                {...form.getInputProps("email")} />
                        </Col>
                        <Col span={12}>
                            <Group align="flex-end" spacing="xs" noWrap>
                                <PasswordInput
                                    label="كلمة المرور"
                                    description="مولّدة تلقائيا. يمكنك تعديلها أو إعادة توليدها."
                                    withAsterisk
                                    sx={{flex: 1}}
                                    {...form.getInputProps("password")}
                                />
                                <Tooltip label="إنشاء كلمة مرور جديدة">
                                    <ActionIcon
                                        size="lg"
                                        variant="light"
                                        color="blue"
                                        onClick={() => form.setFieldValue("password", generatePassword())}
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
