import { Alert,Box,Button,Divider,Grid,Group,NumberInput,PasswordInput,Text,Textarea,TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCheck,IconLock,IconMail,IconUserShield,IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Notyf } from "notyf";
import { AllLeagues,useAddLeague } from "../../graphql";
import useStore from "../../store/useStore";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddLeague = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit} = useForm({
        initialValues: {
            name: "",
            description: "",
            numberTeams: "" as any,
            numberGroups: "" as any,
            internalplayer: "" as any,
            externalplayer: "" as any,
            startDate: "",
            expiryDate: "",
            inscriptionStartDate: "",
            inscriptionExpiryDate: "",
            adminEmail: "",
            adminPassword: "",
        },
        validate: {
            adminEmail: (value, values) => {
                const email = (value || "").trim();
                const pw = (values as any).adminPassword || "";
                if (!email && !pw) return null;
                if (!email) return "البريد الإلكتروني مطلوب لإنشاء الحساب";
                if (!EMAIL_PATTERN.test(email)) return "صيغة البريد الإلكتروني غير صحيحة";
                return null;
            },
            adminPassword: (value, values) => {
                const email = ((values as any).adminEmail || "").trim();
                const pw = value || "";
                if (!email && !pw) return null;
                if (!pw) return "كلمة المرور مطلوبة لإنشاء الحساب";
                if (pw.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
                return null;
            },
        }
    });

    const [createLeague] = useAddLeague();

    const toIntOrZero = (v: any) => {
        if (v === "" || v === null || v === undefined) return 0;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : 0;
    };

    const formatDateOrEmpty = (v: any) => {
        if (!v) return "";
        const d = dayjs(v);
        return d.isValid() ? d.format("YYYY-MM-DD") : "";
    };

    const onFormSubmit = ({name, numberTeams, numberGroups, internalplayer, externalplayer, description, startDate, expiryDate, inscriptionStartDate, inscriptionExpiryDate, adminEmail, adminPassword}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;
        const trimmedEmail = (adminEmail || "").trim().toLowerCase();
        const trimmedPassword = adminPassword || "";

        createLeague({
            variables: {
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
                    id_club: idClub,
                    ...(trimmedEmail && trimmedPassword ? { adminEmail: trimmedEmail, adminPassword: trimmedPassword } : {})
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الدورة")
            },
            onError: ({ graphQLErrors }) => {
                const code = graphQLErrors?.[0]?.extensions?.code as string | undefined;
                if (code === "EMAIL_TAKEN") {
                    notyf.error("البريد الإلكتروني مستعمل من قبل حساب آخر")
                }
            }
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
                                        <Text fw={600} size="sm">حساب دخول مسؤول الدورة (اختياري)</Text>
                                    </Group>
                                }
                            />
                        </Col>
                        <Col span={12}>
                            <Alert color="gray" variant="light" radius="md" py={8}>
                                <Text size="xs" c="gray.7">
                                    عند إدخال البريد وكلمة المرور سيتم إنشاء حساب دخول مستقل لمسؤول هذه الدورة. الحساب يستطيع التعديل والإضافة فقط (بدون حذف)، ويرى دورته فقط بعد تسجيل الدخول.
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
                                placeholder="كلمة المرور (8 أحرف على الأقل)"
                                label="كلمة المرور"
                                leftSection={<IconLock size={14} />}
                                {...getInputProps("adminPassword")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
