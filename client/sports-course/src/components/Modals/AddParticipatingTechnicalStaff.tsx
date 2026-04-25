import { ActionIcon,Box,Button,Grid,Group,Select,Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck,IconPlus,IconTrash,IconX } from "@tabler/icons-react";
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
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem} = useForm({
        initialValues: {
            technicals: []
        }
    });
    const [createParticipatingTechnicalStaff] = useAddParticipatingTechnicalStaff();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allTechnicals, setAllTechnicals] = useState<{ label: string, value: string }[]>([]);

    const [participatingTeam, setParticipatingTeam] = useState<string | null>("");

    const [getAllTechnicals] = useAllTechnicals();

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []

            const participatingTeams = data?.participatingTeams

            for (let i = 0; i < participatingTeams.length; i++) {
                const item = participatingTeams[i]

                newAllTeams.push({value: item.id, label: `${item?.team?.name} - ${item?.group}`})
            }
            setAllTeams([...newAllTeams])
        }
    }, [data, props.opened])


    useEffect(() => {
        if (props.opened) {
            const teamParticipating = data?.participatingTeams?.filter((item: any) => item.id === participatingTeam)

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
                    }
                })
            }
        }
    }, [data?.participatingTeams, getAllTechnicals, participatingTeam, props.opened])

    const onFormSubmit = ({technicals}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        let newTechnicals = []
        for (let i = 0; i < technicals.length; i++) {
            const technical = technicals[i]
            newTechnicals.push({
                id_technical_apparatus: technical.id_technical_apparatus,
                id_participating_team: technical.id_participating_team
            })
        }

        createParticipatingTechnicalStaff({
            variables: {
                content: newTechnicals
            },
            refetchQueries: [AllLeagues],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الفرق")
            },
            onError: () => void 0
        })
    };

    const addItem = () => {
        insertListItem('technicals', {
            id_technical_apparatus: "",
            id_participating_team: participatingTeam
        })
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
                        <Button rightSection={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
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
                                    onChange={setParticipatingTeam}

                                    style={{width: "100%"}}
                                />

                                <Tooltip label={"اضافة عضو الجهاز الفني"} >
                                    <ActionIcon size={36} variant={"filled"} color={"teal"} onClick={addItem}>
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>

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
