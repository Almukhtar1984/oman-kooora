import {ActionIcon, Badge, Box, Button, Divider, Grid, Group, NumberInput, Select, Text, Tooltip, Alert} from "@mantine/core";
import {IconCheck, IconSearch, IconTrash, IconUserPlus, IconX, IconFilter} from "@tabler/icons-react";
import React, {useEffect, useMemo, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {AllLeagues, useAddParticipatingPlayers, useAllPlayers,useCountExternalPlayers,CountExternalPlayers,AllLeaguesTeam} from "../../graphql";
import {Notyf} from "notyf";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";
import useStore from "../../store/useStore";

const {Col} = Grid

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

// One enriched, in-memory player record. card_number / date_birth are kept for
// searching + filtering but are intentionally NOT shown in the dropdown label.
type PlayerOption = {
    value: string;
    label: string;
    type: string;
    card_number: string;
    date_birth: string | null;
};

const computeAge = (dob: string | null): number | null => {
    if (!dob) return null;
    const d = dayjs(dob);
    return d.isValid() ? dayjs().diff(d, "year") : null;
};

export const AddParticipatingPlayers = ({data, ...props}: Props) => {
    const [countData, { data:dataCountData, loading, error }] = useCountExternalPlayers();
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, values, insertListItem, removeListItem, errors} = useForm({
        initialValues: {
            players: []
        },
        validate: {
          players: (players:any) => {
            const numberSet = new Set();
            for (const player of players) {
              if (!player.number) continue;
              if (numberSet.has(player.number)) {
                return "رقم القميص مكرر، يجب أن يكون فريدًا";
              }
              numberSet.add(player.number);
            }
            return null;
          },
        },
    });
    const [createParticipatingPlayers] = useAddParticipatingPlayers();
    const [allTeams, setAllTeams] = useState<{ label: string, value: string }[]>([]);
    const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([]);
    const [existingNumbers, setExistingNumbers] = useState<string[]>([]);
    const [existingPlayerIds, setExistingPlayerIds] = useState<string[]>([]);
    const [participatingTeam, setParticipatingTeam] = useState<string | null>();
    const [getAllPlayers] = useAllPlayers();
    const [LegalExternalPlayer, setLegalExternalPlayer] = useState<any>();

    // Advanced narrowing controls (all client-side, real-time — no refetch).
    const [ageFrom, setAgeFrom] = useState<number | "">("");
    const [ageTo, setAgeTo] = useState<number | "">("");
    const [birthFrom, setBirthFrom] = useState<Date | null>(null);
    const [birthTo, setBirthTo] = useState<Date | null>(null);
    // Controlled value for the quick-add picker so it clears after each pick.
    const [pickerValue, setPickerValue] = useState<string | null>(null);

    const jerseyNumbers = Array.from({ length: 99 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    }));

    useEffect(() => {
        if (data !== null && props.opened) {
            let newAllTeams: { label: string, value: string }[] = []
            const participatingTeams = data?.participatingTeams.filter(team => team.team.id === userData?.person?.member?.team?.id);
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
                const usedNumbers = teamParticipating[0]?.participatingPlayers?.map((p: any) => p.number) || [];
                const usedPlayerIds = teamParticipating[0]?.participatingPlayers?.map((p: any) => p.player?.id) || [];
                setExistingNumbers(usedNumbers);
                setExistingPlayerIds(usedPlayerIds);
                getAllPlayers({
                    variables: {
                        idTeam: teamParticipating?.[0]?.team?.id
                    },
                    onCompleted: ({allPlayers}) => {
                        let newAllPlayers: PlayerOption[] = []
                        for (let i = 0; i < allPlayers.length; i++) {
                            const item = allPlayers[i]
                            if(usedPlayerIds.includes(item.id)) continue;
                            const option: PlayerOption = {
                                value: item.id,
                                label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe ?? ""} (${item?.type==='internal'?"داخلي":"محترف"})`.replace(/\s+/g, " ").trim(),
                                type: item?.type,
                                card_number: item?.person?.card_number ?? "",
                                date_birth: item?.person?.date_birth ?? null,
                            };
                            if(parseInt(LegalExternalPlayer)>0) {
                                if(item.status==="accepted") newAllPlayers.push(option)
                            } else {
                                if(item.status==="accepted" && item.type==="internal") newAllPlayers.push(option)
                            }
                        }
                        setAllPlayers([...newAllPlayers])
                    }
                })
            }
        }
    }, [participatingTeam])

    // Fast lookup for rendering a selected row's name without re-scanning.
    const playersById = useMemo(() => {
        const map: Record<string, PlayerOption> = {};
        for (const p of allPlayers) map[p.value] = p;
        return map;
    }, [allPlayers]);

    // Players still available to add: not already picked, and passing the age /
    // birth-date narrowing. Recomputed live as the user types or picks.
    const availableToAdd = useMemo(() => {
        const picked = new Set(values.players.map((p: any) => p.id_player).filter(Boolean));
        return allPlayers.filter((p) => {
            if (picked.has(p.value)) return false;

            const age = computeAge(p.date_birth);
            if (ageFrom !== "" && (age === null || age < Number(ageFrom))) return false;
            if (ageTo !== "" && (age === null || age > Number(ageTo))) return false;

            if (birthFrom || birthTo) {
                if (!p.date_birth) return false;
                const dob = dayjs(p.date_birth);
                if (birthFrom && dob.isBefore(dayjs(birthFrom), "day")) return false;
                if (birthTo && dob.isAfter(dayjs(birthTo), "day")) return false;
            }
            return true;
        });
    }, [allPlayers, values.players, ageFrom, ageTo, birthFrom, birthTo]);

    const clearFilters = () => {
        setAgeFrom("");
        setAgeTo("");
        setBirthFrom(null);
        setBirthTo(null);
    };

    const filtersActive = ageFrom !== "" || ageTo !== "" || birthFrom !== null || birthTo !== null;

    const getAvailableNumbersForRow = (currentIndex: number) => {
      const selectedNumbers = values.players
        .map((p:any, i) => (i !== currentIndex ? p.number : null))
        .filter(Boolean);
      const blockedNumbers = [...selectedNumbers, ...existingNumbers];
      return jerseyNumbers.filter((num) => !blockedNumbers.includes(num.value));
    };

    const onFormSubmit = ({players}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!players.length) {
            notyf.error("أضف لاعبًا واحدًا على الأقل");
            return;
        }
        let externalCount = 0;
        let newPlayers:any[] = []
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const selectedPlayer = allPlayers.find(p => p.value === player.id_player);
            if ((selectedPlayer?.type as any) === "external") {
                externalCount++;
            }
            newPlayers.push({
                id_player: player.id_player,
                id_participating_team: player.id_participating_team,
                number: player?.number,
            });
        }
        if (externalCount > parseInt(LegalExternalPlayer)) {
            notyf.error(`لا يمكنك اضافت اكثر من ${LegalExternalPlayer} لاعب محترف`);
            return;
        }
        createParticipatingPlayers({
            variables: {
                content: newPlayers
            },
            refetchQueries: [AllLeagues,CountExternalPlayers,AllLeaguesTeam],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة اللاعبين")
            },
            onError: ({graphQLErrors}) => {
                console.log("graphQLErrors",graphQLErrors)
            }
        })
    };

    // Search-and-add: picking from the searchable dropdown appends a row and
    // clears the picker so the next player can be searched immediately.
    const handleQuickAdd = (playerId: string | null) => {
        if (!playerId) return;
        insertListItem('players', {
            id_player: playerId,
            id_participating_team: participatingTeam,
            number: ""
        });
        setPickerValue(null);
    };

    const removeItem = (index: number) => {
        removeListItem('players', index)
    }

    const closeModal = () => {
        props.onClose();
        reset();
        setAllTeams([])
        setAllPlayers([])
        setParticipatingTeam(null)
        setExistingNumbers([])
        setPickerValue(null)
        clearFilters()
    };

    useEffect(() => {
        countData({
            variables: { idTeam: userData?.person?.member?.team.id, idLeague: data?.id },
            onCompleted: (datacountExternalPlayers) => {
                setLegalExternalPlayer(String(data?.externalplayer - datacountExternalPlayers.countExternalPlayers));
            }
        });
    }, [data, props.opened,values.players])

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position="apart" spacing="xs">
                        <Text size="sm" color="dimmed">تم اختيار {values.players.length} لاعب</Text>
                        <Group spacing="xs">
                            <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                            <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                        </Group>
                    </Group>
                </Box>
            }
        >
            <Box style={{padding: 20, height: "70vh", overflowY: "auto"}}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Alert variant="light" color="yellow">عدد اللاعبين المحترفين المسموح به هو {LegalExternalPlayer}</Alert>
                        </Col>
                        <Col span={12}>
                            <Select
                                label="اسم الفريق"
                                placeholder="اختر الفريق"
                                withAsterisk
                                data={allTeams}
                                value={participatingTeam}
                                onChange={setParticipatingTeam}
                                style={{width: "100%"}}
                            />
                        </Col>

                        {participatingTeam && (
                            <>
                                {/* Advanced narrowing bar — age range + birth-date range. */}
                                <Col span={12}>
                                    <Box p="sm" sx={(theme) => ({ background: theme.colors.gray[0], borderRadius: theme.radius.md, border: `1px solid ${theme.colors.gray[2]}` })}>
                                        <Group position="apart" mb={8}>
                                            <Group spacing={6}>
                                                <IconFilter size={16} />
                                                <Text size="sm" fw={600}>تضييق البحث</Text>
                                            </Group>
                                            {filtersActive && (
                                                <Button variant="subtle" size="xs" color="gray" onClick={clearFilters}>مسح التضييق</Button>
                                            )}
                                        </Group>
                                        <Grid gutter={12}>
                                            <Col span={3}>
                                                <NumberInput label="العمر من" placeholder="مثال 15" min={0} max={100} value={ageFrom} onChange={setAgeFrom} />
                                            </Col>
                                            <Col span={3}>
                                                <NumberInput label="العمر إلى" placeholder="مثال 20" min={0} max={100} value={ageTo} onChange={setAgeTo} />
                                            </Col>
                                            <Col span={3}>
                                                <DateInput label="الميلاد من" placeholder="من تاريخ" value={birthFrom} onChange={setBirthFrom} valueFormat="YYYY-MM-DD" clearable />
                                            </Col>
                                            <Col span={3}>
                                                <DateInput label="الميلاد إلى" placeholder="إلى تاريخ" value={birthTo} onChange={setBirthTo} valueFormat="YYYY-MM-DD" clearable />
                                            </Col>
                                        </Grid>
                                    </Box>
                                </Col>

                                {/* Professional search-and-add: matches name OR national id
                                    without ever showing the id in the list. */}
                                <Col span={12}>
                                    <Group position="apart" align="flex-end" noWrap>
                                        <Select
                                            label="ابحث وأضف لاعبًا"
                                            placeholder="اكتب الاسم أو الرقم الوطني..."
                                            icon={<IconSearch size={16} />}
                                            searchable
                                            clearable
                                            nothingFound="لا يوجد لاعب مطابق"
                                            maxDropdownHeight={280}
                                            data={availableToAdd}
                                            value={pickerValue}
                                            onChange={handleQuickAdd}
                                            filter={(query, item: any) => {
                                                const q = query.trim().toLowerCase();
                                                if (!q) return true;
                                                const nameMatch = (item.label ?? "").toLowerCase().includes(q);
                                                const idMatch = (item.card_number ?? "").toLowerCase().includes(q);
                                                return nameMatch || idMatch;
                                            }}
                                            style={{ width: "100%" }}
                                        />
                                        <Badge size="lg" variant="light" color="teal" leftSection={<IconUserPlus size={13} />}>
                                            متاح {availableToAdd.length}
                                        </Badge>
                                    </Group>
                                </Col>

                                <Col span={12}><Divider label="اللاعبون المختارون" labelPosition="center" /></Col>
                            </>
                        )}

                        {values.players.length === 0 && participatingTeam && (
                            <Col span={12}>
                                <Text align="center" color="dimmed" size="sm" py="md">
                                    ابحث في الأعلى وأضف اللاعبين، ثم عيّن رقم القميص لكل لاعب.
                                </Text>
                            </Col>
                        )}

                        {values.players.map((item: any, index) => {
                            const player = playersById[item.id_player];
                            return (
                                <Col span={12} key={index}>
                                    <Group noWrap align="flex-end">
                                        <Grid gutter={20} style={{width: "100%"}}>
                                            <Col span={7}>
                                                <TextRowLabel index={index} name={player?.label} />
                                            </Col>
                                            <Col span={5}>
                                                <Select
                                                    label="رقم القميص"
                                                    placeholder="اختر رقم"
                                                    withAsterisk
                                                    searchable
                                                    data={getAvailableNumbersForRow(index)}
                                                    {...getInputProps(`players.${index}.number`)}
                                                />
                                            </Col>
                                        </Grid>
                                        <Tooltip label="حذف لاعب">
                                            <ActionIcon size={36} variant="filled" color="red" onClick={() => removeItem(index)}>
                                                <IconTrash size="1.125rem" />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Col>
                            );
                        })}
                        {errors.players && (
                            <Col span={12}>
                                <Box color="red" mt={-10} mb={10}>
                                    {errors.players}
                                </Box>
                            </Col>
                        )}
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};

// A read-only, labelled display of a chosen player's name (kept tiny so the row
// mirrors the look of the jersey Select next to it).
const TextRowLabel = ({index, name}: {index: number; name?: string}) => (
    <Box>
        <Text size="sm" fw={500} mb={4}>{`اللاعب ${index + 1}`}</Text>
        <Box sx={(theme) => ({
            border: `1px solid ${theme.colors.gray[3]}`,
            borderRadius: theme.radius.sm,
            padding: "7px 12px",
            background: theme.white,
            minHeight: 36,
            display: "flex",
            alignItems: "center",
        })}>
            <Text size="sm" lineClamp={1}>{name ?? "—"}</Text>
        </Box>
    </Box>
);
