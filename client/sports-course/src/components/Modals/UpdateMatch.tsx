import { Box,Button,Grid,Group,Select } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCheck,IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Notyf } from "notyf";
import { useEffect,useState } from "react";
import { AllLeagues,useUpdateMatch } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
    dataLeague?: any;
} & ModalProps;

export const UpdateMatch = ({data, dataLeague, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {date: new Date(), type: "", first_team: "", second_team: ""}
    });
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);

    const [updateMatch] = useUpdateMatch();

    useEffect(() => {
        if (dataLeague !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []
            for (let i = 0; i < dataLeague?.participatingTeams?.length; i++) {
                const item = dataLeague?.participatingTeams?.[i]

                newAllTeams.push({value: item.id, label: `${item?.group} - ${item?.team.name}`})
            }

            setAllTeams([...newAllTeams])
        }

        if (data !== null && props.opened) {
            setValues({
                date: new Date(data.date),
                type: data.type
            })
        }
    }, [data, dataLeague, props.opened, setValues])


    useEffect(() => {
        if (data !== null && props.opened) {
            setValues({
                first_team: data?.firstTeam?.id,
                second_team: data?.secondTeam?.id
            })
        }
    }, [allTeams, data, props.opened, setValues])

    const onFormSubmit = ({date, type, first_team, second_team}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateMatch({
            variables: {
                id: data.id,
                content: {
                    date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
                    type,
                    first_team,
                    second_team
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل المباراة")
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
                                placeholder="الفريق الاول"
                                label="اختار الفريق الاول"
                                withAsterisk
                                data={allTeams}
                                {...getInputProps("first_team")}
                            />
                        </Col>
                        <Col span={6} >
                            <Select
                                placeholder="الفريق الثاني"
                                label="اختار الفريق الثاني"
                                withAsterisk
                                data={allTeams}
                                {...getInputProps("second_team")}
                            />
                        </Col>

                        <Col span={6} >
                            <Select
                                placeholder="نوع المباراة"
                                label="اختار نوع المباراة"
                                withAsterisk
                                data={[
                                    {label: "دوري المجموعات", value: "groups"},
                                    {label: "دوري الستة عشر", value: "league-16"},
                                    {label: "دوري الثمانية", value: "league-8"},
                                    {label: "دوري ربع النهائي", value: "quarter-finals"},
                                    {label: "دوري نصف النهائي", value: "semi-finals"},
                                    {label: "النهائي", value: "final"}
                                ]}
                                {...getInputProps("type")}
                            />
                        </Col>

                        <Col span={6} >
                            <DateTimePicker
                                placeholder="وقت المباراة"
                                label="وقت المباراة"
                                locale={"ar"}
                                withAsterisk
                                minDate={new Date()}
                                clearable={true}
                                valueFormat={"YYYY-MM-DD HH:mm:ss"}
                                {...getInputProps("date")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
