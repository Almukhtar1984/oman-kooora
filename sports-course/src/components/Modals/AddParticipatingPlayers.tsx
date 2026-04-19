import {ActionIcon, Box, Button, Grid, Group, NumberInput, Select, TextInput, Tooltip} from "@mantine/core";
import {IconCheck, IconPlus, IconTrash, IconX} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddParticipatingPlayers, useAllPlayers} from "../../graphql";
import {Notyf} from "notyf";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddParticipatingPlayers = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem} = useForm({
        initialValues: {
            players: []
        }
    });
    const [createParticipatingPlayers] = useAddParticipatingPlayers();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allPlayers, setAllPlayers] = useState<{ label: string, value: string }[]>([]);

    const [participatingTeam, setParticipatingTeam] = useState<string | null>("");

    const [getAllPlayers] = useAllPlayers();

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []

            const participatingTeams = data?.participatingTeams

            for (let i = 0; i < participatingTeams.length; i++) {
                const item = participatingTeams[i]

                newAllTeams.push({value: item.id, label: `${item?.team?.name} - ${item?.group}`})
            }
            setAllTeams([...newAllTeams])
        }
    }, [data, props.opened])


    useEffect(() => {
        if (props.opened) {
            const teamParticipating = data?.participatingTeams?.filter((item: any) => item.id === participatingTeam)

            if (teamParticipating.length > 0) {
                getAllPlayers({
                    variables: {
                        idTeam: teamParticipating?.[0]?.team?.id
                    },
                    onCompleted: ({allPlayers}) => {
                        let newAllPlayers: { label: string, value: string }[] = []

                        for (let i = 0; i < allPlayers.length; i++) {
                            const item = allPlayers[i]

                            newAllPlayers.push({
                                value: item.id,
                                label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`
                            })
                        }
                        setAllPlayers([...newAllPlayers])
                    }
                })
            }
        }
    }, [participatingTeam])

    const onFormSubmit = ({players}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        let newPlayers = []
        for (let i = 0; i < players.length; i++) {
            const player = players[i]
            newPlayers.push({
                id_player: player.id_player,
                id_participating_team: player.id_participating_team,
                number: player?.number
            })
        }

        createParticipatingPlayers({
            variables: {
                content: newPlayers
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الفرق")
            },
            onError: ({graphQLErrors}) => {
                console.log(false)
            }
        })
    };

    const addItem = () => {
        insertListItem('players', {
            id_player: "",
            id_participating_team: participatingTeam,
            number: ""
        })
    }

    const removeItem = (index: number) => {
        removeListItem('players', index)
    }

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
                            <Group wrap={"nowrap"} align={"flex-end"}>
                                <Select
                                    label={`اسم الفريق`}
                                    placeholder="اختر الفريق"
                                    withAsterisk
                                    data={allTeams}
                                    value={participatingTeam}
                                    onChange={setParticipatingTeam}

                                    style={{width: "100%"}}
                                />

                                <Tooltip label={"اضافة لاعب"} >
                                    <ActionIcon size={36} variant={"filled"} color={"teal"} onClick={addItem}>
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>

                        {values.players.map((item, index) => (
                            <Col span={12} key={index}>
                                <Group wrap={"nowrap"} justify={"space-between"} align={"flex-end"}>
                                    <Grid gutter={20} style={{width: "100%"}} >
                                        <Col span={6} >
                                            <Select
                                                label={`اسم اللاعب ${index+1}`}
                                                placeholder="اختر اللاعب"
                                                withAsterisk
                                                data={allPlayers}
                                                {...getInputProps(`players.${index}.id_player`)}
                                                style={{width: "100%"}}
                                            />
                                        </Col>
                                        <Col span={6} >
                                            <TextInput
                                                placeholder="رقم القميص"
                                                label="رقم القميص"
                                                withAsterisk
                                                {...getInputProps(`players.${index}.number`)}
                                            />
                                        </Col>
                                    </Grid>

                                    <Tooltip label={"حذف لاعب"} >
                                        <ActionIcon size={36} variant={"filled"} color={"red"} onClick={() => removeItem(index)}>
                                            <IconTrash size="1.125rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Col>
                        ))}
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};