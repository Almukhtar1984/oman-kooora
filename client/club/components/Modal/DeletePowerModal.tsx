import { Box, Button, Group, Text } from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { useDeleteClubManagement ,AllClubManagement} from "../../graphql";
import { Notyf } from "notyf";

type Props = {
    data?: string;
} & ModalProps;

export const DeletePowerModal = ({ id, ...props }: Props) => {
    const [deletePermission] = useDeleteClubManagement();
   
    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!id) return;
        
        deletePermission({
            variables: { id: id },
            
            refetchQueries: [AllClubManagement],
        })
        .then(() => {
            closeModal();
            notyf.success("تم حذف المستخدم بنجاح")
        })
        .catch(reason => {
            notyf.error("حدث خطأ أثناء حذف المستخدم")
        });
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="right" spacing="xs">
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} bg="red" onClick={onSubmit}>حذف</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={{ padding: 20 }}>
                <Text size="lg" ta="center" my={20}>هل انت متأكد من حذف هذا المستخدم؟</Text>
            </Box>
        </Modal>
    );
};
