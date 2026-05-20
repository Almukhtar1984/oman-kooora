import { Box, Button, Grid, Group, TextInput, Text, ThemeIcon, Stack, useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck, IconX, IconUserShield } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect } from "react";
import { AllLeagues, useCreateArbitre } from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

const { Col } = Grid;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const ManageReferees = ({ data, ...props }: Props) => {
    const theme = useMantineTheme();

    const { getInputProps, reset, onSubmit, setValues } = useForm({
        initialValues: {
            Arbitre1: "",
            Arbitre2: "",
            Arbitre3: "",
            Arbitre4: "",
        },
    });

    useEffect(() => {
        if (props.opened) {
            setValues({
                Arbitre1: data?.arbitre?.Arbitre1 || "",
                Arbitre2: data?.arbitre?.Arbitre2 || "",
                Arbitre3: data?.arbitre?.Arbitre3 || "",
                Arbitre4: data?.arbitre?.Arbitre4 || "",
            });
        }
    }, [props.opened, data, setValues]);

    const [createArbitre, { loading }] = useCreateArbitre();

    const onFormSubmit = (values: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        createArbitre({
            variables: {
                id_match: data?.id,
                Arbitre1: values.Arbitre1?.trim() || "",
                Arbitre2: values.Arbitre2?.trim() || "",
                Arbitre3: values.Arbitre3?.trim() || "",
                Arbitre4: values.Arbitre4?.trim() || "",
            },
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: true,
            onCompleted: () => {
                closeModal();
                notyf.success("تم حفظ الحكام");
            },
            onError: (err) => {
                notyf.error(err?.message || "فشل حفظ الحكام");
            },
        });
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
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>
                            إلغاء
                        </Button>
                        <Button rightSection={<IconCheck size={15} />} type="submit" form="referees_form" loading={loading}>
                            حفظ
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{ padding: 20 }}>
                <Group gap={10} align="center" mb={16}>
                    <ThemeIcon size={36} radius="md" variant="light" color="cyan">
                        <IconUserShield size={20} />
                    </ThemeIcon>
                    <Stack gap={2}>
                        <Text fw={600} c={theme.colors.gray[8]}>طاقم التحكيم</Text>
                        <Text size="xs" c={theme.colors.gray[5]}>
                            {`${data?.firstTeam?.team?.name || ""} ضد ${data?.secondTeam?.team?.name || ""}`}
                        </Text>
                    </Stack>
                </Group>

                <form onSubmit={onSubmit(onFormSubmit)} id="referees_form">
                    <Grid gutter={16}>
                        <Col span={6}>
                            <TextInput
                                label="الحكم الرئيسي"
                                placeholder="اسم الحكم الرئيسي"
                                {...getInputProps("Arbitre1")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الحكم المساعد الأول"
                                placeholder="اسم المساعد الأول"
                                {...getInputProps("Arbitre2")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الحكم المساعد الثاني"
                                placeholder="اسم المساعد الثاني"
                                {...getInputProps("Arbitre3")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الحكم الرابع"
                                placeholder="اسم الحكم الرابع"
                                {...getInputProps("Arbitre4")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
