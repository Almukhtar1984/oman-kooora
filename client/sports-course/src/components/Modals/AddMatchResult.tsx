import { Box,Button,Grid,Group,NumberInput } from "@mantine/core";
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
    const {getInputProps, reset, onSubmit} = useForm({
        initialValues: {firstTeamGoal: 0, secondTeamGoal: 0}
    });

    const [updateMatch] = useUpdateMatch();

    const onFormSubmit = ({firstTeamGoal, secondTeamGoal}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateMatch({
            variables: {
                id: data.id,
                content: {
                    firstTeamGoal: parseInt(firstTeamGoal),
                    secondTeamGoal: parseInt(secondTeamGoal),
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الدورة")
            },
            onError: () => void 0
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
                                {...getInputProps("firstTeamGoal")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                label={`نتيجة ${data?.secondTeam?.team?.name}`}
                                placeholder={`نتيجة ${data?.secondTeam?.team?.name}`}
                                withAsterisk
                                {...getInputProps("secondTeamGoal")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
