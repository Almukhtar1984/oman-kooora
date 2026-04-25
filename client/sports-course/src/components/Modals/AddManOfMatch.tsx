import { Box,Button,Grid,Group,TextInput } from "@mantine/core";
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

export const AddManOfMatch = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit} = useForm({
        initialValues: {manOfMatch: ""}
    });

    const [updateMatch] = useUpdateMatch();

    const onFormSubmit = ({manOfMatch}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateMatch({
            variables: {
                id: data.id,
                content: {
                    manOfMatch
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة رجل المباراة")
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
                        <Col span={12} >
                            <TextInput
                                placeholder="اللاعب "
                                label="اللاعب"
                                withAsterisk
                                {...getInputProps("manOfMatch")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
