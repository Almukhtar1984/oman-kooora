import { Box, Button, Group, Text } from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "../../components/Modal/Modal";
import { reservationsByTeam, useDeleteReservation } from "../../graphql";

type Props = {
  data?: any;
} & ModalProps;

export const DeleteReservation = ({ data, ...props }: Props) => {
  const [deleteReservation] = useDeleteReservation();

  const onSubmit = () => {
    deleteReservation({
      variables: {
        id: data?.id,
      },
      refetchQueries: [reservationsByTeam],
    })
      .then(() => {
        closeModal();
      })
      .catch((reason) => {
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
          <Group position={"right"} spacing={"xs"}>
            <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>
              إلغاء
            </Button>
            <Button rightIcon={<Check size={15} />} bg={"red"} onClick={onSubmit}>
              حذف
            </Button>
          </Group>
        </Box>
      }
    >
      <Box sx={{ padding: 20 }}>
        <Text size={"lg"} align={"center"} my={20}>
          هل انت متأكد من حذف هذا الحجز ؟
        </Text>
      </Box>
    </Modal>
  );
};
