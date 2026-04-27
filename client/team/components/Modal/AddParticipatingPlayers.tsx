import {ActionIcon, Box, Button, Grid, Group, NumberInput, Select, TextInput, Tooltip,Alert} from "@mantine/core";
import {IconCheck, IconPlus, IconTrash, IconX} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddParticipatingPlayers, useAllPlayers,useCountExternalPlayers,CountExternalPlayers,AllLeaguesTeam} from "../../graphql";
import {Notyf} from "notyf";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";
import useStore from "../../store/useStore";
import { Type } from "typescript";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddParticipatingPlayers = ({data, ...props}: Props) => {
    const [countData, { data:dataCountData, loading, error }] = useCountExternalPlayers();
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem, errors} = useForm({
        initialValues: {
            players: []
        },
        validate: {
          players: (players:any) => {
            const numberSet = new Set();
            for (const player of players) {
              if (!player.number) continue;
              if (numberSet.has(player.number)) {
                return "رقم القميص مكرر، يجب أن يكون فريدًا";
              }
              numberSet.add(player.number);
            }
            return null;
          },
        },
    });
    const [createParticipatingPlayers] = useAddParticipatingPlayers();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allPlayers, setAllPlayers] = useState<{ label: string, value: string,type:string }[]>([]);
    const [existingNumbers, setExistingNumbers] = useState<string[]>([]);
    const [existingPlayerIds, setExistingPlayerIds] = useState<string[]>([]);
    const [participatingTeam, setParticipatingTeam] = useState<string | null>();
    const [getAllPlayers] = useAllPlayers();
    const [LegalExternalPlayer, setLegalExternalPlayer] = useState<any>();

    const jerseyNumbers = Array.from({ length: 99 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    }));

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []
            const participatingTeams = data?.participatingTeams.filter(team => team.team.id === userData?.person?.member?.team?.id);
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
                const usedNumbers = teamParticipating[0]?.participatingPlayers?.map((p: any) => p.number) || [];
                const usedPlayerIds = teamParticipating[0]?.participatingPlayers?.map((p: any) => p.player?.id) || [];
                setExistingNumbers(usedNumbers);
                setExistingPlayerIds(usedPlayerIds);
                getAllPlayers({
                    variables: {
                        idTeam: teamParticipating?.[0]?.team?.id
                    },
                    onCompleted: ({allPlayers}) => {
                        let newAllPlayers: { label: string, value: string ,type:string}[] = []
                        for (let i = 0; i < allPlayers.length; i++) {
                            const item = allPlayers[i]
                            if(usedPlayerIds.includes(item.id)) continue;
                            if(parseInt(LegalExternalPlayer)>0) {
                                if(item.status==="accepted") {
                                    newAllPlayers.push({
                                        value: item.id,
                                        label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe} (${item?.type==='internal'?"داخلي":"محترف"})`,
                                        type:item?.type
                                    })
                                }
                            } else {
                                if(item.status==="accepted" && item.type==="internal") {
                                    newAllPlayers.push({
                                        value: item.id,
                                        label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe} (${item?.type==='internal'?"داخلي":"محترف"})`,
                                        type:item?.type
                                    })
                                }
                            }
                        }
                        setAllPlayers([...newAllPlayers])
                    }
                })
            }
        }
    }, [participatingTeam])

    const getAvailableNumbersForRow = (currentIndex: number) => {
      const selectedNumbers = values.players
        .map((p:any, i) => (i !== currentIndex ? p.number : null))
        .filter(Boolean);
      const blockedNumbers = [...selectedNumbers, ...existingNumbers];
      let test = jerseyNumbers.filter((num) => !blockedNumbers.includes(num.value));

      return jerseyNumbers.filter((num) => !blockedNumbers.includes(num.value));
    };

    const onFormSubmit = ({players}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        let externalCount = 0;
        let newPlayers:any[] = []
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const selectedPlayer = allPlayers.find(p => p.value === player.id_player);
            if ((selectedPlayer?.type as any) === "external") {
                externalCount++;
            }
            newPlayers.push({
                id_player: player.id_player,
                id_participating_team: player.id_participating_team,
                number: player?.number,
            });
        }
        if (externalCount > parseInt(LegalExternalPlayer)) {
            notyf.error(`لا يمكنك اضافت اكثر من ${LegalExternalPlayer} لاعب محترف`);
            return;
        }
        createParticipatingPlayers({
            variables: {
                content: newPlayers
            },
            refetchQueries: [AllLeagues,CountExternalPlayers,AllLeaguesTeam],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة اللاعبين")
            },
            onError: ({graphQLErrors}) => {
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
        setExistingNumbers([])
    };

    useEffect(() => {
        countData({
            variables: { idTeam: userData?.person?.member?.team.id, idLeague: data?.id },
            onCompleted: (datacountExternalPlayers) => {
                setLegalExternalPlayer(String(data?.externalplayer - datacountExternalPlayers.countExternalPlayers));
            }
        });
    }, [data, props.opened,values.players])

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="left" spacing="xs">
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{padding: 20, height: "70vh"}}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Alert variant="light" color="yellow">عدد اللاعبين المحترفين المسموح به هو {LegalExternalPlayer}</Alert>
                        </Col>
                        <Col span={12}>
                            <Group noWrap align="flex-end">
                                <Select
                                    label="اسم الفريق"
                                    placeholder="اختر الفريق"
                                    withAsterisk
                                    data={allTeams}
                                    value={participatingTeam}
                                    onChange={setParticipatingTeam}
                                    style={{width: "100%"}}
                                />
                                <Tooltip label="اضافة لاعب">
                                    <ActionIcon size={36} variant="filled" color="teal" onClick={addItem}>
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>
                        {values.players.map((item, index) => (
                            <Col span={12} key={index}>
                                <Group noWrap align="flex-end">
                                    <Grid gutter={20} style={{width: "100%"}}>
                                        <Col span={6}>
                                            <Select
                                                label={`اسم اللاعب ${index+1}`}
                                                placeholder="اختر اللاعب"
                                                withAsterisk
                                                data={allPlayers.filter(p => !values.players.some((val:any, idx) => idx !== index && val.id_player === p.value))}
                                                {...getInputProps(`players.${index}.id_player`)}
                                                style={{width: "100%"}}
                                            />
                                        </Col>
                                        <Col span={6}>
                                            <Select
                                                label="رقم القميص"
                                                placeholder="اختر رقم"
                                                withAsterisk
                                                data={getAvailableNumbersForRow(index)}
                                                {...getInputProps(`players.${index}.number`)}
                                            />
                                        </Col>
                                    </Grid>
                                    <Tooltip label="حذف لاعب">
                                        <ActionIcon size={36} variant="filled" color="red" onClick={() => removeItem(index)}>
                                            <IconTrash size="1.125rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Col>
                        ))}
                        {errors.players && (
                            <Col span={12}>
                                <Box color="red" mt={-10} mb={10}>
                                    {errors.players}
                                </Box>
                            </Col>
                        )}
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
