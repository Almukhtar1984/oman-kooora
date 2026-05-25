import { Box,Button,Grid,Group,Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck,IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect,useState } from "react";
import { AllLeagues,useAddParticipatingTeams,useAllTeams } from "../../graphql";
import Modal,{ Props as ModalProps } from "./Modal";

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
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);

    const [getAllTeams] = useAllTeams();

    useEffect(() => {
        if (data !== null && props.opened) {
            for (let i = 0; i < data.numberTeams; i++) {
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

        // Skip the placeholder rows the modal pre-fills up to numberTeams —
        // without this guard the backend bulkCreate would reject the whole
        // batch on the first row with empty id_team/group.
        const cleaned = (teams || []).filter((t: any) => t?.id_team && t?.group && t?.id_league)

        if (cleaned.length === 0) {
            notyf.error("اختر الفريق والمجموعة لصف واحد على الأقل")
            return
        }

        createParticipatingTeams({
            variables: {
                content: cleaned
            },
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: false,
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الفرق")
            },
            onError: (err) => {
                notyf.error(err?.message || "فشل إضافة الفرق")
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
                    {values.teams.map((item, index) => (
                        <Grid key={index} gutter={20}>
                            <Col span={9} >
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
                        </Grid>
                    ))}
                </form>
            </Box>
        </Modal>
    );
};
