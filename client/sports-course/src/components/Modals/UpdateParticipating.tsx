import {Box, Button, Grid, Group, Select} from "@mantine/core";
import {IconCheck, IconX} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAllClub, useAllTeams, useUpdateLeague, useUpdateParticipatingTeams} from "../../graphql";
import {Notyf} from "notyf";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

const ABC = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

const category = ["الدرجة الاولى", "الدرجة الثاني", "الدرجة الثالثة"]

export const UpdateParticipating = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem} = useForm({
        initialValues: {teams: []}
    });
    const [allClubs, setAllClubs] = useState<{ label: string, value: string }[]>([]);
    const [club, setClub] = useState<(string | null) []>([]);
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[][]>([]);

    const [getAllTeams] = useAllTeams();
    const [getAllClubs, {data: dataAllClub}] = useAllClub();

    const [updateParticipatingTeams] = useUpdateParticipatingTeams();


    useEffect(() => {
        if (data !== null && props.opened) {
            let allClubs = []
            for (let i = 0; i < data.participatingTeams.length; i++) {
                const participatingTeam = data.participatingTeams[i]
                insertListItem("teams", {
                    id: participatingTeam.id,
                    group: participatingTeam.group,
                    id_team: participatingTeam?.team?.id,
                    id_league: data.id
                })
                allClubs.push(participatingTeam?.team?.club?.id)
            }
            setClub(allClubs)

            const subParticipatingTeams = data.numberTeams - data.participatingTeams.length
            for (let i = 0; i < subParticipatingTeams; i++) {
                insertListItem("teams", {group: "", id_team: "", id_league: data.id})
            }
        }
    }, [data, props.opened])

    useEffect(() => {
        if (props.opened) {
            getAllClubs({
                fetchPolicy: "cache-and-network",
                onCompleted: ({allClub}) => {
                    let newAllClubs: { label: string, value: string }[] = []
                    for (let i = 0; i < allClub.length; i++) {
                        const club = allClub[i]

                        newAllClubs.push({value: club.id, label: `${club.name}`})
                    }

                    setAllClubs([...newAllClubs])
                }
            })
        }
    }, [props.opened])

    useEffect(() => {
        if (props.opened && dataAllClub?.allClub?.length >= 0) {
            let newAllClubs: { label: string, value: string }[] = []

            for (let i = 0; i < club.length; i++) {
                const idClub = club[i]

                const teamsClub = dataAllClub.allClub.filter((item: any) => item.id === idClub)
                let newAllTeamsClub: { label: string, value: string }[] = []

                if (teamsClub.length > 0) {
                    for (let j = 0; j < teamsClub[0].teams.length; j++) {
                        const team = teamsClub[0].teams[j]
                        newAllTeamsClub.push({value: team.id, label: `${team.name} - ${category?.[team?.category - 1]}`})
                    }

                    setAllTeams((prevState) => [...prevState, newAllTeamsClub])
                }
            }

            setAllClubs([...newAllClubs])
        }
    }, [props.opened, dataAllClub])

    const onFormSubmit = ({teams}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateParticipatingTeams({
            variables: {
                content: teams
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل الدورة")
            },
            onError: () => void 0
        })
    };

    const onChangeClub = (value: string | null, index: number) => {
        let allClubs: (string | null) [] = [...club]
        allClubs.splice(index, 1, value)
        setClub(allClubs)

        const teamsClub = dataAllClub.allClub.filter((item: any) => item.id === value)
        let newAllTeamsClub: { label: string, value: string }[] = []

        if (teamsClub.length > 0) {
            for (let i = 0; i < teamsClub[0].teams.length; i++) {
                const team = teamsClub[0].teams[i]

                newAllTeamsClub.push({value: team.id, label: `${team.name} - ${category?.[team?.category - 1]}`})
            }

            let newAllTeams = [...allTeams]
            newAllTeams.splice(index, 1, newAllTeamsClub)
            setAllTeams(newAllTeams)
        }
    }

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
                        {values.teams.map((item, index) => (
                            <Col span={12} key={index} >
                                <Grid gutter={20}>
                                    <Col span={4} >
                                        <Select
                                            label={`اسم النادي`}
                                            placeholder="اختر النادي"
                                            withAsterisk
                                            data={allClubs}
                                            value={club[index]}
                                            onChange={(value) => onChangeClub(value, index)}
                                        />
                                    </Col>
                                    <Col span={5} >
                                        <Select
                                            label={`اسم الفريق ${index+1}`}
                                            placeholder="اختر الفريق"
                                            withAsterisk
                                            data={allTeams[index]}
                                            {...getInputProps(`teams.${index}.id_team`)}
                                        />
                                    </Col>
                                    <Col span={3} >
                                        <Select
                                            label="المجموعة"
                                            placeholder="اختر المجموعة"
                                            data={ABC.slice(0, data?.numberGroups)}
                                            withAsterisk

                                            {...getInputProps(`teams.${index}.group`)}
                                        />
                                    </Col>
                                </Grid>
                            </Col>
                        ))}
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
