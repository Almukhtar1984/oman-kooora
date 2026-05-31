import { ActionIcon,Alert,Box,Button,Grid,Group,Select,Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle,IconCheck,IconPlus,IconTrash,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect,useState } from "react";
import { AllLeagues,useAddParticipatingTechnicalStaff,useAllTechnicals } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddParticipatingTechnicalStaff = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem, setFieldValue} = useForm({
        initialValues: {
            technicals: [] as { id_technical_apparatus: string; id_participating_team: string | null }[]
        },
        validate: {
            technicals: {
                id_technical_apparatus: (value: string) =>
                    value && value.trim() !== "" ? null : "مطلوب"
            }
        }
    });
    const [createParticipatingTechnicalStaff] = useAddParticipatingTechnicalStaff();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allTechnicals, setAllTechnicals] = useState<{ label: string, value: string }[]>([]);

    const [participatingTeam, setParticipatingTeam] = useState<string | null>(null);

    const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

    const [getAllTechnicals, { loading: techsLoading }] = useAllTechnicals();

    const noStaffForTeam = !!participatingTeam && !techsLoading && allTechnicals.length === 0;

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []

            const participatingTeams = data?.participatingTeams || []

            for (let i = 0; i < participatingTeams.length; i++) {
                const item = participatingTeams[i]

                newAllTeams.push({value: item.id, label: `${item?.team?.name} - ${item?.group}`})
            }
            setAllTeams([...newAllTeams])
        }
    }, [data, props.opened])


    useEffect(() => {
        if (props.opened && participatingTeam) {
            const teamParticipating = (data?.participatingTeams || []).filter((item: any) => item.id === participatingTeam)

            if (teamParticipating.length > 0) {
                getAllTechnicals({
                    variables: {
                        idTeam: teamParticipating?.[0]?.team?.id
                    },
                    onCompleted: ({allTechnicalApparatus}) => {
                        let newAllTechnicals: { label: string, value: string }[] = []

                        for (let i = 0; i < allTechnicalApparatus.length; i++) {
                            const item = allTechnicalApparatus[i]

                            newAllTechnicals.push({
                                value: item.id,
                                label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`
                            })
                        }
                        setAllTechnicals([...newAllTechnicals])
                    },
                    onError: (err) => {
                        console.error("allTechnicalApparatus query failed", err);
                        notyf.error("تعذّر جلب الجهاز الفني للفريق");
                        setAllTechnicals([]);
                    }
                })
            }
        }
    }, [data?.participatingTeams, getAllTechnicals, participatingTeam, props.opened])

    const onFormSubmit = ({technicals}: any) => {
        if (!participatingTeam) {
            notyf.error("اختر الفريق أولاً");
            return;
        }

        // Re-stamp every row with the current team (defensive against stale values)
        // and drop rows missing either FK.
        const stamped = (technicals || [])
            .map((t: any) => ({
                id_technical_apparatus: t?.id_technical_apparatus,
                id_participating_team: participatingTeam,
            }))
            .filter((t: any) => t.id_participating_team && t.id_technical_apparatus);

        if (stamped.length === 0) {
            notyf.error("أضف عضواً واحداً على الأقل");
            return;
        }

        // Dedupe by id_technical_apparatus within this submit.
        const seen = new Set<string>();
        const newTechnicals: { id_technical_apparatus: string; id_participating_team: string }[] = [];
        for (const row of stamped) {
            if (seen.has(row.id_technical_apparatus)) continue;
            seen.add(row.id_technical_apparatus);
            newTechnicals.push(row);
        }

        if (newTechnicals.length !== stamped.length) {
            notyf.error("لا يمكن إضافة نفس العضو مرتين");
            return;
        }

        createParticipatingTechnicalStaff({
            variables: {
                content: newTechnicals
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم إضافة الجهاز الفني")
            },
            onError: (err) => {
                console.error("createParticipatingTechnicalStaff failed", err);
                notyf.error(err?.message || "تعذّر حفظ الجهاز الفني");
            }
        })
    };

    const addItem = () => {
        if (!participatingTeam) {
            notyf.error("اختر الفريق أولاً");
            return;
        }
        if (noStaffForTeam) {
            notyf.error("لا يوجد جهاز فني مسجل لهذا الفريق — سجّله من إدارة النادي أولاً");
            return;
        }
        insertListItem('technicals', {
            id_technical_apparatus: "",
            id_participating_team: participatingTeam
        })
    }

    const onTeamChange = (value: string | null) => {
        setParticipatingTeam(value);
        setFieldValue('technicals', []);
        setAllTechnicals([]);
    }

    const removeItem = (index: number) => {
        removeListItem('technicals', index)
    }

    const closeModal = () => {
        props.onClose();
        reset();
        setAllTeams([])
        setAllTechnicals([])
        setParticipatingTeam(null)
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button
                            rightSection={<IconCheck size={15} />}
                            type="submit"
                            form="submit_form"
                            disabled={!participatingTeam || values.technicals.length === 0}
                        >تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box style={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <Group wrap={"nowrap"} align={"flex-end"}>
                                <Select
                                    label={`اسم الفريق`}
                                    placeholder="اختر الفريق"
                                    withAsterisk
                                    data={allTeams}
                                    value={participatingTeam}
                                    onChange={onTeamChange}

                                    style={{width: "100%"}}
                                />

                                <Tooltip label={
                                    !participatingTeam ? "اختر الفريق أولاً" :
                                    techsLoading ? "جاري تحميل الجهاز الفني..." :
                                    noStaffForTeam ? "لا يوجد جهاز فني مسجل لهذا الفريق" :
                                    "اضافة عضو الجهاز الفني"
                                } >
                                    <ActionIcon
                                        size={36}
                                        variant={"filled"}
                                        color={"teal"}
                                        onClick={addItem}
                                        disabled={!participatingTeam || techsLoading || noStaffForTeam}
                                        aria-label="اضافة عضو الجهاز الفني"
                                    >
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>

                        {noStaffForTeam && (
                            <Col span={12}>
                                <Alert color="orange" icon={<IconAlertCircle size={16} />}>
                                    لا يوجد جهاز فني مسجل لهذا الفريق. سجّله من إدارة النادي قبل ربطه بالبطولة.
                                </Alert>
                            </Col>
                        )}

                        {values.technicals.map((item, index) => (
                            <Col span={12} key={index}>
                                <Group wrap={"nowrap"} justify={"space-between"} align={"flex-end"}>
                                    <Grid gutter={20} style={{width: "100%"}} >
                                        <Col span={12} >
                                            <Select
                                                label={`اسم عضو الجهاز الفني ${index+1}`}
                                                placeholder="اختر عضو الجهاز الفني"
                                                withAsterisk
                                                data={allTechnicals}
                                                searchable
                                                nothingFoundMessage="لا يوجد جهاز فني مطابق"
                                                {...getInputProps(`technicals.${index}.id_technical_apparatus`)}
                                                style={{width: "100%"}}
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
