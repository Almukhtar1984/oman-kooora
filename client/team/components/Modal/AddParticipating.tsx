import {Box, Button, Grid, Group, Select} from "@mantine/core";
import {IconCheck, IconX} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddParticipatingTeams, useAllClub, useAllTeams} from "../../graphql";
import {Notyf} from "notyf";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

const ABC = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

const category = ["الدرجة الاولى", "الدرجة الثاني", "الدرجة الثالثة"]

export const AddParticipating = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem} = useForm({
        initialValues: {teams: []}
    });
    const [createParticipatingTeams] = useAddParticipatingTeams();
    const [allClubs, setAllClubs] = useState<{ label: string, value: string }[]>([]);
    const [club, setClub] = useState<(string | null) []>([]);

    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[][]>([]);

    const [getAllClubs, {data: dataAllClub}] = useAllClub();
    const [getAllTeams] = useAllTeams();

    useEffect(() => {
        if (data !== null && props.opened) {
            let allClubs = []
            let allTeams = []
            for (let i = 0; i < data.numberTeams; i++) {
                insertListItem("teams", {group: "", id_team: "", id_league: data.id})
                //allClubs.push("")
                //allTeams.push([])
            }
            setClub(allClubs)
            setAllTeams(allTeams)
        }

        // if (props.opened) {
        //     getAllTeams({
        //         onCompleted: ({allTeams}) => {
        //             let newAllTeams: { label: string, value: string }[] = []
        //             for (let i = 0; i < allTeams.length; i++) {
        //                 const team = allTeams[i]
        //
        //                 newAllTeams.push({value: team.id, label: `${team.name} - ${team?.club?.name}`})
        //             }
        //
        //             setAllTeams([...newAllTeams])
        //         }
        //     })
        // }
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

    const onFormSubmit = ({teams}: any) => {
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;

        createParticipatingTeams({
            variables: {
                content: teams
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf?.success("تم اضافة الفرق")
            },
            onError: ({graphQLErrors}) => {
                console.log(false)
            }
        })
    };

    const onChangeClub = (value: string | null, index: number) => {
        let allClubs: (string | null) [] = [...club]
        allClubs.splice(index, 1, value)
        setClub(allClubs)

        const teamsClub = dataAllClub.allClub.filter((item: any) => item.id === value)
        let newAllTeamsClub: { label: string, value: string }[] = []


        console.log(teamsClub)

        if (teamsClub.length > 0) {
            console.log(teamsClub.teams)

            for (let i = 0; i < teamsClub[0].teams.length; i++) {
                const team = teamsClub[0].teams[i]

                newAllTeamsClub.push({value: team.id, label: `${team.name} - ${category?.[team?.category - 1]}`})
            }
            console.log(newAllTeamsClub)

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
                    <Group position={"left"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{padding: 20}}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    {values.teams.map((item, index) => (
                        <Grid key={index} gutter={20}>
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
                    ))}
                </form>
            </Box>
        </Modal>
    );
};