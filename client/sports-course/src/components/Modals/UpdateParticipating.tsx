import { ActionIcon,Box,Button,Grid,Group,Select,Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck,IconTrash,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect,useState } from "react";
import { AllLeagues,useAllTeams,useUpdateParticipatingTeams,useDeleteParticipatingTeams } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

const ABC = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

const category = ["الدرجة الاولى", "الدرجة الثاني", "الدرجة الثالثة"]

export const UpdateParticipating = ({data, ...props}: Props) => {
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem} = useForm({
        initialValues: {teams: []}
    });
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);

    const [getAllTeams] = useAllTeams();

    const [updateParticipatingTeams] = useUpdateParticipatingTeams();
    const [deleteParticipatingTeam] = useDeleteParticipatingTeams();

    // Remove a team row. An existing participating team (has an id) is deleted
    // from the tournament; an empty placeholder row is just dropped locally.
    const handleRemoveTeam = (index: number, item: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!item?.id) {
            removeListItem("teams", index);
            return;
        }
        if (typeof window !== "undefined" && !window.confirm("هل أنت متأكد من حذف هذا الفريق من الدورة؟")) return;
        deleteParticipatingTeam({
            variables: { id: item.id },
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: false,
            onCompleted: (res: any) => {
                if (res?.deleteParticipatingTeams?.status) {
                    removeListItem("teams", index);
                    notyf.success("تم حذف الفريق من الدورة");
                } else {
                    notyf.error("تعذّر حذف الفريق");
                }
            },
            onError: (err: any) => notyf.error(err?.message || "فشل حذف الفريق"),
        });
    };

    useEffect(() => {
        if (data !== null && props.opened) {
            for (let i = 0; i < data.participatingTeams.length; i++) {
                const participatingTeam = data.participatingTeams[i]
                insertListItem("teams", {
                    id: participatingTeam.id,
                    group: participatingTeam.group,
                    id_team: participatingTeam?.team?.id,
                    id_league: data.id
                })
            }

            const subParticipatingTeams = data.numberTeams - data.participatingTeams.length
            for (let i = 0; i < subParticipatingTeams; i++) {
                insertListItem("teams", {group: "", id_team: "", id_league: data.id})
            }
        }
    }, [data, insertListItem, props.opened])

    useEffect(() => {
        if (props.opened) {
            getAllTeams({
                fetchPolicy: "cache-and-network",
                onCompleted: ({allTeams}) => {
                    const newAllTeams: { label: string, value: string }[] = []
                    for (let i = 0; i < allTeams.length; i++) {
                        const team = allTeams[i]
                        const categoryLabel = category?.[team?.category - 1]
                        const clubName = team?.club?.name
                        const suffix = [clubName, categoryLabel].filter(Boolean).join(" - ")
                        const label = suffix ? `${team.name} (${suffix})` : team.name

                        newAllTeams.push({value: team.id, label})
                    }

                    setAllTeams(newAllTeams)
                }
            })
        }
    }, [getAllTeams, props.opened])

    const onFormSubmit = ({teams}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        // Keep existing rows (they always have an id) and skip the
        // placeholder rows pre-filled up to numberTeams that the user never
        // touched — sending them as empty causes the backend insert to fail.
        const cleaned = (teams || []).filter((t: any) => {
            if (t?.id) return true
            return t?.id_team && t?.group && t?.id_league
        })

        if (cleaned.length === 0) {
            notyf.error("لا توجد بيانات للحفظ")
            return
        }

        updateParticipatingTeams({
            variables: {
                content: cleaned
            },
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: false,
            onCompleted: () => {
                closeModal();
                notyf.success("تم تعديل الدورة")
            },
            onError: (err) => {
                notyf.error(err?.message || "فشل تعديل الدورة")
            }
        })
    };

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
                        {values.teams.map((item: any, index) => (
                            <Col span={12} key={index} >
                                <Grid gutter={20} align="flex-end">
                                    <Col span={8} >
                                        <Select
                                            label={`اسم الفريق ${index+1}`}
                                            placeholder="اختر الفريق"
                                            withAsterisk
                                            searchable
                                            nothingFoundMessage="لا توجد نتائج"
                                            data={allTeams}
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
                                    <Col span={1} >
                                        <Tooltip label={item?.id ? "حذف الفريق من الدورة" : "إزالة الصف"}>
                                            <ActionIcon
                                                color="red"
                                                variant="light"
                                                size={36}
                                                onClick={() => handleRemoveTeam(index, item)}
                                            >
                                                <IconTrash size={18} />
                                            </ActionIcon>
                                        </Tooltip>
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
