import { Alert, Box, Button, FileInput, Group, Stack, Text, Textarea } from "@mantine/core";
import { Check, FileUpload, InfoCircle, X } from "tabler-icons-react";
import React, { useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { AllPlayers, useCreatePlayerRelease } from "../../graphql";
import { Notyf } from "notyf";

type Props = {
    data: any;          // the player card's row
} & ModalProps;

// طلب استقالة / إخلاء طرف للاعب.
//
// This is the step that was missing: a player could only leave through a
// transfer, which needs a club ready to take him the same day. Here the club
// records the resignation with its letter, and the player is released.
export const PlayerReleaseModal = ({ data, opened, ...props }: Props) => {
    const [reason, setReason] = useState("");
    const [letter, setLetter] = useState<File | null>(null);
    const [createRelease, { loading }] = useCreatePlayerRelease();

    const playerId = typeof data === "object" ? data?.id : data;
    const person = data?.person;
    const fullName = [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(Boolean).join(" ");

    const closeModal = () => {
        setReason("");
        setLetter(null);
        props.onClose();
    };

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!playerId) { notyf.error("لم يتم تحديد اللاعب"); return; }

        createRelease({
            variables: {
                content: {
                    id_player: playerId,
                    reason: reason.trim() || undefined,
                    letter: letter || undefined,
                },
            },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                notyf.success("تم رفع طلب إخلاء الطرف — بانتظار اعتماد النادي");
                closeModal();
            },
            onError: (error) => {
                notyf.error(error?.message || "تعذّر رفع الطلب");
            },
        });
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} loading={loading} onClick={onSubmit}>رفع الطلب</Button>
                    </Group>
                </Box>
            }
        >
            <Box p={20}>
                <Stack spacing="md">
                    {fullName && (
                        <Text size="sm" color="gray.7">
                            اللاعب: <b>{fullName}</b>
                            {person?.card_number ? ` — الرقم المدني ${person.card_number}` : ""}
                        </Text>
                    )}

                    <Alert variant="light" color="blue" icon={<InfoCircle size={16} />}>
                        باعتماد النادي للطلب يتحرّر اللاعب من فريقه ويصبح متاحاً للتسجيل في نادٍ جديد،
                        ويُحفظ تاريخ الاستقالة والتحرير في سجلّه.
                    </Alert>

                    <Textarea
                        label="سبب الاستقالة"
                        placeholder="اذكر سبب الاستقالة أو إخلاء الطرف"
                        minRows={3}
                        value={reason}
                        onChange={(e) => setReason(e.currentTarget.value)}
                    />

                    <FileInput
                        label="خطاب الاستقالة"
                        description="PDF أو صورة أو Word"
                        placeholder="اختر الملف"
                        icon={<FileUpload size={16} />}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        value={letter}
                        onChange={setLetter}
                        clearable
                    />
                </Stack>
            </Box>
        </Modal>
    );
};
