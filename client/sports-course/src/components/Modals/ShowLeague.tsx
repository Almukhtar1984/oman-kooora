import { ActionIcon,Box,Grid,Group,Menu,Stack,Text,useMantineTheme } from "@mantine/core";
import { IconDotsVertical,IconInfoCircle } from "@tabler/icons-react";
import { useEffect,useState } from "react";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    setSelectedData: (id: string) => void;
    data?: any;

    setOpenShowParticipatingPlayersModal: (status: boolean) => void;
    setOpenShowParticipatingTechnicalStaffModal: (status: boolean) => void;
} & ModalProps;

export const ShowLeague = ({data, setSelectedData, setOpenShowParticipatingPlayersModal, setOpenShowParticipatingTechnicalStaffModal, ...props}: Props) => {
    const theme = useMantineTheme();
    const [groupedData, setGroupedData] = useState<any>([]);

    useEffect(() => {
        if (data && props.opened) {
            let groupedData = new Map();

            for (let i = 0; i < data?.participatingTeams?.length; i++) {
                const item = data?.participatingTeams?.[i]

                if (groupedData.has(item.group)) {
                    groupedData.get(item.group).push(item);
                } else {
                    groupedData.set(item.group, [item]);
                }
            }

            setGroupedData(
                Array.from(groupedData.values()).sort((a, b) => {
                    return a[0].group.localeCompare(b[0].group);
                })
            )
        }
    }, [data, props.opened]);

    const closeModal = () => {
        props.onClose();
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
                <Grid gutter={20}>
                    {groupedData?.map((item: any, index: number) => (
                        <Col key={item?.[0]?.group || index} span={4} >
                            <Box bg={theme.white} style={({ colors }) => ({padding: 20})}>
                                <Stack>
                                    <Text ta={"center"} size={"sm"} fw={"bold"} color={theme.colors.gray[7]}>
                                        {`المجموعة ${item[0].group}`}
                                    </Text>
                                    {item?.map((item2: any, index: number) => (
                                        <Group key={index} justify={"space-around"} align={"center"}>
                                            <Text size={"sm"} color={theme.colors.gray[5]}>
                                                {`${item2.team?.name}`}
                                            </Text>

                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant={"transparent"} color={"gray"}>
                                                        <IconDotsVertical size="1rem" />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>

                                                    <Menu.Item
                                                        leftSection={<IconInfoCircle size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item2?.id)
                                                            setOpenShowParticipatingPlayersModal(true)
                                                        }}
                                                    >عرض اللاعبين</Menu.Item>

                                                    <Menu.Item
                                                        leftSection={<IconInfoCircle size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item2?.id)
                                                            setOpenShowParticipatingTechnicalStaffModal(true)
                                                        }}
                                                    >عرض الجهاز الفني</Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    ))}
                                </Stack>

                            </Box>
                        </Col>
                    ))}
                </Grid>
            </Box>
        </Modal>
    );
};
