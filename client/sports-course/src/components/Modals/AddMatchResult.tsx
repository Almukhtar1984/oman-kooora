import { Box,Button,Divider,Grid,Group,NumberInput,Switch,Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { AllLeagues,useUpdateMatch } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddMatchResult = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, setFieldValue} = useForm({
        initialValues: {
            firstTeamGoal: 0,
            secondTeamGoal: 0,
            hasPenalty: false,
            firstTeamPenalty: 0,
            secondTeamPenalty: 0,
        }
    });

    const [updateMatch] = useUpdateMatch();

    // Penalty shootout only makes sense when the score is level.
    const isDraw = Number(values.firstTeamGoal || 0) === Number(values.secondTeamGoal || 0);

    const onFormSubmit = ({firstTeamGoal, secondTeamGoal, hasPenalty, firstTeamPenalty, secondTeamPenalty}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        const draw = parseInt(firstTeamGoal) === parseInt(secondTeamGoal);
        const withPenalty = draw && hasPenalty;

        if (withPenalty && parseInt(firstTeamPenalty) === parseInt(secondTeamPenalty)) {
            notyf.error("ضربات الترجيح لا يمكن أن تنتهي بالتعادل — حدّد الفائز");
            return;
        }

        updateMatch({
            variables: {
                id: data.id,
                content: {
                    firstTeamGoal: parseInt(firstTeamGoal),
                    secondTeamGoal: parseInt(secondTeamGoal),
                    // Explicit null clears any stored shootout (e.g. the
                    // result is no longer a draw); the backend keeps it
                    // untouched only when the field is omitted entirely.
                    penalty: withPenalty
                        ? {
                            firstTeamPenalty: parseInt(firstTeamPenalty),
                            secondTeamPenalty: parseInt(secondTeamPenalty),
                        }
                        : null,
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم إضافة النتيجة")
            },
            onError: (err) => {
                notyf.error(err?.message || "فشل إضافة النتيجة")
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightSection={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >

            <Box style={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6} >
                            <NumberInput
                                label={`نتيجة ${data?.firstTeam?.team?.name}`}
                                placeholder={`نتيجة ${data?.firstTeam?.team?.name}`}
                                withAsterisk
                                min={0}
                                {...getInputProps("firstTeamGoal")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                label={`نتيجة ${data?.secondTeam?.team?.name}`}
                                placeholder={`نتيجة ${data?.secondTeam?.team?.name}`}
                                withAsterisk
                                min={0}
                                {...getInputProps("secondTeamGoal")}
                            />
                        </Col>

                        {isDraw && (
                            <Col span={12}>
                                <Divider
                                    label={<Text size="sm" fw={600}>ضربات الترجيح</Text>}
                                    labelPosition="center"
                                    mb={8}
                                />
                                <Switch
                                    label="حُسمت المباراة بضربات الترجيح"
                                    checked={values.hasPenalty}
                                    onChange={(event) => setFieldValue("hasPenalty", event.currentTarget.checked)}
                                />
                            </Col>
                        )}

                        {isDraw && values.hasPenalty && (
                            <>
                                <Col span={6}>
                                    <NumberInput
                                        label={`ترجيح ${data?.firstTeam?.team?.name}`}
                                        placeholder={`ترجيح ${data?.firstTeam?.team?.name}`}
                                        withAsterisk
                                        min={0}
                                        {...getInputProps("firstTeamPenalty")}
                                    />
                                </Col>
                                <Col span={6}>
                                    <NumberInput
                                        label={`ترجيح ${data?.secondTeam?.team?.name}`}
                                        placeholder={`ترجيح ${data?.secondTeam?.team?.name}`}
                                        withAsterisk
                                        min={0}
                                        {...getInputProps("secondTeamPenalty")}
                                    />
                                </Col>
                            </>
                        )}
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
