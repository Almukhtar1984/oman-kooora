import {Alert, Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text} from "@mantine/core";
import {Calendar, Check, ChevronDown, InfoCircle, Paperclip, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import {useForm} from "@mantine/form";
import {DateInput} from "@mantine/dates";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import dayjs from "dayjs";
import {Notyf} from "notyf";
import TextInput from "../Input/TextInput";
import Modal, {Props as ModalProps} from "./Modal";
import {AllAssembly, useRegisterMember} from "../../graphql";
import {
    DOCUMENT_TYPES, GUARDIAN_AGE, MAX_EXTRA_ATTACHMENTS, MAX_FILE_MB, needsGuardian, tooBig,
} from "../../lib/helpers/memberDocuments";

type Props = {
    idTeam?: string;
    /** بعد الإرسال: الصفحة تفتح «العضوية» ليرى الفريق عضوه بانتظار النادي. */
    onRegistered?: () => void;
} & ModalProps;

const init = {
    first_name: "",
    second_name: "",
    third_name: "",
    tribe: "",
    date_birth: null as Date | null,
    card_number: "",
    phone: "",
    gender: "male" as string | null,
};

const digits = (value: string) => String(value || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, "");

// «تسجيل عضو جديد» — بابٌ واحد بدل ثلاثة (العميل، 2026-11-08). الفريق لا يختار
// قبل التسجيل لاعباً أو جهازاً فنياً أو مجلس إدارة: يسجّل العضو فيدخل العضوية،
// والنادي يعتمده، ثم يختار الفريق تصنيفه من بطاقته.
export const RegisterMemberModal = ({idTeam, onRegistered, ...props}: Props) => {
    const form = useForm({
        initialValues: init,
        validate: {
            first_name: (v) => (v.trim() ? null : "مطلوب"),
            second_name: (v) => (v.trim() ? null : "مطلوب"),
            tribe: (v) => (v.trim() ? null : "مطلوب"),
            date_birth: (v) => (!v ? "مطلوب" : dayjs(v).isBefore(dayjs(), "day") ? null : "يجب أن يكون قبل اليوم"),
            card_number: (v) => (/^\d{6,12}$/.test(digits(v)) ? null : "الرقم المدني أرقامٌ من 6 إلى 12 خانة"),
            phone: (v) => (/^\+?\d{8,15}$/.test(digits(v)) ? null : "رقم الهاتف غير صالح"),
        },
    });
    const [nationalID, setNationalID] = useState<File[]>([]);
    const [nationalIDBack, setNationalIDBack] = useState<File[]>([]);
    const [picture, setPicture] = useState<File[]>([]);
    const [membershipForm, setMembershipForm] = useState<File | null>(null);
    const [guardianForm, setGuardianForm] = useState<File | null>(null);
    const [extras, setExtras] = useState<File[]>([]);
    const [docErrors, setDocErrors] = useState<Record<string, string | null>>({});
    const minor = needsGuardian(form.values.date_birth);
    const openFront = useRef<() => void>(null);
    const openBack = useRef<() => void>(null);
    const openPicture = useRef<() => void>(null);
    const [registerMember, {loading}] = useRegisterMember();

    const closeModal = () => {
        form.reset();
        setNationalID([]);
        setNationalIDBack([]);
        setPicture([]);
        setMembershipForm(null);
        setGuardianForm(null);
        setExtras([]);
        setDocErrors({});
        props.onClose();
    };

    // الاستمارتان من شروط التسجيل: لا يصل الطلب إلى النادي ناقصاً ثم يُرفض.
    const checkDocuments = () => {
        const errors: Record<string, string | null> = {
            membership_form: !membershipForm ? "أرفق استمارة طلب العضوية"
                : tooBig(membershipForm) ? `الملف أكبر من ${MAX_FILE_MB} ميغابايت` : null,
            guardian_form: minor && !guardianForm ? `العضو دون ${GUARDIAN_AGE} سنة — أرفق تعهد ولي الأمر`
                : tooBig(guardianForm) ? `الملف أكبر من ${MAX_FILE_MB} ميغابايت` : null,
            attachments: extras.length > MAX_EXTRA_ATTACHMENTS ? `${MAX_EXTRA_ATTACHMENTS} ملفات على الأكثر`
                : extras.some(tooBig) ? `ملفٌ أكبر من ${MAX_FILE_MB} ميغابايت` : null,
        };
        setDocErrors(errors);
        return Object.values(errors).every((error) => !error);
    };

    const onSubmit = (values: typeof init) => {
        if (!checkDocuments()) return;
        const notyf = new Notyf({position: {x: "right", y: "bottom"}});
        registerMember({
            variables: {
                content: {
                    first_name: values.first_name.trim(),
                    second_name: values.second_name.trim(),
                    third_name: values.third_name.trim(),
                    tribe: values.tribe.trim(),
                    date_birth: dayjs(values.date_birth).format("YYYY-MM-DD"),
                    card_number: digits(values.card_number),
                    phone: digits(values.phone),
                    gender: values.gender,
                    personal_picture: picture?.[0],
                    nationalID: nationalID?.[0],
                    nationalIDBack: nationalIDBack?.[0],
                    membership_form: membershipForm,
                    // التعهد لمن هو دون 18 وحده — وإن بقي من تاريخٍ عُدّل بعده لا يُرسل.
                    guardian_form: minor ? guardianForm : null,
                    attachments: extras,
                },
            },
            refetchQueries: idTeam ? [{query: AllAssembly, variables: {idTeam}}] : [AllAssembly],
        })
            .then(() => {
                notyf.success({message: "أُرسل تسجيل العضو إلى النادي — يظهر في «العضوية» بانتظار الاعتماد", duration: 8000});
                closeModal();
                onRegistered?.();
            })
            .catch((reason) => {
                const error = reason?.graphQLErrors?.[0];
                notyf.error({message: error?.message || "تعذّر تسجيل العضو", duration: 10000});
            });
    };

    const upload = (label: string, files: File[], setFiles: (f: File[]) => void, openRef: React.RefObject<() => void>) => (
        <Col span={12} sm={4}>
            <Text size="sm" mb={6}>
                {label}
                {files.length > 0 ? <Text color="green" span> — تم الرفع</Text> : null}
            </Text>
            <Dropzone
                openRef={openRef}
                activateOnClick={false}
                multiple={false}
                onDrop={setFiles}
                styles={{inner: {pointerEvents: "all"}}}
                maxSize={3 * 1024 ** 2}
                accept={IMAGE_MIME_TYPE}
                p="xs"
            >
                <Group position="center">
                    <Button size="xs" variant="light" onClick={() => openRef.current?.()}>اختر صورة</Button>
                </Group>
            </Dropzone>
        </Col>
    );

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="register_member_form" loading={loading}>
                            إرسال إلى النادي
                        </Button>
                    </Group>
                </Box>
            }
        >
            {loading ? (
                <Overlay opacity={0.9} color="#fff" zIndex={5}>
                    <Stack align="center" justify="center" h="100%" w="100%">
                        <Loader size="xl" variant="dots" />
                    </Stack>
                </Overlay>
            ) : null}

            <Box p={20}>
                <Alert color="blue" icon={<InfoCircle size={16} />} mb="md">
                    يدخل العضو «العضوية» مباشرة ويُرسل طلبه إلى النادي مع رسوم العضوية السنوية.
                    بعد اعتماد النادي اختر تصنيفه — لاعب أو جهاز فني أو مجلس إدارة — من بطاقته.
                    ويُرفق مع الطلب: استمارة طلب العضوية، وتعهد ولي الأمر لمن هو دون {GUARDIAN_AGE} سنة.
                </Alert>
                <form onSubmit={form.onSubmit(onSubmit, () => checkDocuments())} id="register_member_form">
                    <Grid gutter={16}>
                        <Col span={12} sm={6}>
                            <TextInput label="الاسم الأول" placeholder="الاسم الأول" withAsterisk {...form.getInputProps("first_name")} />
                        </Col>
                        <Col span={12} sm={6}>
                            <TextInput label="الاسم الثاني" placeholder="الاسم الثاني" withAsterisk {...form.getInputProps("second_name")} />
                        </Col>
                        <Col span={12} sm={6}>
                            <TextInput label="الاسم الثالث" placeholder="الاسم الثالث" {...form.getInputProps("third_name")} />
                        </Col>
                        <Col span={12} sm={6}>
                            <TextInput label="القبيلة" placeholder="القبيلة" withAsterisk {...form.getInputProps("tribe")} />
                        </Col>
                        <Col span={12} sm={6}>
                            <TextInput label="الرقم المدني" placeholder="الرقم المدني" withAsterisk {...form.getInputProps("card_number")} />
                        </Col>
                        <Col span={12} sm={6}>
                            <TextInput label="رقم الهاتف" placeholder="رقم الهاتف" withAsterisk {...form.getInputProps("phone")} />
                        </Col>
                        <Col span={12} sm={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="YYYY-MM-DD"
                                icon={<Calendar size={16} />}
                                maxDate={dayjs().subtract(1, "day").toDate()}
                                popoverProps={{withinPortal: true}}
                                {...form.getInputProps("date_birth")}
                            />
                        </Col>
                        <Col span={12} sm={6}>
                            <Select
                                label="الجنس"
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{rightSection: {pointerEvents: "none"}}}
                                withinPortal
                                data={[{label: "ذكر", value: "male"}, {label: "أنثى", value: "female"}]}
                                {...form.getInputProps("gender")}
                            />
                        </Col>
                        {upload("الصورة الشخصية", picture, setPicture, openPicture)}
                        {upload("البطاقة المدنية — الوجه الأمامي", nationalID, setNationalID, openFront)}
                        {upload("البطاقة المدنية — الوجه الخلفي", nationalIDBack, setNationalIDBack, openBack)}

                        <Col span={12} sm={minor ? 6 : 12}>
                            <FileInput
                                label="استمارة طلب العضوية"
                                description="PDF أو صورة أو Word"
                                withAsterisk
                                clearable
                                icon={<Paperclip size={16} />}
                                accept={DOCUMENT_TYPES}
                                value={membershipForm}
                                onChange={(file) => { setMembershipForm(file); setDocErrors((e) => ({...e, membership_form: null})); }}
                                error={docErrors.membership_form}
                            />
                        </Col>
                        {minor ? (
                            <Col span={12} sm={6}>
                                <FileInput
                                    label="تعهد ولي الأمر"
                                    description={`العضو دون ${GUARDIAN_AGE} سنة`}
                                    withAsterisk
                                    clearable
                                    icon={<Paperclip size={16} />}
                                    accept={DOCUMENT_TYPES}
                                    value={guardianForm}
                                    onChange={(file) => { setGuardianForm(file); setDocErrors((e) => ({...e, guardian_form: null})); }}
                                    error={docErrors.guardian_form}
                                />
                            </Col>
                        ) : null}
                        <Col span={12}>
                            <FileInput
                                label="مرفقات أخرى (اختياري)"
                                description={`حتى ${MAX_EXTRA_ATTACHMENTS} ملفات — بطاقة ولي الأمر أو أي مستند آخر`}
                                multiple
                                clearable
                                icon={<Paperclip size={16} />}
                                accept={DOCUMENT_TYPES}
                                value={extras}
                                onChange={(files) => { setExtras(files); setDocErrors((e) => ({...e, attachments: null})); }}
                                error={docErrors.attachments}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};

export default RegisterMemberModal;
