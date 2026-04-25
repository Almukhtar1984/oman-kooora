import { Box,Button,Grid,Group,Select,TextInput } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCheck,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect,useState } from "react";
import { AllLeagues,useAddMatchCard } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddMatchCard = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit} = useForm({
        initialValues: {date: "", type: "", player: "", id_team: ""}
    });
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);

    const [createMatchCard] = useAddMatchCard();

    useEffect(() => {
        if (data !== null && props.opened) {
            setAllTeams([
                {value: data?.firstTeam?.id, label: data?.firstTeam?.team.name},
                {value: data?.secondTeam?.id, label: data?.secondTeam?.team.name}
            ])
        }
    }, [data, props.opened])

    const onFormSubmit = ({date, type, player, id_team}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        createMatchCard({
            variables: {
                content: {
                    date,
                    type,
                    player,
                    id_team,
                    id_match: data.id
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة البطاقة")
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
                            <Select
                                placeholder="الفريق"
                                label="اختار الفريق"
                                withAsterisk
                                data={allTeams}
                                {...getInputProps("id_team")}
                            />
                        </Col>
                        <Col span={6} >
                            <TextInput
                                placeholder="اللاعب "
                                label="اللاعب"
                                withAsterisk
                                {...getInputProps("player")}
                            />
                        </Col>

                        <Col span={6} >
                            <Select
                                placeholder="نوع البطاقة"
                                label="اختار نوع البطاقة"
                                withAsterisk
                                data={[
                                    {label: "صفراء", value: "yellow"},
                                    {label: "حمراء", value: "red"},
                                ]}
                                {...getInputProps("type")}
                            />
                        </Col>

                        <Col span={6} >
                            <TimeInput
                                placeholder="التوقيت"
                                label="التوقيت"
                                withAsterisk
                                {...getInputProps("date")}
                            />
                        </Col>

                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
