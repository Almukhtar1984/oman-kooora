import {Anchor, Box, Button, Col, Grid, Group, Image, Stack, Text} from "@mantine/core";
import {Check, FileText, X} from "tabler-icons-react";
import React from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { getImageUrl } from "../../lib/helpers/image";

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

    const person = data?.person;
    const fullName = [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(Boolean)
        .join(" ");

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="default" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<X size={15} />} variant="filled" bg="red" onClick={() => openModelChangeStatus("rejected")}>رفض</Button>
                        <Button rightIcon={<Check size={15} />} variant="filled" bg="green" onClick={() => openModelChangeStatus("accepted")}>قبول</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>
                <Grid gutter={20} w={"100%"}>
                    <Col span={12}>
                        <Text ta={"right"} fw={"bold"}>
                            الاسم الكامل :
                            <Text fw={400} span={true} mx={5}>
                                {fullName || "-"}
                            </Text>
                        </Text>
                    </Col>
                    <Col span={12}>
                        <Text ta={"right"} fw={"bold"}>
                            رقم الهوية :
                            <Text fw={400} span={true} mx={5}>
                                {person?.card_number || "-"}
                            </Text>
                        </Text>
                    </Col>

                    <Col span={12}>
                        <Text fw={"bold"} mb={6}>البطاقة المدنية (الوجه الأمامي)</Text>
                        {data?.nationalID
                            ? <Image src={getImageUrl(data.nationalID)} alt={"national-id-front"} height={"300px"} width={"100%"} />
                            : <Text c={"gray.6"}>غير مرفقة</Text>
                        }
                    </Col>
                    <Col span={12}>
                        <Text fw={"bold"} mb={6}>البطاقة المدنية (الوجه الخلفي)</Text>
                        {data?.nationalIDBack
                            ? <Image src={getImageUrl(data.nationalIDBack)} alt={"national-id-back"} height={"300px"} width={"100%"} />
                            : <Text c={"gray.6"}>غير مرفقة</Text>
                        }
                    </Col>

                    <Col span={12}>
                        <Text fw={"bold"} mb={6}>استمارة موافقة ولي الأمر</Text>
                        {data?.parentApproval
                            ? <Anchor href={getImageUrl(data.parentApproval)} target={"_blank"} rel={"noopener noreferrer"}>
                                <Group spacing={6}>
                                    <FileText size={18} />
                                    <Text>عرض الاستمارة</Text>
                                </Group>
                              </Anchor>
                            : <Text c={"gray.6"}>غير مرفقة</Text>
                        }
                    </Col>
                </Grid>
            </Stack>
        </Modal>
    );
};
