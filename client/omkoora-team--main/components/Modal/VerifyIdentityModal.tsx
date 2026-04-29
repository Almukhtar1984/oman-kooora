import {Box, Button, Col, Grid, Group, Image, Stack, Text, Textarea,} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, useChangeStatusPlayer} from "../../graphql";
import { useForm } from "react-hook-form";

type Props = {
    data: any;
    setNewStatus?: (status: string) => void;
    setOpenChangeStatusModal?: (open: boolean) => void;
} & ModalProps;

export const VerifyIdentityModal = ({data, opened, setNewStatus, setOpenChangeStatusModal, ...props}: Props) => {
    const closeModal = () => {
        props.onClose();
    };

    const openModelChangeStatus = (status: string) => {
        typeof setNewStatus === "function" && setNewStatus(status)
        typeof setOpenChangeStatusModal === "function" && setOpenChangeStatusModal(true)
        closeModal()
    }

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="default"   onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<X size={15} />} variant="filled" bg="red" onClick={() => openModelChangeStatus("rejected")}>رفض</Button>
                        <Button rightIcon={<Check size={15} />} variant="filled" bg="green" onClick={() => openModelChangeStatus("waiting_club")}>قبول</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>

                <Grid gutter={20} w={"100%"}>
                    <Col span={12}>
                        <Image src={`${process.env.NEXT_PUBLIC_API_URL}/images/${data?.nationalID}`} alt={""} height={"300px"} width={"100%"} />
                    </Col>
                    <Col span={12}>
                        <Image src={`${process.env.NEXT_PUBLIC_API_URL}/images/${data?.nationalIDBack}`} alt={""} height={"300px"} width={"100%"} />
                    </Col>

                    <Col span={12}>
                        <Text ta={"left"} fw={"bold"}>
                            رقم الهوية :
                            <Text fw={400} span={true} mx={5}>
                                {data?.person?.card_number}
                            </Text>
                        </Text>
                    </Col>
                </Grid>
            </Stack>
        </Modal>
    );
};