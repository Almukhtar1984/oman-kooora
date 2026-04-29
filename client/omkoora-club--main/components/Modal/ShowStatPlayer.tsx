import { Box, useMantineTheme, Text, Center, Loader, Stack, Grid, Col } from "@mantine/core";
import Modal, { Props as ModalProps } from "./Modal";
import React, { useEffect, useState } from "react";
import { useStatPlayer } from "../../graphql";
import { PlayerStats1, PlayerData } from "../Card/PlayerCard";

type Props = {
    playerId: string | PlayerData;
    setSelectedPlayer: (player: any) => void;
    setOpenEditPlayerModal: (status: boolean) => void;
} & ModalProps;

export const ShowStatPlayer = ({ playerId, setSelectedPlayer, setOpenEditPlayerModal, ...props }: Props) => {
    const theme = useMantineTheme();
    const [getStatPlayer, { data: fetchedData, loading }] = useStatPlayer();
    const [displayData, setDisplayData] = useState<PlayerData | null>(null);

    useEffect(() => {
        if (props.opened) {
            if (typeof playerId === 'object' && playerId !== null) {
                setDisplayData(playerId as PlayerData);
            } else if (typeof playerId === 'string' && playerId !== "") {
                getStatPlayer({
                    variables: { id: playerId },
                    fetchPolicy: "network-only"
                });
            }
        } else {
            setDisplayData(null);
        }
    }, [playerId, props.opened]);

    useEffect(() => {
        if (fetchedData?.statPlayer) {
            // Transform fetchedData.statPlayer to PlayerData format if necessary
            // For now, assume fetchedData.statPlayer is compatible or at least has the basics
            // Actually, statPlayer query is thin, so we might need a better query or just rely on passing data
            setDisplayData(fetchedData.statPlayer);
        }
    }, [fetchedData]);

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            size="90%"
            footer={<></>}
            styles={{
                body: {
                    backgroundColor: theme.colors.gray[0],
                    padding: 0
                },
                inner: {
                    padding: 0
                }
            }}
        >
            <Box style={{ padding: 20 }}>
                {loading ? (
                    <Center py={50}>
                        <Loader size="lg" variant="dots" />
                    </Center>
                ) : props.title === "تفاصيل اللاعب" ? (
                    displayData ? <PlayerStats1 data={displayData} /> : <Center py={50}><Text color="gray.5">لا يوجد بيانات ملف شخصي</Text></Center>
                ) : fetchedData?.statPlayer ? (
                    <Box dir="rtl">
                        <Stack spacing="lg">
                            <Box sx={{ borderBottom: `2px solid ${theme.colors.blue[6]}`, paddingBottom: 10 }}>
                                <Text weight={700} size="xl" color="blue.9">
                                    {`${fetchedData.statPlayer.Person.first_name || ''} ${fetchedData.statPlayer.Person.second_name || ''} ${fetchedData.statPlayer.Person.third_name || ''} ${fetchedData.statPlayer.Person.tribe || ''}`}
                                </Text>
                                <Text size="sm" color="gray.6">{fetchedData.statPlayer.team?.name || 'النادي الرياضي'}</Text>
                            </Box>

                            <Grid grow gutter="md">
                                <Col span={6} md={3}>
                                    <Box sx={{ backgroundColor: 'white', padding: 20, borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <Text size="xs" color="gray.5" weight={600} mb={4}>الأهداف</Text>
                                        <Text size={28} weight={800} color="orange.7">{fetchedData.statPlayer.Goal || 0}</Text>
                                    </Box>
                                </Col>
                                <Col span={6} md={3}>
                                    <Box sx={{ backgroundColor: 'white', padding: 20, borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <Text size="xs" color="gray.5" weight={600} mb={4}>المباريات</Text>
                                        <Text size={28} weight={800} color="blue.7">{fetchedData.statPlayer.participatingPlayerMatchCount || 0}</Text>
                                    </Box>
                                </Col>
                                <Col span={6} md={3}>
                                    <Box sx={{ backgroundColor: 'white', padding: 20, borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <Text size="xs" color="gray.5" weight={600} mb={4}>المشاركات</Text>
                                        <Text size={28} weight={800} color="green.7">{fetchedData.statPlayer.Participation?.length || 0}</Text>
                                    </Box>
                                </Col>
                                <Col span={6} md={3}>
                                    <Box sx={{ backgroundColor: 'white', padding: 20, borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <Text size="xs" color="gray.5" weight={600} mb={4}>العقوبات</Text>
                                        <Text size={28} weight={800} color="red.7">{fetchedData.statPlayer.Sanctions?.length || 0}</Text>
                                    </Box>
                                </Col>
                            </Grid>
                        </Stack>
                    </Box>
                ) : (
                    <Center py={50}>
                        <Text color="gray.5">لا توجد بيانات ليتم عرضها</Text>
                    </Center>
                )}
            </Box>
        </Modal>
    );
};
