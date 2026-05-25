import { ActionIcon,Badge,Box,Divider,Grid,Group,Menu,Stack,Text,useMantineTheme } from "@mantine/core";
import { IconCards,IconClock,IconDotsVertical,IconEdit,IconFriends,IconPlus,IconStar,IconTrash,IconUserShield } from "@tabler/icons-react";
import dayjs from "dayjs";
import Modal,{ Props as ModalProps } from "./Modal";

const formatPlayerName = (person: any) =>
    [person?.first_name, person?.second_name, person?.third_name, person?.tribe]
        .filter(Boolean)
        .join(" ") || "—";

const cardsForSide = (cards: any[] | undefined, type: "yellow" | "red") =>
    (cards || []).filter((c) => c?.type === type);

const STATE_LABEL: Record<string, { label: string; color: string }> = {
    "before-start": { label: "قبل البداية", color: "gray" },
    "playing":      { label: "جارية",       color: "green" },
    "end":          { label: "منتهية",      color: "red" },
};

const {Col} = Grid

type Props = {
    setSelectedData: (id: string) => void;
    data?: any;
    setOpenEditMatchModal: (status: boolean) => void;
    setOpenDeleteMatchModal: (status: boolean) => void;

    setOpenAddMatchResultModal: (status: boolean) => void;
    setOpenEditMatchResultModal: (status: boolean) => void;

    setOpenAddMatchCardModal: (status: boolean) => void;
    setOpenAddManOfMatchModal: (status: boolean) => void;
    setOpenEditManOfMatchModal: (status: boolean) => void;

    setOpenAddScorerModal: (status: boolean) => void;
    setOpenUpdateScorerModal: (status: boolean) => void;

    setOpenManageRefereesModal: (status: boolean) => void;
    setOpenUpdateMatchStateModal: (status: boolean) => void;

    setOpenManageMatchCardsModal: (status: boolean) => void;
    setOpenManageMatchLineupModal: (status: boolean) => void;
} & ModalProps;

