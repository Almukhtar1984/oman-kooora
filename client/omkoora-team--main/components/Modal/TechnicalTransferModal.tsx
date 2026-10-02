import {Box, Button, Col, Grid, Group, Select, Switch} from "@mantine/core";
import {Check, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { AllTechnicals, useCreateTransfer, useAllTeams } from "./../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import {useAllClub} from "../../graphql/hooks/teams/useAllClub";

type Props = {
    id?: string;
    data?: any;
} & ModalProps;

// انتقال (دائم) لعضو الجهاز الفني — نفس تدفّق انتقال اللاعب لكن id_technical_apparatus.
export const TechnicalTransferModal = ({id, data, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [allClubs, setAllClubs] = useState<{label: string, value: string}[]>([]);
    const [type, setType] = useState(false);
    const [clubSelected, setClubSelected] = useState<string | null>("");
    const form = useForm({ initialValues: {id_team_to: ""} });

    const [createTransfer] = useCreateTransfer();
    const [getAllTeams, { data: dataAllTeams }] = useAllTeams();
    const [getAllClubs, { data: dataAllClubs }] = useAllClub();

    useEffect(() => {
        if (userData && userData?.person?.member?.team?.club?.id) {
            getAllTeams({ variables: {idClub: userData?.person?.member?.team?.club?.id}, fetchPolicy: "cache-and-network" })
        }
    }, [id, opened])

    const buildTeams = (teams: any[]) => {
        const idTeam = userData?.person?.member?.team?.id
        return (teams || []).map((item: any) => ({ label: item?.name, value: item?.id, disabled: item?.id === idTeam }))
    }

    useEffect(() => { if (!type && dataAllTeams?.allTeam?.length) setAllTeams(buildTeams(dataAllTeams.allTeam)) }, [dataAllTeams])
    useEffect(() => {
        if (type) getAllClubs({fetchPolicy: "cache-and-network"})
        else if (dataAllTeams?.allTeam?.length) setAllTeams(buildTeams(dataAllTeams.allTeam))
    }, [type])
    useEffect(() => { if (dataAllClubs?.allClub) setAllClubs(dataAllClubs.allClub.map((item: any) => ({label: item?.name, value: item?.id}))) }, [dataAllClubs])
    useEffect(() => {
        if (clubSelected) {
            const club = dataAllClubs?.allClub?.filter((item: any) => item.id == clubSelected)
            setAllTeams(buildTeams(club?.[0]?.teams || []))
        }
    }, [clubSelected])

    const technicalId = id || data?.id;

    const onSubmit = (values: any) => {
        const { id_team_to } = values
        const idTeam = userData?.person?.member?.team?.id

        if (!technicalId) { showNotification({ title: "خطأ", message: "تعذّر تحديد عضو الجهاز الفني", color: "red" }); return; }
        if (!id_team_to) { showNotification({ title: "خطأ", message: "حدد الفريق المنتقل إليه", color: "red" }); return; }
        if (type && !clubSelected) { showNotification({ title: "خطأ", message: "حدد النادي للانتقال الخارجي", color: "red" }); return; }

        createTransfer({
            variables: {
                content: {
                    status: "waiting_team",
                    type: type ? "external" : "internal",
                    id_technical_apparatus: technicalId,
                    id_team_from: idTeam,
                    id_team_to,
                    transition_type: "transition",
                }
            },
            refetchQueries: [AllTechnicals],
            onCompleted: () => {
                showNotification({ title: "تم", message: "تم إرسال طلب انتقال عضو الجهاز الفني", color: "green" });
                closeModal();
            },
            onError: (error1) => {
                showNotification({ title: "خطأ", message: error1?.message || "فشل إرسال طلب الانتقال", color: "red" });
            }
        })
    };

    const closeModal = () => { props.onClose(); form.reset(); setType(false); setClubSelected(""); };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="technical_transfer_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={() => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="technical_transfer_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <Switch
                                labelPosition={"left"}
                                label="هل الانتقال خارجي؟"
                                checked={type}
                                onChange={(event) => setType(event?.currentTarget?.checked)}
                                styles={{ root: { border: '1px solid #aaa', borderRadius: 3, padding: "7px 10px" }, body: { justifyContent: "space-between" } }}
                            />
                        </Col>
                        {type ?
                            <Col span={6}>
                                <Select placeholder="حدد النادي المنتقل إليه" withAsterisk rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }} data={allClubs}
                                    value={clubSelected} onChange={setClubSelected} searchable clearable nothingFound="لا يوجد نوادي" />
                            </Col> : null}
                        <Col span={6}>
                            <Select placeholder="حدد الفريق المنتقل إليه" withAsterisk rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }} data={allTeams}
                                {...form.getInputProps("id_team_to")} searchable clearable nothingFound="لا يوجد فرق" />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
