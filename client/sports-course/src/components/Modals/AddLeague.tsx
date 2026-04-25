import { Box,Button,Grid,Group,NumberInput,Textarea,TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCheck,IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Notyf } from "notyf";
import { AllLeagues,useAddLeague } from "../../graphql";
import useStore from "../../store/useStore";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddLeague = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit} = useForm({
        initialValues: {name: "", description: "", numberTeams: 0, numberGroups: 0, startDate: "", expiryDate: ""}
    });

    const [createLeague] = useAddLeague();

    const onFormSubmit = ({name, numberTeams, numberGroups, description, startDate, expiryDate}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        createLeague({
            variables: {
                content: {
                    name,
                    numberTeams: parseInt(numberTeams || "0"),
                    numberGroups: parseInt(numberGroups || "0"),
                    description,

                    startDate: dayjs(startDate).format("YYYY-MM-DD"),
                    expiryDate: dayjs(expiryDate).format("YYYY-MM-DD"),
                    id_club: idClub
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
                        <Col span={12} >
                            <TextInput
                                placeholder="اسم الدورة"
                                label="اسم الدورة"
                                withAsterisk
                                {...getInputProps("name")}
                            />
                        </Col>
                        <Col span={12} >
                            <Textarea
                                placeholder="الوصف"
                                label="الوصف"
                                withAsterisk
                                {...getInputProps("description")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="عدد الفرق"
                                label="عدد الفرق"
                                withAsterisk
                                {...getInputProps("numberTeams")}
                            />
                        </Col>
                        <Col span={6} >
                            <NumberInput
                                placeholder="عدد المجموعات"
                                label="عدد المجموعات"
                                withAsterisk
                                {...getInputProps("numberGroups")}
                            />
                        </Col>

                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ البداية"
                                label="تاريخ البداية"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("startDate")}
                            />
                        </Col>
                        <Col span={6} >
                            <DateInput
                                placeholder="تاريخ النهاية"
                                label="تاريخ النهاية"
                                valueFormat={"YYYY-MM-DD"}
                                withAsterisk
                                {...getInputProps("expiryDate")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
