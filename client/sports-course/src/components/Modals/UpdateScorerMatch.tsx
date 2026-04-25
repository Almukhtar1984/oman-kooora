import { ActionIcon,Box,Button,Grid,Group,Select,TextInput,Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck,IconPlus,IconTrash,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect,useState } from "react";
import { AllLeagues,useAllParticipatingPlayers,useAllScorerMatch,useUpdateScorerMatch } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateScorerMatch = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem, setValues} = useForm({
        initialValues: {
            scorersMatch: [] as any
        }
    });
    const [updateScorerMatch] = useUpdateScorerMatch();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allPlayersTeam01, setAllPlayersTeam01] = useState<{ label: string, value: string }[]>([]);
    const [allPlayersTeam02, setAllPlayersTeam02] = useState<{ label: string, value: string }[]>([]);

    const [getAllParticipatingPlayersTeam01] = useAllParticipatingPlayers();
    const [getAllParticipatingPlayersTeam02] = useAllParticipatingPlayers();
    const [getAllScorerMatch] = useAllScorerMatch();

    useEffect(() => {
        if (data !== null && props.opened) {
            getAllScorerMatch({
                variables: {idMatch: data.id},
                onCompleted: ({allScorerMatch}) => {
                    let newScorersMatch = []
                    for (let i = 0; i < allScorerMatch.length; i++) {
                        const scorerMatch = allScorerMatch[i];
                        newScorersMatch.push({
                            id: scorerMatch?.id,
                            id_participating_player: scorerMatch?.participating_player?.id,
                            id_participating_team: scorerMatch?.participating_team?.id,
                            time: scorerMatch.time
                        })
                    }
                    setValues({
                        scorersMatch: [...newScorersMatch]
                    })
                },
                onError: () => void 0,
            })
            
            setAllTeams([
                {value: data?.firstTeam?.id, label: `${data?.firstTeam?.team?.name}`},
                {value: data?.secondTeam?.id, label: `${data?.secondTeam?.team?.name}`},
            ])

            getAllParticipatingPlayersTeam01({
                variables: {
                    idParticipatingTeams: data?.firstTeam?.id
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
                    
                    setAllPlayersTeam01([...newAllPlayers])
                }
            })
            
            getAllParticipatingPlayersTeam02({
                variables: {
                    idParticipatingTeams: data?.secondTeam?.id
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
                    setAllPlayersTeam02([...newAllPlayers])
                }
            })
        }
    }, [
        data,
        getAllParticipatingPlayersTeam01,
        getAllParticipatingPlayersTeam02,
        getAllScorerMatch,
        props.opened,
        setValues,
    ])

    const onFormSubmit = ({scorersMatch}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateScorerMatch({
            variables: {
                content: scorersMatch
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل الهدافين")
            },
            onError: () => void 0
        })
    };

    
    const addItem = () => {
        insertListItem('scorersMatch', {
            id: null,
            id_participating_player: "",
            id_participating_team: "",
            time: ""
        })
    }

    const removeItem = (index: number) => {
        removeListItem('scorersMatch', index)
    }

    const closeModal = () => {
        props.onClose();
        reset();
        setAllTeams([])
        setAllPlayersTeam01([])
        setAllPlayersTeam02([])
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
                    {values.scorersMatch.map((item: any, index: number) => (
                        <Group key={index} wrap={"nowrap"} align={"flex-end"}>
                            <Grid gutter={20}>
                                <Col span={4} >
                                    <Select
                                        label={`اسم الفريق`}
                                        placeholder="اختر الفريق"
                                        withAsterisk
                                        data={allTeams}
                                        {...getInputProps(`scorersMatch.${index}.id_participating_team`)}

                                        style={{width: "100%"}}
                                    />
                                </Col>
                                <Col span={5} >
                                    <Select
                                        label="اللاعب"
                                        placeholder="اختر اللاعب"
                                        withAsterisk
                                        data={
                                            values.scorersMatch[index].id_participating_team === data?.firstTeam?.id
                                                ? allPlayersTeam01
                                                : allPlayersTeam02
                                        }
                                        {...getInputProps(`scorersMatch.${index}.id_participating_player`)}
                                        style={{width: "100%"}}
                                    />
                                </Col>
                                <Col span={3} >
                                    <TextInput
                                        placeholder="الوقت"
                                        label="الوقت"
                                        withAsterisk
                                        {...getInputProps(`scorersMatch.${index}.time`)}
                                    />
                                </Col>
                            </Grid>
                            {index === 0
                                ? <Tooltip label={"اضافة هداف"} >
                                    <ActionIcon size={36} variant={"filled"} color={"teal"} onClick={addItem}>
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                                : <Tooltip label={"حذف هداف"} >
                                    <ActionIcon size={36} variant={"filled"} color={"red"} onClick={() => removeItem(index)}>
                                        <IconTrash size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            }
                        </Group>
                    ))}
                    
                    
                </form>
            </Box>
        </Modal>
    );
};
