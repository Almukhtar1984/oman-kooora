import {Box, Grid, Group, useMantineTheme, Stack, Text, Menu, ActionIcon, Image} from "@mantine/core";
import {IconDotsVertical, IconEdit} from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import dayjs from "dayjs";
import {useAllParticipatingPlayers} from "../../graphql";
import React, {useEffect, useState} from "react";

const {Col} = Grid
const apiBaseUrl =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:7001";

type Props = {
    data?: any;
    setSelectedData: (id: any) => void;
    setOpenEditParticipatingPlayersModal: (status: boolean) => void;
} & ModalProps;

export const ShowParticipatingPlayers = ({data, setSelectedData, setOpenEditParticipatingPlayersModal, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();
    const [getAllParticipatingPlayers, {data: dataAllParticipatingPlayers}] = useAllParticipatingPlayers()

    const [allParticipatingPlayers, setAllParticipatingPlayers] = useState<object[]>([]);

    useEffect(() => {
        if (data && props.opened) {
            getAllParticipatingPlayers({
                variables: {
                    idParticipatingTeams: data
                },
                fetchPolicy: "network-only",
                onCompleted: ({allParticipatingPlayers}) => {
                    setAllParticipatingPlayers([...allParticipatingPlayers])
                }
            })
        }
    }, [data, props.opened]);

    const closeModal = () => {
        props.onClose();
        setAllParticipatingPlayers([])
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
                {allParticipatingPlayers?.length >= 0
                    ? <Grid gutter={20}>
                        {allParticipatingPlayers?.map((item: any, index: number) => (
                            <Col key={index} span={6} >
                                <Box bg={theme.white} style={({ colors }) => ({padding: 10})}>
                                    <Group wrap={"nowrap"} justify={"space-between"} align="flex-start">
                                        <Group wrap={"nowrap"} justify={"flex-start"} align={"center"}>
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
                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant={"transparent"} color={"gray"} size={"sm"}>
                                                        <IconDotsVertical size="0.9rem" />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenEditParticipatingPlayersModal(true)
                                                        }}
                                                    >تعديل اللاعب</Menu.Item>
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
