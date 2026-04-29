import {Box, Divider, Grid, Group, useMantineTheme, Stack, Text, Menu, ActionIcon} from "@mantine/core";
import {IconDotsVertical, IconEdit, IconPlus, IconTrash,IconInfoCircle } from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import dayjs from "dayjs";
import { useEffect } from "react";
import {isWithinTimeWindow} from "../../lib/helpers/Time"

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
    setOpenAddParticipatingPlayersMatch: (status: boolean) => void;
    setopenShowPlayerListModal: (status: boolean) => void;
} & ModalProps;

export const ShowMatch = ({data, setSelectedData, setOpenAddMatchResultModal,  setOpenEditMatchResultModal, setOpenEditMatchModal, setOpenDeleteMatchModal, setOpenAddMatchCardModal, setOpenAddManOfMatchModal, setOpenEditManOfMatchModal, setOpenAddScorerModal, setOpenUpdateScorerModal,setOpenAddParticipatingPlayersMatch,setopenShowPlayerListModal, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();
   


    const closeModal = () => {
        props.onClose();
    };
    useEffect(() => {
        console.log("data")
        console.log("data match:",data)
    }, [data, props.opened])

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
            <Box style={{padding: 20}}>
                {data?.matchs?.length > 0
                    ? <Grid gutter={20}>
                        {data?.matchs?.map((item: any, index: number) => (
                            <Col key={index} span={6} >
                                <Box bg={theme.white} style={{padding: 20}}>
                                    <Group noWrap  align="flex-start" >
                                        <Stack spacing={5} w={"100%"}>
                                            <Group  style={{justifyContent: 'space-around'}} align="center">
                                                <Text size={"sm"} c={theme.colors.gray[5]}>{item?.firstTeam?.team?.name}</Text>
                                                <Text ta={"center"} size={"sm"} fw={"bold"} color={theme.colors.gray[7]}>ضد</Text>
                                                <Text size={"sm"} c={theme.colors.gray[5]}>{item?.secondTeam?.team?.name}</Text>
                                            </Group>

                                            <Group style={{justifyContent: 'space-around'}}align="center">
                                                <Stack spacing={5}>
                                                    <Text dir={"rtl"} ta={"center"} size={"14px"} color={theme.colors.gray[7]}>
                                                        {dayjs(item?.date).format("YYYY-MM-DD")}
                                                    </Text>
                                                    <Text dir={"rtl"} ta={"center"} size={"13px"} color={theme.colors.gray[7]}>
                                                        {dayjs(item?.date).format("HH:mm")}
                                                        </Text>
                                                </Stack>
                                            </Group>

                                            <Group style={{justifyContent: 'space-around'}} align="center">
                                                <Text size={"lg"} ta={"center"} c={theme.colors.gray[7]} fw={"bold"}>{item?.firstTeamGoal}</Text>
                                                <Text ta={"center"} size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>-</Text>
                                                <Text size={"lg"} ta={"center"} c={theme.colors.gray[7]} fw={"bold"}>{item?.secondTeamGoal}</Text>
                                            </Group>

                                            <Group style={{justifyContent: 'space-around'}} align="center" noWrap>
                                                <Stack spacing={5} align="flex-start">
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
                                                <Stack spacing={5} align="flex-start">
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

                                        {(userData?.person?.member?.team?.id ===item?.firstTeam?.team?.id || userData?.person?.member?.team?.id ===item?.secondTeam?.team?.id) &&<Stack h={"100%"} sx={{gap:"0px"}} justify="flex-start">
                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant={"transparent"} color={"gray"}>
                                                        <IconDotsVertical size="1rem" />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                {item?.date  && isWithinTimeWindow(item.date )&&
                                                <Menu.Item
                                                icon={<IconPlus size={14} />}
                                                onClick={() => {
                                                    setSelectedData(item)
                                                    setOpenAddParticipatingPlayersMatch(true)
                                                }}
                                            >اضافة قائمة اللاعبين</Menu.Item>
                                                }
                                                    <Menu.Item
                                                            icon={<IconInfoCircle size={14} />}
                                                            onClick={() => {
                                                                setSelectedData(item)
                                                                setopenShowPlayerListModal(true)
                                                            }}
                                                        > قائمة اللاعبين</Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Stack>}
                                       
                                        
                                    </Group>
                                    <Divider />
                                    <Stack mt={10} sx={{gap:"10px"}} mb={20}>

                                            {/* Title */}
                                            <Text ta="center" fw={700} size="sm" mb={5} >البطاقات</Text>

                                            <Group align="flex-start"  w="100%" sx={{justifyContent:"space-between"}}>

                                            {/* First Team Cards - Right Side */}
                                            <Stack w="45%" align="flex-end"  style={{alignItems:"flex-center",gap:"5px"}} className='zabi' >
                                                {item?.firstTeamCards?.length > 0 && (
                                                <>
                                                    
                                                    {item.firstTeamCards.map((card: any, index: number) => (
                                                    <Group key={index}  align="center" style={{alignItems:"flex-center",gap:"5px"}}> 
                                                        <Text size="xs">{card.player}</Text>
                                                        {card.type === "yellow" ? (
                                                        <Box w={12} h={16} bg="yellow" style={{ borderRadius: 2, border: '1px solid #000' }} />
                                                        ) : card.type === "red" ? (
                                                        <Box w={12} h={16} bg="red" style={{ borderRadius: 2, border: '1px solid #000' }} />
                                                        ) : null}
                                                        <Text size="xs" c="gray.6">د {card.date}</Text>
                                                    </Group>
                                                    ))}
                                                </>
                                                )}
                                            </Stack>

                                            {/* Second Team Cards - Left Side */}
                                            <Stack w="45%" align="flex-start"  sx={{gap:"5px"}} >
                                                {item?.secondTeamCards?.length > 0 && (
                                                <>
                                                   
                                                    {item.secondTeamCards.map((card: any, index: number) => (
                                                    <Group key={index}  align="center" style={{alignItems:"flex-center",gap:"5px"}}>
                                                        <Text size="xs">{card.player}</Text>
                                                        {card.type === "yellow" ? (
                                                        <Box w={12} h={16} bg="yellow" style={{ borderRadius: 2, border: '1px solid #000' }} />
                                                        ) : card.type === "red" ? (
                                                        <Box w={12} h={16} bg="red" style={{ borderRadius: 2, border: '1px solid #000' }} />
                                                        ) : null}
                                                        <Text size="xs" c="gray.6">د {card.date}</Text>
                                                    </Group>
                                                    ))}
                                                </>
                                                )}
                                            </Stack>

                                            </Group>
                                            </Stack>

                                            <Divider />
                                        <Stack justify= {"space-around"}  sx={{gap:"10px"}} w={"100%"} style={{marginTop:"5%",display:"flex",flexDirection: "row"}}>

                                            
                                            <div style={{width:'100%',display:'flex',flexDirection:"column",alignItems:'center'}}> 
                                                <div> 
                                                حكام
                                                </div>
                                                <div style={{width:'85%',display:"flex",justifyContent:'space-between',marginTop:"9px",flexWrap:"wrap"}}> 
                                                <span> {item?.arbitre?.Arbitre1}</span><span> {item?.arbitre?.Arbitre2}</span><span> {item?.arbitre?.Arbitre3}</span><span> {item?.arbitre?.Arbitre4}</span>
                                                </div>
                                            </div>
                                            
                                        </Stack>
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