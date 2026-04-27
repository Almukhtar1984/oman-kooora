import { Box, Button, Group, Text } from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { AllTechnicals, useDeletePerson } from "../../graphql";

type Props = {
    id?: any;
    closeModalParent:any;
} & ModalProps;

export const DeletePersonModal = ({ id,closeModalParent, ...props }: Props) => {
    const [deletePerson] = useDeletePerson();

    const onSubmit = () => {
        deletePerson({
            variables: { id },
            refetchQueries: [AllTechnicals] // Adjust if needed
        })
        .then(() => {
            closeModal();
            closeModalParent()
        })
        .catch(reason => {
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
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>
                            إلغاء
                        </Button>
                        <Button rightIcon={<Check size={15} />} bg="red" onClick={onSubmit}>
                            حذف
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={{ padding: 20 }}>
                <Text size="lg" ta="center" my={20}>
                    هل انت متأكد من حذف هذا الشخص ؟
                </Text>
            </Box>
        </Modal>
    );
};
