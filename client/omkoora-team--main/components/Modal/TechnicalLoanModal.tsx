import {Box, Button, Col, Grid, Group, Select, Switch} from "@mantine/core";
import {Calendar, Check, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { AllTechnicals, useCreateTransfer, useAllTeams } from "./../../graphql";
import useStore from "../../store/useStore";
import {DateInput} from "@mantine/dates";
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import dayjs from "dayjs";
import {useAllClub} from "../../graphql/hooks/teams/useAllClub";

type Props = {
    id?: string;
    data?: any;
} & ModalProps;

// إعارة عضو الجهاز الفني — نفس تدفّق إعارة اللاعب لكن id_technical_apparatus.
export const TechnicalLoanModal = ({id, data, opened, ...props}: Props) => {
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

    useEffect(() => {
        if (!type && dataAllTeams?.allTeam?.length) setAllTeams(buildTeams(dataAllTeams.allTeam))
    }, [dataAllTeams])

    useEffect(() => {
        if (type) getAllClubs({fetchPolicy: "cache-and-network"})
        else if (dataAllTeams?.allTeam?.length) setAllTeams(buildTeams(dataAllTeams.allTeam))
    }, [type])

    useEffect(() => {
        if (dataAllClubs?.allClub) setAllClubs(dataAllClubs.allClub.map((item: any) => ({label: item?.name, value: item?.id})))
    }, [dataAllClubs])

    useEffect(() => {
        if (clubSelected) {
            const club = dataAllClubs?.allClub?.filter((item: any) => item.id == clubSelected)
            setAllTeams(buildTeams(club?.[0]?.teams || []))
        }
    }, [clubSelected])

    const technicalId = id || data?.id;

    const onSubmit = (values: any) => {
        const { id_team_to, date_end, date_start } = values
        const idTeam = userData?.person?.member?.team?.id

        if (!technicalId) { showNotification({ title: "خطأ", message: "تعذّر تحديد عضو الجهاز الفني", color: "red" }); return; }
        if (!id_team_to) { showNotification({ title: "خطأ", message: "حدد الفريق المُعار إليه", color: "red" }); return; }
        if (type && !clubSelected) { showNotification({ title: "خطأ", message: "حدد النادي للإعارة الخارجية", color: "red" }); return; }
        if (!date_start || !date_end) { showNotification({ title: "خطأ", message: "حدد تاريخ بداية ونهاية الإعارة", color: "red" }); return; }
        if (dayjs(date_end).isBefore(dayjs(date_start), "day")) { showNotification({ title: "خطأ", message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية", color: "red" }); return; }

        createTransfer({
            variables: {
                content: {
                    status: "waiting",
                    type: type ? "external" : "internal",
                    id_technical_apparatus: technicalId,
                    id_team_from: idTeam,
                    id_team_to,
                    transition_type: "loan",
                    date_end: dayjs(date_end).format("YYYY-MM-DD"),
                    date_start: dayjs(date_start).format("YYYY-MM-DD"),
                }
            },
            refetchQueries: [AllTechnicals],
            onCompleted: () => {
                showNotification({ title: "تم", message: "تم إرسال طلب إعارة عضو الجهاز الفني إلى الفريق المستقبِل", color: "green" });
                closeModal();
            },
            onError: (error1) => {
                showNotification({ title: "خطأ", message: error1?.message || "فشل إرسال طلب الإعارة", color: "red" });
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
                        <Button rightIcon={<Check size={15} />} type="submit" form="technical_loan_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={() => ({padding: 20, minHeight: 500})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="technical_loan_form">
                    <Grid gutter={20}>
                        <Col span={6}>
                            <Switch
                                labelPosition={"left"}
                                label="هل الإعارة خارجية؟"
                                checked={type}
                                onChange={(event) => setType(event?.currentTarget?.checked)}
                                styles={{ root: { border: '1px solid #aaa', borderRadius: 3, padding: "7px 10px" }, body: { justifyContent: "space-between" } }}
                            />
                        </Col>
                        {type ?
                            <Col span={6}>
                                <Select placeholder="حدد النادي المُعار إليه" withAsterisk rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }} data={allClubs}
                                    value={clubSelected} onChange={setClubSelected} searchable clearable nothingFound="لا يوجد نوادي" />
                            </Col> : null}
                        <Col span={6}>
                            <Select placeholder="حدد الفريق المُعار إليه" withAsterisk rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }} data={allTeams}
                                {...form.getInputProps("id_team_to")} searchable clearable nothingFound="لا يوجد فرق" />
                        </Col>
                        <Col span={6}>
                            <DateInput placeholder="تاريخ بداية الإعارة" withAsterisk valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />} {...form.getInputProps("date_start")} clearable />
                        </Col>
                        <Col span={6}>
                            <DateInput placeholder="تاريخ نهاية الإعارة" withAsterisk valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />} {...form.getInputProps("date_end")} clearable />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
