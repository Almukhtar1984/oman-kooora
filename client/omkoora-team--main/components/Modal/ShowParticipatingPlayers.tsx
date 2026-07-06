import {Box, Grid, Group, useMantineTheme, Stack, Text, Menu, ActionIcon, Image,Button} from "@mantine/core";
import { Printer, Trash} from "tabler-icons-react";
import {IconDotsVertical, IconEdit,IconPrinter} from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import {openPrint} from "../../lib/helpers/openPrint";
import dayjs from "dayjs";
import {useAllParticipatingPlayers, useDeleteParticipatingPlayers} from "../../graphql";
import { showNotification } from '@mantine/notifications';
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
    const [deleteParticipatingPlayer] = useDeleteParticipatingPlayers()

    const [allParticipatingPlayers, setAllParticipatingPlayers] = useState<object[]>([]);
    const [EditData,setEditData] = useState(false)

    const loadPlayers = () => {
        if (!data) return;
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
    };

    useEffect(() => {
        if (data && props.opened) {
            loadPlayers()
        }
    }, [data, props.opened]);

    const handleDelete = (item: any) => {
        if (!item?.id) return;
        if (!window.confirm(`هل تريد حذف «${item?.player?.person?.first_name} ${item?.player?.person?.second_name}» من المسابقة؟`)) return;
        deleteParticipatingPlayer({
            variables: { id: item.id },
            onCompleted: (res: any) => {
                if (res?.deleteParticipatingPlayers?.status) {
                    showNotification({ title: "تم", message: "تم حذف اللاعب من المسابقة", color: "green" });
                    setAllParticipatingPlayers((prev) => prev.filter((p: any) => p?.id !== item.id));
                } else {
                    showNotification({ title: "تعذّر الحذف", message: "لم يتم حذف اللاعب", color: "red" });
                }
            },
            onError: (err: any) => {
                showNotification({ title: "خطأ", message: err?.message || "فشل حذف اللاعب من المسابقة", color: "red" });
            }
        });
    };
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
                onClick={(e) => { e.preventDefault(); openPrint(`/Participating/${data}/player`); }}
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
                                                    onClick={(e) => { e.preventDefault(); openPrint(`/participating-player/${item?.id}`); }}
                                                >طباعة البطاقة</Menu.Item>
                                                    {EditData && <Menu.Item
                                                        color="red"
                                                        icon={<Trash size={14} />}
                                                        onClick={() => handleDelete(item)}
                                                    >حذف من المسابقة</Menu.Item>}
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