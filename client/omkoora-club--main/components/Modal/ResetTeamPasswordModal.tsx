import {ActionIcon, Alert, Box, Button, CopyButton, Group, Loader, Overlay, Stack, Text, Title, Tooltip} from "@mantine/core";
import {Check, Copy, X} from "tabler-icons-react";
import React, {useState} from "react";
import {Notyf} from "notyf";

import Modal, {Props as ModalProps} from "./Modal";
import {useResetTeamPassword} from "./../../graphql";

type Props = {
    data?: {id?: string; name?: string; admin?: {email?: string} | null} | null;
} & ModalProps;

export const ResetTeamPasswordModal = (props: Props) => {
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<{email: string; password: string} | null>(null);
    const [resetTeamPassword] = useResetTeamPassword();

    const teamId = props?.data?.id;
    const teamName = props?.data?.name;

    const onConfirm = async () => {
        const notyf = new Notyf({position: {x: "right", y: "bottom"}});
        if (!teamId) {
            notyf.error("لم يتم تحديد الفريق");
            return;
        }
        setLoading(true);
        try {
            const res = await resetTeamPassword({variables: {idTeam: teamId}});
            const payload = res?.data?.resetTeamPassword;
            if (!payload) throw new Error("empty payload");
            setCredentials({email: payload.email, password: payload.password});
            notyf.success("تم إنشاء كلمة مرور جديدة");
        } catch (err: any) {
            const code = err?.graphQLErrors?.[0]?.extensions?.code;
            if (code === "TEAM_MANAGER_NOT_FOUND" || code === "USER_NOT_EXIST") {
                notyf.error("هذا الفريق ليس لديه مدير حساب");
            } else if (code === "FORBIDDEN_TEAM" || code === "FORBIDDEN_ROLE") {
                notyf.error("ليس لديك صلاحية على هذا الفريق");
            } else {
                notyf.error("تعذرت إعادة التعيين");
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setLoading(false);
        setCredentials(null);
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
                        <Title order={4}>تم إنشاء كلمة مرور جديدة</Title>
                        <Alert color="orange" title="احفظ هذه البيانات الآن">
                            لن تظهر كلمة المرور مرة أخرى. سلّمها لمدير الفريق بأمان.
                        </Alert>
                        <CredentialRow label="البريد الإلكتروني" value={credentials.email} />
                        <CredentialRow label="كلمة المرور الجديدة" value={credentials.password} mono />
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
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button color="red" rightIcon={<Check size={15} />} onClick={onConfirm}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ? (
                <Overlay opacity={0.9} color="#fff" zIndex={5}>
                    <Stack align="center" justify="center" h="100%" w="100%">
                        <Loader size="xl" variant="dots" />
                        <Text size="lg" fw={500}>جاري إعادة التعيين، يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
            ) : null}

            <Box p={20}>
                <Stack spacing="md">
                    <Title order={5}>إعادة تعيين كلمة المرور</Title>
                    <Text size="sm" c="slate.7">
                        سيتم إنشاء كلمة مرور جديدة لمدير الفريق
                        {teamName ? ` "${teamName}"` : ""}.
                    </Text>
                    <Alert color="orange">
                        كلمة المرور الحالية ستُلغى نهائيا، ولن يستطيع المدير الدخول بها مجددا.
                    </Alert>
                </Stack>
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