export const ShowMatch = ({data, setSelectedData, setOpenAddMatchResultModal,  setOpenEditMatchResultModal, setOpenEditMatchModal, setOpenDeleteMatchModal, setOpenAddMatchCardModal, setOpenAddManOfMatchModal, setOpenEditManOfMatchModal, setOpenAddScorerModal, setOpenUpdateScorerModal, setOpenManageRefereesModal, setOpenUpdateMatchStateModal, setOpenManageMatchCardsModal, setOpenManageMatchLineupModal, ...props}: Props) => {
    const theme = useMantineTheme();

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<></>}
            size={"80%"}

            styles={{
                body: {
                    backgroundColor: theme.colors.gray[1]
                }
            }}
        >
            <Box style={({ colors }) => ({padding: 20})}>
                {data?.matchs?.length > 0
                    ? <Grid gutter={20}>
                        {data?.matchs?.map((item: any, index: number) => (
                            <Col key={index} span={6} >
                                <Box bg={theme.white} style={({ colors }) => ({padding: 20})}>
                                    <Group justify={"space-between"} align="flex-start" wrap="nowrap">
                                        <Stack gap={5} w={"100%"}>
                                            <Group justify={"space-between"} align="center" wrap="nowrap">
                                                <Badge
                                                    size="sm"
                                                    radius="sm"
                                                    variant="light"
                                                    color={STATE_LABEL[item?.matchState]?.color || "gray"}
                                                    leftSection={<IconClock size={11} />}
                                                >
                                                    {STATE_LABEL[item?.matchState]?.label || "—"}
                                                </Badge>
                                                <Group gap={6} align="center">
                                                    <Text size={"12px"} c={theme.colors.gray[6]}>{dayjs(item?.date).format("YYYY-MM-DD")}</Text>
                                                    <Text size={"12px"} c={theme.colors.gray[4]}>•</Text>
                                                    <Text size={"12px"} c={theme.colors.gray[6]}>{dayjs(item?.date).format("HH:mm")}</Text>
                                                </Group>
                                            </Group>

                                            <Group justify={"space-around"} align="center">
                                                <Text size={"sm"} c={theme.colors.gray[5]}>{item?.firstTeam?.team?.name}</Text>
                                                <Text ta={"center"} size={"sm"} fw={"bold"} color={theme.colors.gray[7]}>ضد</Text>
                                                <Text size={"sm"} c={theme.colors.gray[5]}>{item?.secondTeam?.team?.name}</Text>
                                            </Group>

                                            <Group justify={"space-around"} align="center">
                                                <Text size={"lg"} ta={"center"} c={theme.colors.gray[7]} fw={"bold"}>{item?.firstTeamGoal}</Text>
                                                <Text ta={"center"} size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>-</Text>
                                                <Text size={"lg"} ta={"center"} c={theme.colors.gray[7]} fw={"bold"}>{item?.secondTeamGoal}</Text>
                                            </Group>

                                            <Group justify={"space-between"} align="center" wrap="nowrap">
                                                <Stack gap={5} align="flex-start">
                                                    {item?.firstTeamScorersMatch?.length > 0 ?
                                                        item?.firstTeamScorersMatch?.map((item2: any) => (
                                                            <Text key={item2?.id} size={"12px"} c={theme.colors.gray[5]}>
                                                                {`${item2?.participating_player?.player?.person?.first_name} ${item2?.participating_player?.player?.person?.second_name} ${item2?.participating_player?.player?.person?.third_name} ${item2?.participating_player?.player?.person?.tribe}`}
                                                                {" د"} {item2?.time}
                                                            </Text>
                                                        ))
                                                        : null
                                                    }
                                                </Stack>
                                                <Text ta={"center"} size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>-</Text>
                                                <Stack gap={5} align="flex-start">
                                                    {item?.secondTeamScorersMatch?.length > 0 ?
                                                        item?.secondTeamScorersMatch?.map((item2: any) => (
                                                            <Text key={item2?.id} size={"12px"} c={theme.colors.gray[5]}>
                                                                {`${item2?.participating_player?.player?.person?.first_name} ${item2?.participating_player?.player?.person?.second_name} ${item2?.participating_player?.player?.person?.third_name} ${item2?.participating_player?.player?.person?.tribe}`}
                                                                {" د"} {item2?.time}
                                                            </Text>
                                                        ))
                                                        : null
                                                    }
                                                </Stack>
                                            </Group>

                                            {(item?.firstTeamCards?.length > 0 || item?.secondTeamCards?.length > 0) && (
                                                <>
                                                    <Divider my={4} />
                                                    <Grid gutter={6}>
                                                        <Col span={6}>
                                                            <Stack gap={3}>
                                                                {[...cardsForSide(item?.firstTeamCards, "yellow"), ...cardsForSide(item?.firstTeamCards, "red")].map((c: any, i: number) => (
                                                                    <Group key={`f-${i}`} gap={4} align="center" wrap="nowrap">
                                                                        <IconCards size={11} color={c.type === "red" ? theme.colors.red[6] : theme.colors.yellow[6]} />
                                                                        <Badge size="xs" radius="sm" variant="filled" color={c.type === "red" ? "red" : "yellow"}>
                                                                            {c.type === "red" ? "حمراء" : "صفراء"}
                                                                        </Badge>
                                                                        <Text size={"11px"} c={theme.colors.gray[6]}>{c?.player}</Text>
                                                                        {c?.date && <Text size={"11px"} c={theme.colors.gray[5]}>د.{c.date}</Text>}
                                                                    </Group>
                                                                ))}
                                                            </Stack>
                                                        </Col>
                                                        <Col span={6}>
                                                            <Stack gap={3}>
                                                                {[...cardsForSide(item?.secondTeamCards, "yellow"), ...cardsForSide(item?.secondTeamCards, "red")].map((c: any, i: number) => (
                                                                    <Group key={`s-${i}`} gap={4} align="center" wrap="nowrap">
                                                                        <IconCards size={11} color={c.type === "red" ? theme.colors.red[6] : theme.colors.yellow[6]} />
                                                                        <Badge size="xs" radius="sm" variant="filled" color={c.type === "red" ? "red" : "yellow"}>
                                                                            {c.type === "red" ? "حمراء" : "صفراء"}
                                                                        </Badge>
                                                                        <Text size={"11px"} c={theme.colors.gray[6]}>{c?.player}</Text>
                                                                        {c?.date && <Text size={"11px"} c={theme.colors.gray[5]}>د.{c.date}</Text>}
                                                                    </Group>
                                                                ))}
                                                            </Stack>
                                                        </Col>
                                                    </Grid>
                                                </>
                                            )}

                                            {item?.manOfMatch && (
                                                <Group gap={6} align="center" mt={4}>
                                                    <IconStar size={12} color={theme.colors.yellow[6]} />
                                                    <Text size={"11px"} c={theme.colors.gray[6]}>رجل المباراة:</Text>
                                                    <Badge size="xs" radius="sm" variant="light" color="yellow">{item.manOfMatch}</Badge>
                                                </Group>
                                            )}

                                            {(item?.arbitre?.Arbitre1 || item?.arbitre?.Arbitre2 || item?.arbitre?.Arbitre3 || item?.arbitre?.Arbitre4) && (
                                                <>
                                                    <Divider my={4} />
                                                    <Group gap={6} align="center" wrap="wrap">
                                                        <IconUserShield size={12} color={theme.colors.gray[5]} />
                                                        <Text size={"11px"} c={theme.colors.gray[5]}>طاقم التحكيم:</Text>
                                                        {[item?.arbitre?.Arbitre1, item?.arbitre?.Arbitre2, item?.arbitre?.Arbitre3, item?.arbitre?.Arbitre4]
                                                            .filter((n: string) => n && n.trim().length > 0)
                                                            .map((n: string, i: number) => (
                                                                <Badge key={i} size="xs" radius="sm" variant="default" color="gray">
                                                                    {n}
                                                                </Badge>
                                                            ))
                                                        }
                                                    </Group>
                                                </>
                                            )}
                                        </Stack>
                                        <Stack h={"100%"} gap={0} justify="flex-start">
                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant={"transparent"} color={"gray"}>
                                                        <IconDotsVertical size="1rem" />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    {(item?.createdAt === item?.updatedAt && item?.firstTeamGoal === 0 && item?.secondTeamGoal === 0)
                                                        ? <Menu.Item
                                                            leftSection={<IconPlus size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setOpenAddMatchResultModal(true)
                                                            }}
                                                        >اضافة نتيجة المباراة</Menu.Item>
                                                        : <Menu.Item
                                                            leftSection={<IconEdit size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setOpenEditMatchResultModal(true)
                                                            }}
                                                        >تعديل نتيجة المباراة</Menu.Item>
                                                    }

                                                    <Menu.Item
                                                        leftSection={<IconPlus size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenAddMatchCardModal(true)
                                                        }}
                                                    >اضافة بطاقات</Menu.Item>

                                                    {(item?.firstTeamCards?.length > 0 || item?.secondTeamCards?.length > 0) && (
                                                        <Menu.Item
                                                            leftSection={<IconCards size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setOpenManageMatchCardsModal(true)
                                                            }}
                                                        >تعديل البطاقات</Menu.Item>
                                                    )}

                                                    <Menu.Item
                                                        leftSection={<IconFriends size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenManageMatchLineupModal(true)
                                                        }}
                                                    >قائمة الفريقين</Menu.Item>

                                                    {(item?.manOfMatch === null || item?.manOfMatch === "")
                                                        ? <Menu.Item
                                                            leftSection={<IconPlus size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setOpenAddManOfMatchModal(true)
                                                            }}
                                                        >اضافة رجل المباراة</Menu.Item>
                                                        : <Menu.Item
                                                            leftSection={<IconEdit size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setOpenEditManOfMatchModal(true)
                                                            }}
                                                        >تعديل رجل المباراة</Menu.Item>
                                                    }

                                                    <Menu.Item
                                                        leftSection={<IconPlus size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenAddScorerModal(true)
                                                        }}
                                                    >اضافة هداف</Menu.Item>

                                                    {item?.firstTeamScorersMatch?.length > 0 || item?.secondTeamScorersMatch?.length > 0
                                                        ? <Menu.Item
                                                            leftSection={<IconEdit size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setOpenUpdateScorerModal(true)
                                                            }}
                                                        >تعديل الهداف</Menu.Item>
                                                        : null
                                                    }

                                                    <Divider />
                                                    <Menu.Item
                                                        leftSection={<IconUserShield size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenManageRefereesModal(true)
                                                        }}
                                                    >{item?.arbitre?.id ? "تعديل الحكام" : "إضافة الحكام"}</Menu.Item>

                                                    <Menu.Item
                                                        leftSection={<IconClock size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenUpdateMatchStateModal(true)
                                                        }}
                                                    >حالة المباراة</Menu.Item>

                                                    <Divider />
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenEditMatchModal(true)
                                                        }}
                                                    >تعديل</Menu.Item>

                                                    <Menu.Item
                                                        leftSection={<IconTrash size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item.id)
                                                            setOpenDeleteMatchModal(true)
                                                        }}
                                                    >حذف</Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Stack>
                                    </Group>
                                </Box>
                            </Col>
                        ))}
                    </Grid>
                    : null
                }
            </Box>
        </Modal>
    );
};
