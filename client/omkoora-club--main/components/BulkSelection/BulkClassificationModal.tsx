import React from "react";
import { Box, Button, Group, Select, Stack, Text } from "@mantine/core";
import { Check, X, ChevronDown } from "tabler-icons-react";
import Modal, { Props as ModalProps } from "../Modal/Modal";
import { TECHNICAL_CLASSIFICATIONS } from "../../constants/technicalClassifications";

type Props = {
    count:      number;
    loading?:   boolean;
    onConfirm:  (classification: string) => void;
} & ModalProps;

// Assign one role (الصفة) to all selected technical-staff rows at once.
export const BulkClassificationModal = ({
    count,
    loading,
    onConfirm,
    opened,
    onClose,
    title,
    ...rest
}: Props) => {
    const [classification, setClassification] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!opened) setClassification(null);
    }, [opened]);

    return (
        <Modal
            {...rest}
            opened={opened}
            onClose={onClose}
            title={title || "تعديل الصفة (جماعي)"}
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
                            color="blue"
                            rightIcon={<Check size={15} />}
                            loading={loading}
                            disabled={!classification}
                            onClick={() => classification && onConfirm(classification)}
                        >
                            تطبيق على ({count})
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Stack p={20} spacing="md">
                <Text size="lg">
                    إسناد الصفة إلى{" "}
                    <Text component="span" weight={700}>{count}</Text> عضو من الجهاز الفني دفعة واحدة.
                </Text>
                <Select
                    label="الصفة الجديدة"
                    placeholder="اختر الصفة"
                    withinPortal
                    withAsterisk
                    rightSection={<ChevronDown size={14} />}
                    rightSectionWidth={30}
                    styles={{ rightSection: { pointerEvents: "none" } }}
                    data={TECHNICAL_CLASSIFICATIONS}
                    value={classification}
                    onChange={setClassification}
                />
            </Stack>
        </Modal>
    );
};
