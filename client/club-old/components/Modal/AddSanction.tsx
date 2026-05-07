import {
    Box,
    Button,
    Col,
    Grid,
    Group,
    Loader,
    Overlay,
    TextInput,
    Stack,
    Text,
    Select,
} from "@mantine/core";
import React, { useState } from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import { useCreateSanction as useAddSanction, AllPlayers } from "../../graphql";
import { Calendar } from "tabler-icons-react";
import { Notyf } from "notyf";
import { DateInput } from "@mantine/dates";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
    player: any;
} & ModalProps;

export const AddSanctionModal = ({ player, ...props }: Props) => {
    const { getInputProps, reset, onSubmit } = useForm({
        initialValues: { note: "", id_player: "", date_from: "", date_to: "" }
    });
    const [loading, setLoading] = useState(false);
    const [createSanction] = useAddSanction();

    const onFormSubmit = ({ note, id_player, date_from, date_to }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        setLoading(true);
        createSanction({
            variables: {
                content: {
                    note,
                    id_player: typeof player === 'object' ? player?.id : player,
                    date_from,
                    date_to
                }
            },
            refetchQueries: [AllPlayers],
            onCompleted: () => {
                closeModal();
                notyf.success("تم إنشاء العقوبة بنجاح");
            },
            onError: ({ graphQLErrors }) => {
                setLoading(false);
                notyf.error("حدث خطأ أثناء إنشاء العقوبة");
            }
        });
    };

    const closeModal = () => {
        setLoading(false);
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" onClick={closeModal}>إلغاء</Button>
                        <Button type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ?
                <Overlay opacity={0.9} color="#fff" zIndex={5}>
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم إنشاء العقوبة يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({ padding: 20 })}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <TextInput
                                placeholder="ملاحظة"
                                label="ملاحظة"
                                withAsterisk
                                {...getInputProps("note")}
                            />
                        </Col>
                       
                        <Col span={12}>
                            <DateInput
                                label="تاريخ البداية"
                                placeholder="اختر تاريخ البداية"
                                icon={<Calendar size={16} />}
                                withAsterisk
                                {...getInputProps("date_from")}
                            />
                        </Col>
                        <Col span={12}>
                            <DateInput
                                label="تاريخ النهاية"
                                placeholder="اختر تاريخ النهاية"
                                icon={<Calendar size={16} />}
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
