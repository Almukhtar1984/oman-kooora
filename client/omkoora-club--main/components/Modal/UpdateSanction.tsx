import {
    ActionIcon,
    Box,
    Button,
    Grid,
    Group,
    TextInput,
    Tooltip,
    Text,
    useMantineTheme
} from "@mantine/core";
import { IconCheck, IconX, IconTrash } from "@tabler/icons-react";
import React, { useEffect } from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import { useSanctionLast, useUpdateSanction, useDeleteSanction, AllPlayers } from "../../graphql";
import { Notyf } from "notyf";
import dayjs from "dayjs";

const { Col } = Grid;

type Props = {
    playerId: string;
} & ModalProps;

export const UpdateSanction = ({ playerId, ...props }: Props) => {
    const theme = useMantineTheme();
    const { getInputProps, reset, onSubmit, setValues } = useForm({
        initialValues: {
            note: "",
            date_from: "",
            date_to: "",
        },
    });

    const [getSanctionLast, { loading, data:sanctionData, error }] = useSanctionLast();
    const [updateSanction] = useUpdateSanction();
    const [deleteSanction] = useDeleteSanction();

    useEffect(() => {
        if (sanctionData && props.opened === true) {
            console.log(sanctionData)
            const sanction = sanctionData?.SanctionLast;
            console.log(sanctionData)
            setValues({
                note: sanction?.note || "",
                date_from: sanction?.date_from ? dayjs(sanction.date_from).format("YYYY-MM-DD") : "",
                date_to: sanction?.date_to ? dayjs(sanction.date_to).format("YYYY-MM-DD") : "",
            });
        }
    }, [sanctionData ,props.opened]);
    useEffect(() => {
        const id = typeof playerId === 'object' ? (playerId as any)?.id : playerId;
        if (id && props.opened) {
            getSanctionLast({ variables: { id_player: id } });
        }
    }, [ props.opened]);

    const onFormSubmit = ({ note, date_from, date_to }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
   
        updateSanction({
            variables: {
                id: sanctionData?.SanctionLast?.id || '',
                content: {
                    note,
                    date_from,
                    date_to,
                },
            },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                closeModal();
                notyf.success("تم تحديث العقوبة بنجاح");
            },
            onError: () => {
                notyf.error("حدث خطأ أثناء تحديث العقوبة");
            },
        });
    };

    const handleDelete = async () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        await deleteSanction({
            variables: { id: sanctionData?.SanctionLast?.id || "" },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                closeModal();
                notyf.success("تم حذف العقوبة بنجاح");
            },
            onError: () => {
                notyf.error("حدث خطأ أثناء حذف العقوبة");
            },
        });
    };

    const handleCancel = async () => {
        closeModal();
    };

    const closeModal = () => {
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="left" spacing="xs">
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>
                            إلغاء
                        </Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">
                            تأكيد
                        </Button>
                        <Button color="red" rightIcon={<IconTrash size={15} />} onClick={handleDelete}>
                            حذف
                        </Button>
                       
                    </Group>
                </Box>
            }
            zIndex={201}
        >
            <Box style={{ padding: 20 }}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} mb={20}>
                            <Group position={"center"} align="center">
                                <Text size={"16px"} c={theme.colors.gray[6]}>
                                    {`ملاحظة: ${sanctionData?.SanctionLast?.note || "لا توجد ملاحظة"}`}
                                </Text>
                            </Group>
                        </Col>
                        <Col span={12}>
                            <TextInput
                                placeholder="ملاحظة"
                                label="ملاحظة"
                                withAsterisk
                                {...getInputProps("note")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                placeholder="تاريخ البداية"
                                label="تاريخ البداية"
                                type="date"
                                withAsterisk
                                {...getInputProps("date_from")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                placeholder="تاريخ النهاية"
                                label="تاريخ النهاية"
                                type="date"
                                withAsterisk
                                {...getInputProps("date_to")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
