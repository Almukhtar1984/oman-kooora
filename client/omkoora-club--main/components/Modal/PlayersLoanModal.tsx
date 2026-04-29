import {Box, Button, Col, Grid, Group, Select, Switch,} from "@mantine/core";
import {Calendar, Check, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {usePlayer, useCreateTransfer, useAllTeams, useAllClub, AllPlayers, AllPlayersClubLoan, AllPlayersClubTransferred} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import { Notyf } from "notyf";

type Props = {
    data: any;
} & ModalProps;

const init = {
    activity: "",
    player_center: "",
    weight: 0,
    height: 0,
    job: "",
}

export const PlayersLoanModal = ({data, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [allClubs, setAllClubs] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
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
        const id = typeof data === 'object' ? data?.id : data;
        if (opened && id && id !== "" && id !== undefined) {
            getPlayer({
                variables: {id: id},
                fetchPolicy: "network-only"
            })
        }

        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTeams({
                variables: {idClub},
                fetchPolicy: "cache-and-network"
            })
        }
    }, [data, opened])

    useEffect(() => {
        const idTeam = data?.team?.id
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
            const idTeam = data?.team?.id
            if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length) {
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
            const idClub = userData?.person?.clubManagement?.club?.id;
            const allClubs: {label: string, value: string, disabled?: boolean}[] = []

            dataAllClubs?.allClub?.map((item: any) => {
                allClubs.push({label: item?.name, value: item?.id, disabled: item?.id === idClub})
            })

            setAllClubs([...allClubs])
        }
    }, [dataAllClubs])

    const onSubmit = (data: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const { id_team_to, date_end, date_start } = data
        const idTeam = dataPlayer?.player?.team?.id
        const idPlayer = dataPlayer?.player?.id
       
        createTransfer({
            variables: {
                content: {
                    status:  type ? "waiting" : "accepted",
                    type: type ? "external" : "internal",
                    id_player: idPlayer,
                    id_team_from: idTeam,
                    id_team_to: id_team_to !== "" ? id_team_to : null,
                    id_club_to: type ? clubSelected : null ,
                    transition_type: "loan",
                    date_end: dayjs(date_end).format("YYYY-MM-DD"),
                    date_start: dayjs(date_start).format("YYYY-MM-DD"),
                }
            },
            refetchQueries: [AllPlayers, AllPlayersClubLoan, AllPlayersClubTransferred],
            awaitRefetchQueries: true,
            onCompleted: data1 => {
                closeModal();
                notyf.success("تم إرسال طلب الإعارة بنجاح")
            },
            onError: error1 => {
                console.log(error1)
                notyf.error("حدث خطأ أثناء طلب الإعارة")
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
            <Box sx={({ colors }) => ({padding: 20, minHeight: 500})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} md={6}>
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
                            <Col span={12} md={6}>
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
                            : <Col span={12} md={6}>
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
                        }

                        <Col span={12} md={6}>
                            <DateInput
                                placeholder="تاريخ بداية الاعارة"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}

                                {...form.getInputProps("date_start")}

                                clearable={true}
                            />
                        </Col>

                        <Col span={12} md={6}>
                            <DateInput
                                placeholder="تاريخ نهاية الاعارة"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}

                                {...form.getInputProps("date_end")}

                                clearable={true}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};