import {
  Box,
  Button,
  Group,
} from "@mantine/core";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { PlayerStats1 } from "../Card/PlayerCard";

type Props = {
  item: any;
} & ModalProps;

export const PlayerModel = ({ item, opened, onClose }: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      padding="lg"
      withCloseButton={false}
      footer={
        <Box py={16} px={20} bg="slate.0">
          <Group position={"right"} spacing={"xs"}>
            <Button type="button" variant="light" color="gray" onClick={onClose}>
              إغلاق
            </Button>
            <Button type="button" onClick={onClose}>
              تأكيد
            </Button>
          </Group>
        </Box>
      }
    >
      <Box sx={{ padding: '20px 0' }}>
        <PlayerStats1 data={item} />
      </Box>
    </Modal>
  );
};
