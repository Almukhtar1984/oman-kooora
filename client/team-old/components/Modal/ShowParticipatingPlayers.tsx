import {Box, Grid, Group, useMantineTheme, Stack, Text, Menu, ActionIcon, Image,Button} from "@mantine/core";
import { Printer} from "tabler-icons-react";
import {IconDotsVertical, IconEdit,IconPrinter} from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import dayjs from "dayjs";
import {useAllParticipatingPlayers} from "../../graphql";
import React, {useEffect, useState} from "react";

const {Col} = Grid

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
    const [EditData,setEditData] = useState(false)

    useEffect(() => {
        
        if (data && props.opened) {
            getAllParticipatingPlayers({
                variables: {
                    idParticipatingTeams: data
                },
                fetchPolicy: "network-only",
                onCompleted: ({allParticipatingPlayers}) => {
                    setAllParticipatingPlayers([...allParticipatingPlayers])
                    if (allParticipatingPlayers && allParticipatingPlayers.length > 0) {
                    
                        if( allParticipatingPlayers[0]?.participating_team?.team?.id === userData?.person?.member?.team?.id){
                            setEditData(true)
                        }
                        else{
                            setEditData(false)
                        }
                      }
                }
            })
        }
        
    }, [data, props.opened]);
    useEffect(() => {
        
    }, [allParticipatingPlayers])

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
            <Button
                color={"blue"}
                component={"a"}
                href={`https://print.omkooora.com/#/Participating/${data}/player`}
                target={"_blank"}
                ><IconPrinter size={18} />
                    طباعة القائمة
                </Button>
            <Box style={{padding: 20}}>
                {allParticipatingPlayers?.length >= 0
                    ? <Grid gutter={20}>
                        {allParticipatingPlayers?.map((item: any, index: number) => (
                            <Col key={index} span={6} >
                                <Box bg={theme.white} style={{padding: 20}}>
                                    <Group  align="flex-start" style={{flexWrap:"nowrap",justifyContent:"space-between"}}>
                                        <Group style={{flexWrap:"nowrap",justifyContent:"flex-start"}}  align={"center"}>
                                            <Stack justify={"center"} h={"100%"}>
                                                <Image src={`https://api.omkooora.com/images/${item?.player?.person?.personal_picture}`} w={30} />
                                            </Stack>

                                            <Stack spacing={5} justify={"center"} align="flex-start">
                                                <Text size={"14px"} c={theme.colors.gray[6]}>
                                                    {`${item?.player?.person?.first_name} ${item?.player?.person?.second_name} ${item?.player?.person?.third_name} ${item?.player?.person?.tribe} (${item?.player?.person?.card_number})`}
                                                </Text>
                                                <Text size={"14px"} c={theme.colors.gray[6]}>
                                                    {`${item?.player?.person?.date_birth}`}
                                                </Text>
                                                <Group style={{justifyContent:"flex-start"}}  align="center" spacing={10}>
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
                                                    {EditData && <Menu.Item
                                                        icon={<IconEdit size={14} />}
                                                        onClick={() => {
                                                            setSelectedData(item)
                                                            setOpenEditParticipatingPlayersModal(true)
                                                        }}
                                                    >تعديل اللاعب</Menu.Item>}
                                                     <Menu.Item
                                                    component={"a"} icon={<Printer size={18} />}
                                                    href={`https://print.omkooora.com/#/participating-player/${item?.id}`}
                                                    target={"_blank"}
                                                >طباعة البطاقة</Menu.Item>
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