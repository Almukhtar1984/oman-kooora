import { ActionIcon, Box, Button, Grid, Group, Select, Tooltip } from "@mantine/core";
import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import { useAddParticipatingTechnicalStaff, useAllTechnicals ,AllLeaguesTeam} from "../../graphql";
import { Notyf } from "notyf";
import useStore from "../../store/useStore";

const { Col } = Grid;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddParticipatingTechnicalStaff = ({ data, ...props }: Props) => {
    const { getInputProps, reset, onSubmit, values, insertListItem, removeListItem } = useForm({
        initialValues: {
            technicals: []
        }
    });
    const [createParticipatingTechnicalStaff] = useAddParticipatingTechnicalStaff();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allTechnicals, setAllTechnicals] = useState<{ label: string, value: string }[]>([]);
    const [fullTechnicals, setFullTechnicals] = useState<{ label: string, value: string }[]>([]);
    const userData = useStore((state: any) => state.userData);
    const [participatingTeam, setParticipatingTeam] = useState<string | null>("");

    const [getAllTechnicals] = useAllTechnicals();

    useEffect(() => {
        if (data !== null && props.opened) {
            const userTeamId = userData?.person?.member?.team?.id;
            let newAllTeams: { label: string, value: string }[] = [];

            const participatingTeams = data?.participatingTeams;

            for (let i = 0; i < participatingTeams.length; i++) {
                const item = participatingTeams[i];

                if (item?.team?.id === userTeamId) {
                    newAllTeams.push({
                        value: item.id,
                        label: `${item?.team?.name} - ${item?.group}`
                    });
                }
            }

            setAllTeams([...newAllTeams]);
        }
    }, [data, props.opened]);

    useEffect(() => {
        if (props.opened && participatingTeam) {
            const teamParticipating = data?.participatingTeams?.find((item: any) => item.id === participatingTeam);

            if (teamParticipating) {
                
                const existingTechnicalIds = teamParticipating?.participatingTechnicalStaff?.map(
                    (tech: any) => tech?.technicalApparatus?.id
                  ) || [];
               
                getAllTechnicals({
                    variables: {
                        idTeam: teamParticipating.team.id
                    },
                    onCompleted: ({ allTechnicalApparatus }) => {
                        const allOptions = allTechnicalApparatus.map((item: any) => ({
                            value: item.id,
                            label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe} (${item?.classification})`
                        }));

                        const filteredOptions = allOptions.filter(item => !existingTechnicalIds.includes(item.value));
                        setFullTechnicals(allOptions);
                        setAllTechnicals(filteredOptions);
                    }
                });
            }
        }
    }, [participatingTeam]);

    const onFormSubmit = ({ technicals }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        const newTechnicals = technicals.map((technical: any) => ({
            id_technical_apparatus: technical.id_technical_apparatus,
            id_participating_team: technical.id_participating_team
        }));

        createParticipatingTechnicalStaff({
            variables: { content: newTechnicals },
            refetchQueries: [AllLeaguesTeam],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة الفرق");
            },
            onError: ({ graphQLErrors }) => {
            }
        });
    };

    const addItem = () => {
        insertListItem('technicals', {
            id_technical_apparatus: "",
            id_participating_team: participatingTeam
        });
    };

    const removeItem = (index: number) => {
        // @ts-ignore
        const removedValue = values.technicals[index]?.id_technical_apparatus;
        removeListItem('technicals', index);

        // Re-add removed option to dropdown list
        const reAddOption = fullTechnicals.find(item => item.value === removedValue);
        if (reAddOption && !allTechnicals.some(item => item.value === removedValue)) {
            setAllTechnicals(prev => [...prev, reAddOption]);
        }
    };

    const closeModal = () => {
        props.onClose();
        reset();
        setAllTeams([]);
        setAllTechnicals([]);
        setFullTechnicals([]);
        setParticipatingTeam(null);
    };

    // Filter dropdown to exclude already selected values
    const getFilteredTechnicals = (index: number) => {
        const selectedIds = values.technicals
            .filter((_, i) => i !== index)
            .map((t :any) => t.id_technical_apparatus);
        return allTechnicals.filter(option => !selectedIds.includes(option.value));
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"left"} spacing="xs">
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{ padding: 20 }}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Group noWrap align={"flex-end"}>
                                <Select
                                    label="اسم الفريق"
                                    placeholder="اختر الفريق"
                                    withAsterisk
                                    data={allTeams}
                                    value={participatingTeam}
                                    onChange={setParticipatingTeam}
                                    style={{ width: "100%" }}
                                />

                                <Tooltip label="اضافة عضو الجهاز الفني">
                                    <ActionIcon size={36} variant="filled" color="teal" onClick={addItem}>
                                        <IconPlus size="1.125rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Col>

                        {values.technicals.map((item, index) => (
                            <Col span={12} key={index}>
                                <Group noWrap align="flex-end">
                                    <Grid gutter={20} style={{ width: "100%" }}>
                                        <Col span={12}>
                                            <Select
                                                label={`اسم عضو الجهاز الفني ${index + 1}`}
                                                placeholder="اختر عضو الجهاز الفني"
                                                withAsterisk
                                                data={getFilteredTechnicals(index)}
                                                {...getInputProps(`technicals.${index}.id_technical_apparatus`)}
                                                style={{ width: "100%" }}
                                            />
                                        </Col>
                                    </Grid>

                                    <Tooltip label="حذف عضو">
                                        <ActionIcon size={36} variant="filled" color="red" onClick={() => removeItem(index)}>
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
