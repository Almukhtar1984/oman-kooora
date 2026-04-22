import {Box, Button, Grid, Group, TextInput, Textarea, NumberInput, Select} from "@mantine/core";
import {IconCalendar, IconCheck, IconChevronDown, IconX} from "@tabler/icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddLeague, useAddMatch} from "../../graphql";
import useStore from "../../store/useStore";
import {Notyf} from "notyf";
import {DateInput, DateTimePicker} from "@mantine/dates";
import dayjs from "dayjs";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddMatch = ({data, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {date: "", type: "", first_team: "", second_team: ""}
    });
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);

    const [createMatch] = useAddMatch();

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []
            for (let i = 0; i < data?.participatingTeams?.length; i++) {
                const item = data?.participatingTeams?.[i]

                newAllTeams.push({value: item.id, label: `${item?.group} - ${item?.team.name}`})
            }

            setAllTeams([...newAllTeams])
        }
    }, [data, props.opened])

    const onFormSubmit = ({date, type, first_team, second_team}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        createMatch({
            variables: {
                content: {
                    date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
                    type,
                    firstTeamGoal: 0,
                    secondTeamGoal: 0,
                    first_team,
                    second_team,
                    id_league: data.id
                }
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة المباراة")
            },
            onError: ({graphQLErrors}) => {
                console.log(false)
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