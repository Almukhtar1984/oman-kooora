import { ActionIcon,Box,Center,Grid,Group,Image,Menu,Skeleton,Stack,Text,useMantineTheme } from "@mantine/core";
import { IconDotsVertical,IconEdit,IconUserOff } from "@tabler/icons-react";
import { useEffect,useState } from "react";
import { useAllParticipatingPlayers } from "../../graphql";
import { apiBaseUrl } from "../../lib/config";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    data?: any;
    setSelectedData: (id: any) => void;
    setOpenEditParticipatingPlayersModal: (status: boolean) => void;
} & ModalProps;

export const ShowParticipatingPlayers = ({data, setSelectedData, setOpenEditParticipatingPlayersModal, ...props}: Props) => {
    const theme = useMantineTheme();
    const [getAllParticipatingPlayers, { loading }] = useAllParticipatingPlayers()

    const [allParticipatingPlayers, setAllParticipatingPlayers] = useState<object[]>([]);
    const [hasFetched, setHasFetched] = useState<boolean>(false);

    useEffect(() => {
        if (data && props.opened) {
            setHasFetched(false);
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
                    <Grid gutter={20}>
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
                )}
            </Box>
        </Modal>
    );
};
