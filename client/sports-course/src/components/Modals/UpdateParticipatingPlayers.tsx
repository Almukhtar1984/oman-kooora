import { Box,Button,Grid,Group,Text,TextInput,useMantineTheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect } from "react";
import { AllParticipatingPlayers,useUpdateParticipatingPlayers } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateParticipatingPlayers = ({data, ...props}: Props) => {
    const theme = useMantineTheme();
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {number: ""}
    });
    const [updateParticipatingPlayers] = useUpdateParticipatingPlayers();


    useEffect(() => {
        if (data !== null && props.opened) {
            setValues({
                number: data.number
            })
        }
    }, [data, props.opened, setValues])

    const onFormSubmit = ({number}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateParticipatingPlayers({
            variables: {
                content: [{
                    id: data.id,
                    number
                }]
            },
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل اللاعب")
            },
            refetchQueries: [AllParticipatingPlayers],
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
            zIndex={201}
        >
            <Box style={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} mb={20} >
                            <Group justify={"center"} align="center">
                                <Text size={"16px"} c={theme.colors.gray[6]}>
                                    {`${data?.player?.person?.first_name} ${data?.player?.person?.second_name} ${data?.player?.person?.third_name} ${data?.player?.person?.tribe}`}
                                </Text>
                            </Group>
                        </Col>
                        <Col span={12} >
                            <TextInput
                                placeholder="رقم القميص"
                                label="رقم القميص"
                                withAsterisk
                                {...getInputProps(`number`)}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
