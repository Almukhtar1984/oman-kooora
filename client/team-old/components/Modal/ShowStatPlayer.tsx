import { Box, Table, useMantineTheme, Text, Menu, ActionIcon } from "@mantine/core";
import { IconDotsVertical, IconEdit } from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import React, { useEffect } from "react";
import { useStatPlayer } from "../../graphql";

type Props = {
    playerId: string;
    setSelectedPlayer: (player: any) => void;
    setOpenEditPlayerModal: (status: boolean) => void;
} & ModalProps;

export const ShowStatPlayer = ({ playerId, setSelectedPlayer, setOpenEditPlayerModal, ...props }: Props) => {
    const theme = useMantineTheme();
    const [getStatPlayer, { data: playerData }] = useStatPlayer();

    useEffect(() => {
        if (playerId && props.opened) {
            getStatPlayer({
                variables: {
                    id: playerId
                },
                fetchPolicy: "network-only",
                onCompleted: (data) => {
                }
            });
        }
    }, [playerId, props.opened]);

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={<></>}
            styles={{
                body: {
                    backgroundColor: theme.colors.gray[1]
                }
            }}
        >
            <Box style={{ padding: 20 }}>
                {playerData ? (
                    <Table>
                        <tbody>
                            <tr>
                                <td><Text weight={500}>اسم اللاعب</Text></td>
                                <td>
                                    <Text>
                                        {`${playerData.statPlayer.Person.first_name} ${playerData.statPlayer.Person.second_name} ${playerData.statPlayer.Person.third_name}`}
                                    </Text>
                                </td>
                            </tr>
                            <tr>
                                <td><Text weight={500}>المشاركات</Text></td>
                                <td>
                                    <Text>{playerData.statPlayer.Participation.length}</Text>
                                </td>
                            </tr>
                            <tr>
                                <td><Text weight={500}>العقوبات</Text></td>
                                <td>
                                    <Text>{playerData.statPlayer.Sanctions.length}</Text>
                                </td>
                            </tr>
                            <tr>
                                <td><Text weight={500}>عدد المباريات التي شارك فيها</Text></td>
                                <td>
                                    <Text>{playerData.statPlayer.participatingPlayerMatchCount}</Text>
                                </td>
                            </tr>
                            <tr>
                                <td><Text weight={500}>عدد الأهداف</Text></td>
                                <td>
                                    <Text>{playerData.statPlayer.Goal}</Text>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                ) : (
                    <Text size={"14px"} c={theme.colors.gray[6]}>
                
                    </Text>
                )}
            </Box>
        </Modal>
    );
};
