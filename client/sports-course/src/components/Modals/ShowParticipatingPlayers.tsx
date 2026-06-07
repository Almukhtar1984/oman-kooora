import { ActionIcon,Badge,Box,Button,Center,Checkbox,Grid,Group,Image,Menu,Paper,Skeleton,Stack,Text,useMantineTheme } from "@mantine/core";
import { IconDotsVertical,IconEdit,IconPrinter,IconUserOff } from "@tabler/icons-react";
import { useEffect,useMemo,useState } from "react";
import { useAllParticipatingPlayers } from "../../graphql";
import { apiBaseUrl, printUrl } from "../../lib/config";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    data?: any;
    // true when the league's expiryDate passed — players become read-only
    leagueEnded?: boolean;
    setSelectedData: (id: any) => void;
    setOpenEditParticipatingPlayersModal: (status: boolean) => void;
} & ModalProps;

export const ShowParticipatingPlayers = ({data, leagueEnded = false, setSelectedData, setOpenEditParticipatingPlayersModal, ...props}: Props) => {
    const theme = useMantineTheme();
    const [getAllParticipatingPlayers, { loading }] = useAllParticipatingPlayers()

    const [allParticipatingPlayers, setAllParticipatingPlayers] = useState<object[]>([]);
    const [hasFetched, setHasFetched] = useState<boolean>(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (data && props.opened) {
            setHasFetched(false);
            setSelectedIds(new Set());
            getAllParticipatingPlayers({
                variables: {
                    idParticipatingTeams: data
                },
                fetchPolicy: "network-only",
                onCompleted: ({allParticipatingPlayers}) => {
                    setAllParticipatingPlayers([...(allParticipatingPlayers || [])])
                    setHasFetched(true)
                },
                onError: () => setHasFetched(true)
            })
        }
    }, [data, getAllParticipatingPlayers, props.opened]);

    const closeModal = () => {
        props.onClose();
        setAllParticipatingPlayers([])
        setHasFetched(false)
        setSelectedIds(new Set())
    };

    const allIds = useMemo(
        () => allParticipatingPlayers.map((p: any) => p?.id).filter(Boolean) as string[],
        [allParticipatingPlayers]
    );
    const allSelected = allIds.length > 0 && selectedIds.size === allIds.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        setSelectedIds((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));
    };

    const handlePrint = () => {
        if (!data) return;
        const idsParam = allSelected || selectedIds.size === 0
            ? "all"
            : Array.from(selectedIds).join(",");
        const url = `${printUrl}/#/team-cards/${data}/${idsParam}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<></>}

            styles={{
                body: {
                    backgroundColor: theme.colors.gray[1]
                }
            }}
        >
            <Box style={({ colors }) => ({padding: 20})}>
                {loading && (
                    <Grid gutter={20}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Col key={i} span={6}>
                                <Box bg={theme.white} style={{ padding: 10 }}>
                                    <Group wrap={"nowrap"} align="center">
                                        <Skeleton height={50} width={50} circle />
                                        <Stack gap={6} style={{ flex: 1 }}>
                                            <Skeleton height={12} width="80%" />
                                            <Skeleton height={10} width="60%" />
                                            <Skeleton height={10} width="40%" />
                                        </Stack>
                                    </Group>
                                </Box>
                            </Col>
                        ))}
                    </Grid>
                )}
                {!loading && hasFetched && allParticipatingPlayers.length === 0 && (
                    <Center py={40}>
                        <Stack align="center" gap={6}>
                            <IconUserOff size={40} color={theme.colors.gray[4]} />
                            <Text fw={600} c="gray.6">لا يوجد لاعبون مسجلون لهذا الفريق</Text>
                            <Text size="sm" c="gray.5">قم بإضافة لاعبين من قائمة الدورة.</Text>
                        </Stack>
                    </Center>
                )}
                {!loading && allParticipatingPlayers.length > 0 && (
                    <>
                        <Paper withBorder radius="md" p="xs" mb={12} bg="white">
                            <Group justify="space-between" align="center" wrap="nowrap">
                                <Group gap={10} align="center">
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={someSelected}
                                        onChange={toggleAll}
                                        label={allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                                    />
                                    {selectedIds.size > 0 && (
                                        <Badge variant="light" color="cyan" radius="sm">
                                            محدّد: {selectedIds.size} / {allIds.length}
                                        </Badge>
                                    )}
                                </Group>

                                <Button
                                    size="sm"
                                    color="cyan"
                                    leftSection={<IconPrinter size={16} />}
                                    onClick={handlePrint}
                                >
                                    {selectedIds.size === 0 || allSelected
                                        ? "طباعة جميع البطاقات"
                                        : `طباعة المحدد (${selectedIds.size})`}
                                </Button>
                            </Group>
                        </Paper>

                        <Grid gutter={20}>
                            {allParticipatingPlayers?.map((item: any, index: number) => {
                                const isChecked = item?.id ? selectedIds.has(item.id) : false;
                                return (
                                    <Col key={item?.id || index} span={6}>
                                        <Box
                                            bg={theme.white}
                                            style={{
                                                padding: 10,
                                                border: isChecked
                                                    ? `2px solid ${theme.colors.cyan[5]}`
                                                    : "2px solid transparent",
                                                borderRadius: 8,
                                                transition: "border-color .15s ease",
                                            }}
                                        >
                                            <Group wrap={"nowrap"} justify={"space-between"} align="flex-start">
                                                <Group wrap={"nowrap"} justify={"flex-start"} align={"center"}>
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onChange={() => item?.id && toggleOne(item.id)}
                                                    />
                                                    <Stack justify={"center"} h={"100%"}>
                                                        <Image src={`${apiBaseUrl}/images/${item?.player?.person?.personal_picture}`} w={50} h={50} />
                                                    </Stack>

                                                    <Stack gap={5} justify={"center"} align="flex-start">
                                                        <Text size={"14px"} c={theme.colors.gray[6]}>
                                                            {`${item?.player?.person?.first_name} ${item?.player?.person?.second_name} ${item?.player?.person?.third_name} ${item?.player?.person?.tribe} (${item?.player?.person?.card_number})`}
                                                        </Text>
                                                        <Text size={"14px"} c={theme.colors.gray[6]}>
                                                            {`${item?.player?.person?.date_birth}`}
                                                        </Text>
                                                        <Group justify={"flex-start"} align="center" gap={10}>
                                                            <Text size={"12px"} c={theme.colors.gray[4]}>رقم القميص :</Text>
                                                            <Text size={"12px"} c={theme.colors.gray[5]}>{item?.number}</Text>
                                                        </Group>
                                                    </Stack>
                                                </Group>

                                                <Stack justify={"flex-start"} h={"100%"}>
                                                    <Menu shadow="md" width={210}>
                                                        <Menu.Target>
                                                            <ActionIcon variant={"transparent"} color={"gray"} size={"sm"}>
                                                                <IconDotsVertical size="0.9rem" />
                                                            </ActionIcon>
                                                        </Menu.Target>

                                                        <Menu.Dropdown>
                                                            {!leagueEnded && (
                                                                <Menu.Item
                                                                    leftSection={<IconEdit size={14} />}
                                                                    onClick={() => {
                                                                        setSelectedData(item)
                                                                        setOpenEditParticipatingPlayersModal(true)
                                                                    }}
                                                                >تعديل اللاعب</Menu.Item>
                                                            )}
                                                            <Menu.Item
                                                                leftSection={<IconPrinter size={14} />}
                                                                onClick={() => {
                                                                    if (!item?.id || !data) return;
                                                                    const url = `${printUrl}/#/team-cards/${data}/${item.id}`;
                                                                    window.open(url, "_blank", "noopener,noreferrer");
                                                                }}
                                                            >طباعة بطاقة هذا اللاعب</Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Stack>
                                            </Group>
                                        </Box>
                                    </Col>
                                );
                            })}
                        </Grid>
                    </>
                )}
            </Box>
        </Modal>
    );
};
