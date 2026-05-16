import React from "react";
import { Box, Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import Modal, { Props as ModalProps } from "../Modal/Modal";

type Props = {
    count:      number;
    status:     "accepted" | "rejected" | string;
    loading?:   boolean;
    onConfirm:  (note: string) => void;
} & ModalProps;

export const BulkStatusConfirmModal = ({
    count,
    status,
    loading,
    onConfirm,
    opened,
    onClose,
    title,
    ...rest
}: Props) => {
    const [note, setNote] = React.useState("");

    React.useEffect(() => {
        if (!opened) setNote("");
    }, [opened]);

    const isAccept = status === "accepted";
    const verb = isAccept ? "قبول" : "رفض";
    const color = isAccept ? "teal" : "red";

    return (
        <Modal
            {...rest}
            opened={opened}
            onClose={onClose}
            title={title || `${verb} جماعي`}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button
                            variant="outline"
                            rightIcon={<X size={15} />}
                            bg="white"
                            onClick={onClose}
                            disabled={loading}
                        >
                            إلغاء
                        </Button>
                        <Button
                            color={color}
                            rightIcon={<Check size={15} />}
                            loading={loading}
                            onClick={() => onConfirm(note)}
                        >
                            تأكيد {verb} ({count})
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Stack p={20} spacing="md">
                <Text size="lg">
                    هل أنت متأكد من <Text component="span" weight={700} color={color}>{verb}</Text>{" "}
                    عدد <Text component="span" weight={700}>{count}</Text> عنصر؟
                </Text>
                <Textarea
                    label={isAccept ? "ملاحظة (اختياري)" : "السبب (اختياري)"}
                    placeholder={isAccept ? "ملاحظة" : "السبب"}
                    value={note}
                    onChange={(e) => setNote(e.currentTarget.value)}
                    minRows={3}
                    maxRows={5}
                    autosize
                />
            </Stack>
        </Modal>
    );
};
