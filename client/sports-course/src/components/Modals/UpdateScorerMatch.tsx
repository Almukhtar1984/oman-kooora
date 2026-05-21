import { ActionIcon, Alert, Box, Button, Grid, Group, Select, Text, TextInput, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect, useState } from "react";
import {
    AllLeagues,
    useAllParticipatingPlayers,
    useAllScorerMatch,
    useDeleteScorerMatch,
    useUpdateScorerMatch,
} from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

const { Col } = Grid;

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const UpdateScorerMatch = ({ data, ...props }: Props) => {
    const { getInputProps, reset, onSubmit, values, insertListItem, removeListItem, setValues } = useForm({
        initialValues: {
            scorersMatch: [] as any,
        },
    });
    const [updateScorerMatch, { loading: saving }] = useUpdateScorerMatch();
    const [deleteScorerMatch] = useDeleteScorerMatch();
    const [allTeams, setAllTeams] = useState<{ label: string; value: string }[]>([]);
    const [allPlayersTeam01, setAllPlayersTeam01] = useState<{ label: string; value: string }[]>([]);
    const [allPlayersTeam02, setAllPlayersTeam02] = useState<{ label: string; value: string }[]>([]);
    const [formError, setFormError] = useState<string>("");

    const [getAllParticipatingPlayersTeam01] = useAllParticipatingPlayers();
    const [getAllParticipatingPlayersTeam02] = useAllParticipatingPlayers();
    const [getAllScorerMatch] = useAllScorerMatch();

    useEffect(() => {
        if (data !== null && props.opened) {
            setFormError("");
            getAllScorerMatch({
                variables: { idMatch: data.id },
                fetchPolicy: "network-only",
                onCompleted: ({ allScorerMatch }) => {
                    const newScorersMatch = (allScorerMatch || []).map((scorerMatch: any) => ({
                        id: scorerMatch?.id,
                        id_participating_player: scorerMatch?.participating_player?.id || "",
                        id_participating_team: scorerMatch?.participating_team?.id || "",
                        time: scorerMatch?.time || "",
                    }));
                    setValues({ scorersMatch: newScorersMatch });
                },
                onError: () => void 0,
            });

            setAllTeams([
                { value: data?.firstTeam?.id, label: `${data?.firstTeam?.team?.name}` },
                { value: data?.secondTeam?.id, label: `${data?.secondTeam?.team?.name}` },
            ]);

            getAllParticipatingPlayersTeam01({
                variables: { idParticipatingTeams: data?.firstTeam?.id },
                fetchPolicy: "network-only",
                onCompleted: ({ allParticipatingPlayers }) => {
                    setAllPlayersTeam01(
                        (allParticipatingPlayers || []).map((item: any) => ({
                            value: item.id,
                            label: `${item?.player?.person?.first_name} ${item?.player?.person?.second_name} ${item?.player?.person?.third_name} ${item?.player?.person?.tribe}`,
                        }))
                    );
                },
            });

            getAllParticipatingPlayersTeam02({
                variables: { idParticipatingTeams: data?.secondTeam?.id },
                fetchPolicy: "network-only",
                onCompleted: ({ allParticipatingPlayers }) => {
                    setAllPlayersTeam02(
                        (allParticipatingPlayers || []).map((item: any) => ({
                            value: item.id,
                            label: `${item?.player?.person?.first_name} ${item?.player?.person?.second_name} ${item?.player?.person?.third_name} ${item?.player?.person?.tribe}`,
                        }))
                    );
                },
            });
        }
    }, [
        data,
        getAllParticipatingPlayersTeam01,
        getAllParticipatingPlayersTeam02,
        getAllScorerMatch,
        props.opened,
        setValues,
    ]);

    const onFormSubmit = ({ scorersMatch }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const rows = (scorersMatch || []) as any[];

        // Validation: split into existing rows (have id, must stay valid) and
        // new rows (no id). New rows that are entirely empty are skipped — the
        // user clicked + but never filled them. Partially filled rows raise an
        // error instead of being silently dropped, which was the prior bug.
        const existing = rows.filter((r) => r?.id);
        const incompleteExisting = existing.filter(
            (r) => !r.id_participating_player || !r.id_participating_team || !String(r.time ?? "").trim()
        );
        if (incompleteExisting.length > 0) {
            setFormError("بعض الهدافين الحاليين تنقصهم بيانات. أكمل أو احذف الصف قبل الحفظ.");
            return;
        }

        const newRows = rows.filter((r) => !r?.id);
        const incompleteNew = newRows.filter((r) => {
            const filledAny = r.id_participating_player || r.id_participating_team || String(r.time ?? "").trim();
            const filledAll = r.id_participating_player && r.id_participating_team && String(r.time ?? "").trim();
            return filledAny && !filledAll; // partial entry
        });
        if (incompleteNew.length > 0) {
            setFormError("صف جديد غير مكتمل. أكمل الفريق واللاعب والوقت أو احذفه.");
            return;
        }

        const cleaned = rows
            .filter((r) =>
                r?.id // keep existing rows as-is
                    ? true
                    : r.id_participating_player && r.id_participating_team && String(r.time ?? "").trim()
            )
            .map((r) => ({
                ...(r.id ? { id: r.id } : {}),
                id_match: data?.id,
                id_participating_player: r.id_participating_player,
                id_participating_team: r.id_participating_team,
                time: String(r.time),
            }));

        if (cleaned.length === 0) {
            setFormError("لا توجد بيانات للحفظ.");
            return;
        }

        setFormError("");

        updateScorerMatch({
            variables: { content: cleaned },
            // Snappy UX: refetch the dashboard in the background instead of
            // blocking the modal close on the heavy AllLeagues query.
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: false,
            onCompleted: () => {
                notyf.success("تم تعديل الهدافين");
                closeModal();
            },
            onError: (err) => {
                notyf.error(err?.message || "فشل تعديل الهدافين");
            },
        });
    };

    const addItem = () => {
        insertListItem("scorersMatch", {
            id: null,
            id_participating_player: "",
            id_participating_team: "",
            time: "",
        });
    };

    const removeItem = async (index: number) => {
        const row = values.scorersMatch[index];
        if (row?.id) {
            // Existing scorer — delete server-side so the change persists
            // across refreshes. Refetch dashboard in background.
            try {
                await deleteScorerMatch({
                    variables: { id: row.id },
                    refetchQueries: [AllLeagues],
                    awaitRefetchQueries: false,
                });
            } catch (e: any) {
                const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
                notyf.error(e?.message || "تعذّر حذف الهداف");
                return;
            }
        }
        removeListItem("scorersMatch", index);
    };

    const closeModal = () => {
        props.onClose();
        reset();
        setAllTeams([]);
        setAllPlayersTeam01([]);
        setAllPlayersTeam02([]);
        setFormError("");
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={closeModal}>
                            إلغاء
                        </Button>
                        <Button rightSection={<IconCheck size={15} />} type="submit" form="submit_form" loading={saving}>
                            حفظ
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{ padding: 20 }}>
                <Group justify="space-between" align="center" mb={12}>
                    <Text fw={600} c="gray.7">الهدّافون</Text>
                    <Button
                        size="xs"
                        variant="light"
                        color="teal"
                        leftSection={<IconPlus size={14} />}
                        onClick={addItem}
                    >
                        إضافة هداف
                    </Button>
                </Group>

                {formError && (
                    <Alert
                        color="red"
                        variant="light"
                        icon={<IconAlertCircle size={16} />}
                        mb={12}
                        title="بيانات غير مكتملة"
                    >
                        {formError}
                    </Alert>
                )}

                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    {values.scorersMatch.length === 0 && (
                        <Text size="sm" c="gray.5" ta="center" py={20}>
                            لا يوجد هدافون. اضغط "إضافة هداف" لإدخال صف جديد.
                        </Text>
                    )}
                    {values.scorersMatch.map((item: any, index: number) => (
                        <Group key={item?.id || `new-${index}`} wrap={"nowrap"} align={"flex-end"} mb={10}>
                            <Grid gutter={20}>
                                <Col span={4}>
                                    <Select
                                        label="اسم الفريق"
                                        placeholder="اختر الفريق"
                                        withAsterisk
                                        data={allTeams}
                                        {...getInputProps(`scorersMatch.${index}.id_participating_team`)}
                                        style={{ width: "100%" }}
                                    />
                                </Col>
                                <Col span={5}>
                                    <Select
                                        label="اللاعب"
                                        placeholder="اختر اللاعب"
                                        withAsterisk
                                        data={
                                            values.scorersMatch[index].id_participating_team === data?.firstTeam?.id
                                                ? allPlayersTeam01
                                                : allPlayersTeam02
                                        }
                                        {...getInputProps(`scorersMatch.${index}.id_participating_player`)}
                                        style={{ width: "100%" }}
                                    />
                                </Col>
                                <Col span={3}>
                                    <TextInput
                                        placeholder="الوقت"
                                        label="الوقت"
                                        withAsterisk
                                        {...getInputProps(`scorersMatch.${index}.time`)}
                                    />
                                </Col>
                            </Grid>
                            <Tooltip label="حذف هذا الهداف">
                                <ActionIcon size={36} variant="light" color="red" onClick={() => removeItem(index)}>
                                    <IconTrash size="1.125rem" />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    ))}
                </form>
            </Box>
        </Modal>
    );
};
