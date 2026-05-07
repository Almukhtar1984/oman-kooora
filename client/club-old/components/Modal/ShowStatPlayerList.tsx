import { Box, useMantineTheme, Text, Center, Loader, Table } from "@mantine/core";
import Modal, { Props as ModalProps } from "./Modal";
import React, { useEffect, useState } from "react";
import { useStatPlayer } from "../../graphql";

type Props = {
    playerId: string | any;
    setSelectedPlayer: (player: any) => void;
    setOpenEditPlayerModal: (status: boolean) => void;
} & ModalProps;

export const ShowStatPlayerList = ({ playerId, setSelectedPlayer, setOpenEditPlayerModal, ...props }: Props) => {
    const theme = useMantineTheme();
    const [getStatPlayer, { data: fetchedData, loading }] = useStatPlayer();
    const [displayData, setDisplayData] = useState<any | null>(null);

    useEffect(() => {
        if (props.opened) {
            if (typeof playerId === 'object' && playerId !== null) {
                // If the object only has base info, we still query for stats
                if (!playerId.Person && playerId.id) {
                    getStatPlayer({
                        variables: { id: playerId.id },
                        fetchPolicy: "network-only"
                    });
                } else {
                    setDisplayData(playerId);
                }
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
            size="lg"
            footer={<></>}
            styles={{
                body: {
                    backgroundColor: theme.colors.gray[0],
                    padding: "20px"
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
                ) : displayData ? (
                    <Box sx={{ direction: 'rtl', padding: "0 20px" }}>
                        <Table verticalSpacing="md" horizontalSpacing="xl" fontSize="md" striped={false}>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 800, width: '40%', borderBottom: '1px solid #eee', color: '#333' }}>اسم اللاعب</td>
                                    <td style={{ textAlign: 'center', width: '60%', borderBottom: '1px solid #eee' }}>{displayData?.Person ? `${displayData.Person.first_name || ''} ${displayData.Person.tribe || displayData.Person.third_name || ''}` : `${displayData?.person?.first_name || ''} ${displayData?.person?.tribe || ''}`}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 800, borderBottom: '1px solid #eee', color: '#333' }}>المشاركات</td>
                                    <td style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>{displayData?.Participation?.length || 0}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 800, borderBottom: '1px solid #eee', color: '#333' }}>العقوبات</td>
                                    <td style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>{displayData?.Sanctions?.length || 0}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 800, borderBottom: '1px solid #eee', color: '#333' }}>عدد المباريات التي شارك فيها</td>
                                    <td style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>{displayData?.participatingPlayerMatchCount || 0}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 800, borderBottom: 'none', color: '#333' }}>عدد الأهداف</td>
                                    <td style={{ textAlign: 'center', borderBottom: 'none' }}>{displayData?.Goal || 0}</td>
                                </tr>
                            </tbody>
                        </Table>
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
