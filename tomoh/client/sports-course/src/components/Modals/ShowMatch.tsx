import {Box, Divider, Grid, Group, useMantineTheme, Stack, Text, Menu, ActionIcon} from "@mantine/core";
import {IconDotsVertical, IconEdit, IconPlus, IconTrash, } from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import dayjs from "dayjs";
import { useEffect } from "react";

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
} & ModalProps;

export const ShowMatch = ({data, setSelectedData, setOpenAddMatchResultModal,  setOpenEditMatchResultModal, setOpenEditMatchModal, setOpenDeleteMatchModal, setOpenAddMatchCardModal, setOpenAddManOfMatchModal, setOpenEditManOfMatchModal, setOpenAddScorerModal, setOpenUpdateScorerModal, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
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
                                            <Group justify={"space-around"} align="center">
                                                <Text size={"sm"} c={theme.colors.gray[5]}>{item?.firstTeam?.team?.name}</Text>
                                                <Text ta={"center"} size={"sm"} fw={"bold"} color={theme.colors.gray[7]}>ضد</Text>
                                                <Text size={"sm"} c={theme.colors.gray[5]}>{item?.secondTeam?.team?.name}</Text>
                                            </Group>

                                            <Group justify={"space-around"} align="center">
                                                <Stack gap={5}>
                                                    <Text dir={"rtl"} ta={"center"} size={"14px"} color={theme.colors.gray[7]}>
                                                        {dayjs(item?.date).format("YYYY-MM-DD")}
                                                    </Text>
                                                    <Text dir={"rtl"} ta={"center"} size={"13px"} color={theme.colors.gray[7]}>
                                                        {dayjs(item?.date).format("HH:mm")}
                                                        </Text>
                                                </Stack>
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