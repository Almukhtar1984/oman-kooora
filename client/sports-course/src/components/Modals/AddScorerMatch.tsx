import {ActionIcon, Box, Button, Grid, Group, NumberInput, Select, TextInput, Tooltip} from "@mantine/core";
import {IconCheck, IconPlus, IconTrash, IconX} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddParticipatingPlayers, useAddScorerMatch, useAllParticipatingPlayers, useAllPlayers} from "../../graphql";
import {Notyf} from "notyf";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddScorerMatch = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem} = useForm({
        initialValues: {
            id_participating_player: "",
            time: ""
        }
    });
    const [createScorerMatch] = useAddScorerMatch();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allPlayers, setAllPlayers] = useState<{ label: string, value: string }[]>([]);

    const [participatingTeam, setParticipatingTeam] = useState<string | null>("");

    const [getAllParticipatingPlayers] = useAllParticipatingPlayers();

    useEffect(() => {
        if (data !== null && props.opened) {
            setAllTeams([
                {value: data?.firstTeam?.id, label: `${data?.firstTeam?.team?.name}`},
                {value: data?.secondTeam?.id, label: `${data?.secondTeam?.team?.name}`},
            ])
        }
    }, [data, props.opened])


    useEffect(() => {
        if (props.opened) {
            getAllParticipatingPlayers({
                variables: {
                    idParticipatingTeams: participatingTeam
                },
                onCompleted: ({allParticipatingPlayers}) => {
                    let newAllPlayers: { label: string, value: string }[] = []

                    for (let i = 0; i < allParticipatingPlayers.length; i++) {
                        const item = allParticipatingPlayers[i]

                        newAllPlayers.push({
                            value: item.id,
                            label: `${item?.player?.person?.first_name} ${item?.player?.person?.second_name} ${item?.player?.person?.third_name} ${item?.player?.person?.tribe}`
                        })
                    }
                    setAllPlayers([...newAllPlayers])
                }
            })
        }
    }, [participatingTeam])

    const onFormSubmit = ({id_participating_player, time}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        if (participatingTeam !== null && participatingTeam !== "" && data?.id !== null) {
            createScorerMatch({
                variables: {
                    content: {
                        id_match: data?.id,
                        id_participating_player,
                        id_participating_team: participatingTeam,
                        time
                    }
                },
                refetchQueries: [AllLeagues],
                onCompleted: () => {
                    closeModal();
                    notyf.success("تم اضافة الهداف")
                },
                onError: () => void 0
            })
        }
    };

    const closeModal = () => {
        props.onClose();
        reset();
        setAllTeams([])
        setAllPlayers([])
        setParticipatingTeam(null)
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
                            <Select
                                label={`اسم الفريق`}
                                placeholder="اختر الفريق"
                                withAsterisk
                                data={allTeams}
                                value={participatingTeam}
                                onChange={setParticipatingTeam}

                                style={{width: "100%"}}
                            />
                        </Col>
                        <Col span={6} >
                            <Select
                                label="اللاعب"
                                placeholder="اختر اللاعب"
                                withAsterisk
                                data={allPlayers}
                                {...getInputProps(`id_participating_player`)}
                                style={{width: "100%"}}
                            />
                        </Col>
                        <Col span={6} >
                            <TextInput
                                placeholder="الوقت"
                                label="الوقت"
                                withAsterisk
                                {...getInputProps(`time`)}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
