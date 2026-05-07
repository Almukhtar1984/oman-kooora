import {Box, Button, Col, Grid, Group, Select, Stack, Text, Textarea,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, AllPlayersClubTransferred, useAllTeams, useUpdatePlayer, useUpdateTransfer} from "../../graphql";
import { useForm } from '@mantine/form';
import useStore from "../../store/useStore";

type Props = {
    data: any;
} & ModalProps;

export const UpdatePlayersTransferModal = ({data, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const clubId = userData?.person?.clubManagement?.club?.id;
    const form = useForm({
        initialValues: {id_team_to: ""}
    });
    const [updateTransfer] = useUpdateTransfer();
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [getAllTeams, { loading: loadingAllTeams, error: errorAllTeams, data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (clubId) {
            const idClub = clubId;
            getAllTeams({
                variables: {idClub},
                fetchPolicy: "cache-and-network"
            })
        }
    }, [opened, clubId, getAllTeams])

    useEffect(() => {
        if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length >= 0) {
            const allTeams: {label: string, value: string}[] = []

            dataAllTeams?.allTeam?.map((item: any) => {
                allTeams.push({label: item?.name, value: item?.id})
            })

            setAllTeams([...allTeams])
        }
    }, [dataAllTeams])

    const onSubmit = ({id_team_to}: any) => {
        updateTransfer({
            variables: {
                id: data?.id,
                content: {
                    id_player: data?.id_player,
                    status: data?.status,
                    id_team_from: data?.team_from.id,
                    id_team_to: id_team_to !== "" ? id_team_to : null
                }
            },
            refetchQueries: [AllPlayersClubTransferred]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Stack align={"center"} justify={"center"}>
                {data?.status === "accepted"
                    ? <>
                        <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من قبول انتقال اللاعب؟</Text>
                        <form style={{width: "100%"}} onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                            <Grid gutter={20} mb={20}>
                                <Col span={12}>
                                    <Select
                                        placeholder="حدد الفريق المنتقل اليه"
                                        withAsterisk
                                        rightSection={<ChevronDown size={14} />}
                                        rightSectionWidth={30}
                                        styles={{ rightSection: { pointerEvents: 'none' } }}
                                        data={allTeams}
                                        {...form.getInputProps("id_team_to")}

                                        searchable={true}
                                        clearable={true}

                                        nothingFound="لا يوجد فرق"
                                    />
                                </Col>
                            </Grid>
                        </form>
                    </>
                    : data?.status === "rejected"
                        ? <Text size={"xl"} my={30} mx={"auto"}>هل انت متأكد من رفض انتقال اللاعب؟</Text>
                        : null
                }
            </Stack>
        </Modal>
    );
};
