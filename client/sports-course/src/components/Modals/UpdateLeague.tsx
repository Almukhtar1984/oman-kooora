import { Alert,Badge,Box,Button,Divider,Grid,Group,NumberInput,PasswordInput,Text,Textarea,TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCheck,IconLock,IconMail,IconTrash,IconUserShield,IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Notyf } from "notyf";
import { useEffect, useState } from "react";
import { AllLeagues,useClearLeagueAdmin,useUpdateLeague } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateLeague = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {
            name: "",
            description: "",
            numberTeams: "" as any,
            numberGroups: "" as any,
            internalplayer: "" as any,
            externalplayer: "" as any,
            startDate: "" as any,
            expiryDate: "" as any,
            inscriptionStartDate: "" as any,
            inscriptionExpiryDate: "" as any,
            adminEmail: "",
            adminPassword: "",
        },
        validate: {
            adminEmail: (value) => {
                const email = (value || "").trim();
                if (!email) return null; // empty allowed only if no existing admin (handled in submit)
                if (!EMAIL_PATTERN.test(email)) return "صيغة البريد الإلكتروني غير صحيحة";
                return null;
            },
            adminPassword: (value) => {
                const pw = value || "";
                if (!pw) return null;
                if (pw.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
                return null;
            },
        }
    });

    const [updateLeague] = useUpdateLeague();
    const [clearLeagueAdmin] = useClearLeagueAdmin();
    const [clearing, setClearing] = useState(false);

    const hasAdmin = !!data?.user?.email;

    const toIntOrZero = (v: any) => {
        if (v === "" || v === null || v === undefined) return 0;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : 0;
    };

    const toDateOrEmpty = (v: any) => {
        if (!v) return "";
        const d = dayjs(v);
        return d.isValid() ? d.toDate() : "";
    };

    const formatDateOrEmpty = (v: any) => {
        if (!v) return "";
        const d = dayjs(v);
        return d.isValid() ? d.format("YYYY-MM-DD") : "";
    };

    useEffect(() => {
        if (data !== null && props.opened) {
            setValues({
                name: data.name,
                description: data.description,
                numberTeams: data.numberTeams ?? "",
                numberGroups: data.numberGroups ?? "",
                internalplayer: data.internalplayer ?? "",
                externalplayer: data.externalplayer ?? "",
                startDate: toDateOrEmpty(data.startDate),
                expiryDate: toDateOrEmpty(data.expiryDate),
                inscriptionStartDate: toDateOrEmpty(data.inscriptionStartDate),
                inscriptionExpiryDate: toDateOrEmpty(data.inscriptionExpiryDate),
                adminEmail: data?.user?.email || "",
                adminPassword: "",
            })
        }
    }, [data, props.opened, setValues])

    const onFormSubmit = ({name, numberTeams, numberGroups, internalplayer, externalplayer, description, startDate, expiryDate, inscriptionStartDate, inscriptionExpiryDate, adminEmail, adminPassword}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const trimmedEmail = (adminEmail || "").trim().toLowerCase();
        const trimmedPassword = adminPassword || "";

        // Pass admin credentials only when:
        //   * creating a new login (email + password both filled, no existing admin), or
        //   * editing an existing login (email present, password optional for email-only update).
        const wantsAdmin = !!trimmedEmail && (hasAdmin || !!trimmedPassword);

        updateLeague({
            variables: {
                id: data.id,
                content: {
                    name,
                    numberTeams: toIntOrZero(numberTeams),
                    numberGroups: toIntOrZero(numberGroups),
                    internalplayer: toIntOrZero(internalplayer),
                    externalplayer: toIntOrZero(externalplayer),
                    description,

                    startDate: formatDateOrEmpty(startDate),
                    expiryDate: formatDateOrEmpty(expiryDate),
                    inscriptionStartDate: formatDateOrEmpty(inscriptionStartDate),
                    inscriptionExpiryDate: formatDateOrEmpty(inscriptionExpiryDate),
                    ...(wantsAdmin ? { adminEmail: trimmedEmail, adminPassword: trimmedPassword } : {})
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل الدورة")
            },
            onError: ({ graphQLErrors }) => {
                const code = graphQLErrors?.[0]?.extensions?.code as string | undefined;
                if (code === "EMAIL_TAKEN") {
                    notyf.error("البريد الإلكتروني مستعمل من قبل حساب آخر")
                } else if (code === "PASSWORD_REQUIRED") {
                    notyf.error("كلمة المرور مطلوبة لإنشاء حساب جديد")
                }
            }
        })
    };

    const onClearAdmin = () => {
        if (!data?.id) return;
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const ok = window.confirm("تأكيد حذف حساب دخول مسؤول الدورة؟");
        if (!ok) return;
        setClearing(true);
        clearLeagueAdmin({
            variables: { idLeague: data.id },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                setClearing(false);
                notyf.success("تم حذف حساب الدخول")
                setValues({ ...(data || {}), adminEmail: "", adminPassword: "" } as any)
            },
            onError: () => { setClearing(false) }
        })
    };

    const closeModal = () => {
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightSection={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >

            <Box style={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <TextInput
                                placeholder="اسم الدورة"
                                label="اسم الدورة"
                                withAsterisk
                                {...getInputProps("name")}
                            />
                        </Col>
                        <Col span={12} >
                            <Textarea
                                placeholder="الوصف"
                                label="الوصف"
                                withAsterisk
                                {...getInputProps("description")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="عدد الفرق (اختياري)"
                                label="عدد الفرق"
                                min={0}
                                {...getInputProps("numberTeams")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="عدد المجموعات (اختياري)"
                                label="عدد المجموعات"
                                min={0}
                                {...getInputProps("numberGroups")}
                            />
                        </Col>

                        <Col span={6} >
                            <NumberInput
                                placeholder="اختياري"
                                label="عدد اللاعبين المحترفين الداخليين المسموح بهم"
                                min={0}
                                {...getInputProps("internalplayer")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="اختياري"
                                label="عدد اللاعبين المحترفين الخارجيين المسموح بهم"
                                min={0}
                                {...getInputProps("externalplayer")}
                            />
                        </Col>


                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ بداية البطولة"
                                label="تاريخ بداية البطولة"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("startDate")}
                            />
                        </Col>
                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ نهاية البطولة"
                                label="تاريخ نهاية البطولة"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("expiryDate")}
                            />
                        </Col>

                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ بداية التسجيل"
                                label="تاريخ بداية التسجيل"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("inscriptionStartDate")}
                            />
                        </Col>
                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ نهاية التسجيل"
                                label="تاريخ نهاية التسجيل"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("inscriptionExpiryDate")}
                            />
                        </Col>

                        <Col span={12}>
                            <Divider
                                my={4}
                                labelPosition="center"
                                label={
                                    <Group gap={6} c="cyan.7">
                                        <IconUserShield size={16} />
                                        <Text fw={600} size="sm">حساب دخول مسؤول الدورة</Text>
                                        {hasAdmin && (
                                            <Badge color="green" variant="light" size="xs">مفعّل</Badge>
                                        )}
                                    </Group>
                                }
                            />
                        </Col>
                        <Col span={12}>
                            <Alert color="gray" variant="light" radius="md" py={8}>
                                <Text size="xs" c="gray.7">
                                    {hasAdmin
                                        ? "اترك كلمة المرور فارغة للإبقاء على القديمة، أو أدخل كلمة مرور جديدة لتحديث الحساب."
                                        : "أدخل بريد وكلمة مرور لإنشاء حساب دخول مستقل لمسؤول هذه الدورة (يستطيع التعديل والإضافة فقط بدون حذف)."}
                                </Text>
                            </Alert>
                        </Col>
                        <Col span={6}>
                            <TextInput
                                placeholder="البريد الإلكتروني"
                                label="البريد الإلكتروني"
                                leftSection={<IconMail size={14} />}
                                type="email"
                                {...getInputProps("adminEmail")}
                            />
                        </Col>
                        <Col span={6}>
                            <PasswordInput
                                placeholder={hasAdmin ? "اتركها فارغة للإبقاء على القديمة" : "كلمة المرور (8 أحرف على الأقل)"}
                                label="كلمة المرور"
                                leftSection={<IconLock size={14} />}
                                {...getInputProps("adminPassword")}
                            />
                        </Col>
                        {hasAdmin && (
                            <Col span={12}>
                                <Group justify="flex-end">
                                    <Button
                                        variant="light"
                                        color="red"
                                        size="xs"
                                        leftSection={<IconTrash size={14} />}
                                        loading={clearing}
                                        onClick={onClearAdmin}
                                    >
                                        حذف حساب الدخول
                                    </Button>
                                </Group>
                            </Col>
                        )}
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
