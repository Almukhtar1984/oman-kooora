import React from "react";
import { Modal, Group, Button, Text } from "@mantine/core";

interface Props {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmationModal = ({ opened, onClose, onConfirm }: Props) => {
    console.log("open DeleteConfirmationModal")
    return (
        <Modal opened={opened} onClose={onClose} title="الفاء الاعارة">
            <Text>
                انت متاكد من عملية الالغاء 
            </Text>
            <Group position="right" mt="md">
                <Button variant="outline" onClick={onClose}>
                    العودة
                </Button>
                <Button color="red" onClick={onConfirm}>
                    تاكيد
                </Button>
            </Group>
        </Modal>
    );
};
