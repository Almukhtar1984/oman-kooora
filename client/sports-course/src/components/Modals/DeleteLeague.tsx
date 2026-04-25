import { Box,Button,Grid,Group,Text } from "@mantine/core";
import { IconCheck,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { AllLeagues,useDeleteLeague } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const DeleteLeague = ({data, ...props}: Props) => {
    const [deleteLeague] = useDeleteLeague();

    const onFormSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        deleteLeague({
            variables: {
                id: data
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم حذف الدورة")
            },
            onError: () => void 0
        })
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightSection={<IconCheck size={15} />} onClick={onFormSubmit}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box style={({ colors }) => ({padding: 20})}>
                <Grid gutter={20}>
                    <Col span={12} >
                        <Text size={"md"} ta={"center"} mb={10} >
                            هل انت متاكد من حذف الدورة؟
                        </Text>
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};
