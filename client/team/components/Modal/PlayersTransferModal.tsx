import {Box, Button, Col, FileInput, Grid, Group, Select, Switch,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {
    AllTechnicals,
    AllTeams,
    useAddMember,
    useAddTeam,
    useAllMembers,
    useMember,
    useUpdateMember, usePlayer, useUpdatePlayer, useCreateTransfer, useAllTeams, AllPlayers
} from "./../../graphql";
import useStore from "../../store/useStore";
import {DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import {useAllClub} from "../../graphql/hooks/teams/useAllClub";

type Props = {
    id: string;
} & ModalProps;

const init = {
    activity: "",
    player_center: "",
    weight: 0,
    height: 0,
    job: "",
}

export const PlayersTransferModal = ({id, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [allClubs, setAllClubs] = useState<{label: string, value: string}[]>([]);
    const [type, setType] = useState(false);
    const [clubSelected, setClubSelected] = useState<string | null>("");
    const form = useForm({
        initialValues: {id_team_to: ""}
    });

    const [createTransfer] = useCreateTransfer();

    const [getPlayer, { loading, error, data: dataPlayer }] = usePlayer();
    const [getAllTeams, { loading: loadingAllTeams, error: errorAllTeams, data: dataAllTeams }] = useAllTeams();
    const [getAllClubs, { loading: loadingAllClubs, error: errorAllClubs, data: dataAllClubs }] = useAllClub();

    useEffect(() => {
        if (id && id !== "") {
            getPlayer({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }

        if (userData && userData?.person?.member?.team?.club?.id) {
            const idClub = userData?.person?.member?.team?.club?.id

            getAllTeams({
                variables: {idClub},
                fetchPolicy: "cache-and-network"
            })
        }
    }, [id, opened])

    useEffect(() => {
        const idTeam = userData?.person?.member?.team?.id

        if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length) {
            const allTeams: {label: string, value: string, disabled?: boolean}[] = []

            dataAllTeams?.allTeam?.map((item: any) => {
                allTeams.push({label: item?.name, value: item?.id, disabled: item?.id === idTeam})
            })

            setAllTeams([...allTeams])
        }
    }, [dataAllTeams])

    useEffect(() => {
        if (type) {
            getAllClubs({fetchPolicy: "cache-and-network"})
        } else {
            if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length) {
                const idTeam = userData?.person?.member?.team?.id
                const allTeams: {label: string, value: string, disabled?: boolean}[] = []

                dataAllTeams?.allTeam?.map((item: any) => {
                    allTeams.push({label: item?.name, value: item?.id, disabled: item?.id === idTeam})
                })

                setAllTeams([...allTeams])
            }
        }
    }, [type])

    useEffect(() => {
        if (dataAllClubs && "allClub" in dataAllClubs) {
            const allClubs: {label: string, value: string}[] = []

            dataAllClubs?.allClub?.map((item: any) => {
                allClubs.push({label: item?.name, value: item?.id})
            })

            setAllClubs([...allClubs])
        }
    }, [dataAllClubs])

    useEffect(() => {
        if (clubSelected) {
            const idTeam = userData?.person?.member?.team?.id
            const allTeams: {label: string, value: string, disabled?: boolean}[] = []

            const club = dataAllClubs?.allClub?.filter(item => item.id == clubSelected)

            club?.[0]?.teams?.map((item: any) => {
                allTeams.push({label: item?.name, value: item?.id, disabled: item?.id === idTeam})
            })

            setAllTeams([...allTeams])
        }
    }, [clubSelected])

    const onSubmit = (data: any) => {
        const { id_team_to, type } = data
        const idTeam = userData?.person?.member?.team?.id

        createTransfer({
            variables: {
                content: {
                    status: "waiting_team",
                    type: type ? "external" : "internal",
                    id_player: id,
                    id_team_from: idTeam,
                    id_team_to,
                    transition_type: "transition"
                }
            },
            refetchQueries: [AllPlayers],
            onCompleted: data1 => {
                closeModal();
            },
            onError: error1 => {
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <Switch
                                labelPosition={"left"}
                                label="هل الأنتقال خارجي؟"
                                checked={type}
                                onChange={(event) => setType(event?.currentTarget?.checked)}
                                styles={{
                                    root: {
                                        border: '1px solid #aaa',
                                        borderRadius: 3,
                                        padding: "7px 10px"
                                    },
                                    body: {
                                        justifyContent: "space-between"
                                    }
                                }}
                            />
                        </Col>
                        {type ?
                            <Col span={6}>
                                <Select
                                    placeholder="حدد النادي المنتقل اليه"
                                    withAsterisk
                                    // rightSection={<ChevronDown size={14} />}
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}
                                    data={allClubs}
                                    value={clubSelected}
                                    onChange={setClubSelected}

                                    searchable={true}
                                    clearable={true}

                                    nothingFound="لا يوجد نوادي"
                                />
                            </Col>
                            : null
                        }
                        <Col span={6}>
                            <Select
                                placeholder="حدد الفريق المنتقل اليه"
                                withAsterisk
                                // rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={allTeams}
                                {...form.getInputProps("id_team_to")}

                                searchable={true}
                                clearable={true}

                                nothingFound="لا يوجد فرق"
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};