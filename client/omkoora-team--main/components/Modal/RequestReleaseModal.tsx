import { Alert, Box, Button, FileInput, Group, Stack, Text, Textarea } from "@mantine/core";
import { Check, InfoCircle, Paperclip, X } from "tabler-icons-react";
import React, { useEffect, useState } from "react";
import { Notyf } from "notyf";
import Modal, { Props as ModalProps } from "./Modal";
import { AllPlayers, useCreatePlayerRelease } from "../../graphql";

type Props = {
    data?: any;
    idTeam?: string;
} & ModalProps;

const fullName = (person: any) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe].filter(Boolean).join(" ");

// طلب استقالة لاعب من الفريق (اجتماع العميل، 2026-11-16): «الفريق يطلب الاستقالة،
// يروح عند النادي، النادي يقول اعتماد مبدئي، يدفع الرسوم، يقول تمّت استقالة
// اللاعب ويكون لاعب حر، ويطلع من الفريق… بعد ذلك أي فريق يريده يسجّله».
export const RequestReleaseModal = ({ data, idTeam, ...props }: Props) => {
    const [reason, setReason] = useState("");
    const [letter, setLetter] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [createRelease, { loading }] = useCreatePlayerRelease();

    useEffect(() => {
        if (props.opened) { setReason(""); setLetter(null); setError(null); }
    }, [props.opened]);

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!reason.trim()) { setError("اكتب سبب الاستقالة"); return; }
        createRelease({
            variables: { content: { id_player: data?.id, reason: reason.trim(), letter } },
            refetchQueries: idTeam ? [{ query: AllPlayers, variables: { idTeam } }] : [],
        })
            .then(() => {
                notyf.success({ message: "أُرسل طلب الاستقالة إلى النادي — تابعه من «الطلبات»", duration: 8000 });
                props.onClose();
            })
            .catch((reason: any) => {
                notyf.error({ message: reason?.graphQLErrors?.[0]?.message || "تعذّر إرسال طلب الاستقالة", duration: 10000 });
            });
    };

    return (
        <Modal
            {...props}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={props.onClose}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} color="red" loading={loading} onClick={onSubmit}>
                            إرسال طلب الاستقالة
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Stack p={20} spacing="md">
                <Text weight={700}>{fullName(data?.person) || "اللاعب"}</Text>
                <Alert color="blue" icon={<InfoCircle size={16} />}>
                    يُرسل الطلب إلى النادي: يقبله مبدئياً، ثم يطالب برسوم الاستقالة، وبعد السداد والاعتماد
                    النهائي يخرج اللاعب من الفريق ويصبح لاعباً حراً يمكن لأي فريق تسجيله.
                </Alert>
                <Textarea
                    label="سبب الاستقالة"
                    placeholder="مثال: بناءً على طلب اللاعب"
                    withAsterisk
                    minRows={3}
                    value={reason}
                    onChange={(e) => { setReason(e.currentTarget.value); setError(null); }}
                    error={error}
                />
                <FileInput
                    label="خطاب الاستقالة (اختياري)"
                    description="PDF أو Word أو صورة"
                    icon={<Paperclip size={16} />}
                    clearable
                    value={letter}
                    onChange={setLetter}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
            </Stack>
        </Modal>
    );
};

export default RequestReleaseModal;
