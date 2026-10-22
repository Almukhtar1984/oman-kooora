import {Box, Button, Col, FileInput, Grid, Group, Select, Switch,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {usePlayer, useCreateTransfer, useAllTeams, useAllClub, AllPlayers, AllPlayersClubTransferred, AllPlayersClubLoan} from "../../graphql";
import useStore from "../../store/useStore";
import {DatePicker} from "@mantine/dates";
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

export const PlayersTransferModal = ({data, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [allClubs, setAllClubs] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [type, setType] = useState(false);
    const [clubSelected, setClubSelected] = useState<string | null>("");
    const [destinationTeams, setDestinationTeams] = useState<{label: string, value: string}[]>([]);
    const form = useForm({
        initialValues: {id_team_to: ""}
    });

    const [createTransfer] = useCreateTransfer();

    const [getPlayer, { loading, error, data: dataPlayer }] = usePlayer();
    const [getAllTeams, { loading: loadingAllTeams, error: errorAllTeams, data: dataAllTeams }] = useAllTeams();
    // The teams of the club the player is moving to. An external transfer used
    // to name the club only, so the receiving club got a player with no team —
    // and team names repeat across clubs, so "فريق الجزيرة" alone means nothing.
    const [getDestinationTeams, { loading: loadingDestTeams, data: dataDestinationTeams }] = useAllTeams();
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

        if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length >= 0) {
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
            if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length >= 0) {
                const idTeam = data?.team?.id
                const allTeams: {label: string, value: string, disabled?: boolean}[] = []

                dataAllTeams?.allTeam?.map((item: any) => {
                    allTeams.push({label: item?.name, value: item?.id, disabled: item?.id === idTeam})
                })

                setAllTeams([...allTeams])
            }
        }
    }, [type])

    useEffect(() => {
        setDestinationTeams([]);
        form.setFieldValue("id_team_to", "");
        if (type && clubSelected) {
            getDestinationTeams({
                variables: {idClub: clubSelected},
                fetchPolicy: "cache-and-network",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clubSelected, type])

    useEffect(() => {
        if (dataDestinationTeams && "allTeam" in dataDestinationTeams) {
            setDestinationTeams(
                (dataDestinationTeams?.allTeam || []).map((item: any) => ({label: item?.name, value: item?.id}))
            );
        }
    }, [dataDestinationTeams])

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
        const { id_team_to } = data
        const idTeam = dataPlayer?.player?.team?.id
        const idPlayer = dataPlayer?.player?.id

        if (type && !clubSelected) {
            notyf.error("حدد النادي المنتقل إليه");
            return;
        }
        // Naming the club alone leaves the player teamless on arrival; only skip
        // this when the destination club has no teams to choose from.
        if (type && destinationTeams.length > 0 && !id_team_to) {
            notyf.error("حدد الفريق داخل النادي المنتقل إليه");
            return;
        }
        if (!type && !id_team_to) {
            notyf.error("حدد الفريق المنتقل إليه");
            return;
        }

        createTransfer({
            variables: {
                content: {
                    status: type ? "waiting" : "accepted",
                    type: type ? "external" : "internal",
                    id_player: idPlayer,
                    id_team_from: idTeam,
                    id_team_to: id_team_to !== "" ? id_team_to : null,
                    id_club_to: type ? clubSelected : null ,
                    transition_type: "transition"
                }
            },//clubSelected
            refetchQueries: [AllPlayers, AllPlayersClubTransferred, AllPlayersClubLoan],
            awaitRefetchQueries: true,
            onCompleted: data1 => {
                closeModal();
                notyf.success("تم إرسال طلب الانتقال بنجاح")
            },
            onError: error1 => {
                console.log(error1)
                notyf.error("حدث خطأ أثناء طلب الانتقال")
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
                            <>
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
                            <Col span={12} md={6}>
                                <Select
                                    placeholder={clubSelected ? "حدد الفريق داخل النادي" : "اختر النادي أولاً"}
                                    withAsterisk
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}
                                    data={destinationTeams}
                                    disabled={!clubSelected || loadingDestTeams}
                                    {...form.getInputProps("id_team_to")}

                                    searchable={true}
                                    clearable={true}

                                    nothingFound={loadingDestTeams ? "جارٍ التحميل…" : "لا توجد فرق في هذا النادي"}
                                />
                            </Col>
                            </>
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
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};