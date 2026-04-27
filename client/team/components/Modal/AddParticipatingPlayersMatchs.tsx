import { ActionIcon, Box, Button, Grid, Group, Select, Tooltip } from "@mantine/core";
import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddParticipatingPlayersMatch, useAllPlayers,useAllParticipatingPlayers} from "../../graphql";
import {Notyf} from "notyf";
import useStore from "../../store/useStore";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    setOpenShowMatchsModal?: (status: boolean) => void;
    dataMatch?:any;
    data?: any;
} & ModalProps;

export const AddParticipatingPlayersMatch = ({data,dataMatch,setOpenShowMatchsModal, ...props}: Props) => {
    
    const userData = useStore((state: any) => state.userData);

    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem} = useForm({
        initialValues: {
            players: []
        }
    });
    const [createParticipatingPlayersMatch] = useAddParticipatingPlayersMatch();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allPlayers, setAllPlayers] = useState<{ label: string, value: string }[]>([]);

    const [participatingTeam, setParticipatingTeam] = useState<string | null>("");

    const [getAllPlayers] = useAllPlayers();
    const [getAllPlayersMatch] = useAllParticipatingPlayers();

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []

            const participatingTeams = data?.participatingTeams

            for (let i = 0; i < participatingTeams.length; i++) {
                const item = participatingTeams[i]
                
                if(item?.team?.id === userData?.person?.member?.team?.id ){
                  
                newAllTeams.push({value: item.id, label: `${item?.team?.name} - ${item?.group}`})}
            }
            setAllTeams([...newAllTeams])
            
        }
    }, [data, props.opened])


    useEffect(() => {
        if (props.opened) {
         
            getAllPlayersMatch({
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

    const onFormSubmit = ({players}: any) => {
       
        
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        let newPlayers: any[] = [];
        for (let i = 0; i < players.length; i++) {
            const player = players[i]
        
            newPlayers.push({
                starter: player.type === "true",
                id_match: dataMatch.id,
                id_participating_player: player.id_player,
                
            })
        }
    
        
        createParticipatingPlayersMatch({
            variables: {
                contentParticipatingPlayerMatch: newPlayers
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                if (setOpenShowMatchsModal) {
                    setOpenShowMatchsModal(false);
                  }
                notyf.success("تم اضافة القائمة ")
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
    };

    const selectedPlayerIds = values.players.map((p: any) => p.id_player);
    const availablePlayers = allPlayers.filter(p => !selectedPlayerIds.includes(p.value));

    return (
        <Modal
        size={"60%"}
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"left"} >
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{padding: 20}}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={40}>
                        <Col span={12} >
                            <Group noWrap align={"flex-end"}>
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
                                    <ActionIcon size={26} variant={"filled"} color={"teal"} onClick={addItem}>
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>

                        {values.players.map((item, index) => (
                            <Col span={12} key={index}>
                                <Group noWrap  align={"flex-end"}>
                                    <Grid gutter={20} style={{width: "100%"}} >
                                        <Col span={6} >
                                        <Select
                                                    label={`اسم اللاعب ${index + 1}`}
                                                    placeholder="اختر اللاعب"
                                                    withAsterisk
                                                    data={[
                                                        ...availablePlayers,
                                                        // @ts-ignore
                                                        ...allPlayers.filter((p:any) => p.value === values.players[index].id_player), // add back currently selected one if missing
                                                    ]}
                                                    {...getInputProps(`players.${index}.id_player`)}
                                                    style={{ width: "100%" }}
                                                    />

                                        </Col>
                                       
                                        <Col span={6} >
                                            <Select
                                                placeholder="الحالة"
                                                label="اختار الحالة"
                                                withAsterisk
                                                data={[
                                                    {label: "اساسي", value: "true"},
                                                    {label: "احتياط", value: "false"},
                                                ]}
                                                {...getInputProps(`players.${index}.type`)}
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