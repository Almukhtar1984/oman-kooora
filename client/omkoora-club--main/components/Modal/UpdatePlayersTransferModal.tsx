import {Box, Button, Col, Grid, Group, Select, Stack, Text, Textarea,} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, AllPlayersClubTransferred, AllPlayersClubLoan, useAllTeams, useUpdatePlayer, useUpdateTransfer} from "../../graphql";
import { useForm } from '@mantine/form';
import useStore from "../../store/useStore";
import { Notyf } from "notyf";

type Props = {
    data: any;
} & ModalProps;

export const UpdatePlayersTransferModal = ({data, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: {id_team_to: "", note: ""}
    });
    const rejecting = data?.status === "rejected";
    const [updateTransfer] = useUpdateTransfer();
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled?: boolean}[]>([]);
    const [getAllTeams, { loading: loadingAllTeams, error: errorAllTeams, data: dataAllTeams }] = useAllTeams();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTeams({
                variables: {idClub},
                fetchPolicy: "cache-and-network"
            })
        }
    }, [opened])

    useEffect(() => {
        if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length >= 0) {
            const allTeams: {label: string, value: string}[] = []

            dataAllTeams?.allTeam?.map((item: any) => {
                allTeams.push({label: item?.name, value: item?.id})
            })

            setAllTeams([...allTeams])
        }
    }, [dataAllTeams])

    const onSubmit = ({id_team_to, note}: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        // Accepting without naming a team used to leave the player attached to
        // nothing; the receiving club is the one that decides where he plays.
        if (data?.status === "accepted" && !id_team_to) {
            notyf.error("اختر الفريق الذي سينضم إليه اللاعب في ناديك");
            return;
        }

        // والرفض بلا سبب هو ما يشكو منه الفريق: يُرفض طلبه ولا يدري لماذا.
        if (rejecting && !String(note || "").trim()) {
            form.setFieldError("note", "اكتب سبب الرفض — يظهر للفريق في تتبّع طلبه");
            return;
        }

        updateTransfer({
            variables: {
                id: data?.id,
                content: {
                    id_player: data?.id_player,
                    status: data?.status,
                    id_team_from: data?.team_from?.id,
                    id_team_to: id_team_to !== "" ? id_team_to : null,
                    ...(rejecting ? { note: String(note).trim() } : {}),
                }
            },
            refetchQueries: [AllPlayersClubTransferred, AllPlayersClubLoan, AllPlayers],
            awaitRefetchQueries: true,
        })
        .then(() => {
            closeModal();
            notyf.success("تمت العملية بنجاح")
        })
        .catch(reason => {
            console.log(reason)
            notyf.error("حدث خطأ أثناء تنفيذ العملية")
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
                {/* النموذج يُرسم في الحالتين: زرّ «تأكيد» يرسله بمعرّفه، وكان
                    يُرسم في القبول وحده فيضغط النادي «تأكيد» على الرفض فلا يحدث
                    شيء — عين ما رآه العميل في الإعارات. */}
                <form style={{width: "100%"}} onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    {rejecting
                        ? <>
                            <Text size={"xl"} my={30} mx={"auto"} align="center">هل انت متأكد من رفض انتقال اللاعب؟</Text>
                            <Textarea
                                label="سبب الرفض"
                                placeholder="يظهر للفريق في تتبّع طلبه"
                                withAsterisk
                                autosize
                                minRows={2}
                                mb={20}
                                {...form.getInputProps("note")}
                            />
                        </>
                        : <>
                            <Text size={"xl"} my={30} mx={"auto"} align="center">هل انت متأكد من قبول انتقال اللاعب؟</Text>
                            <Grid gutter={20} mb={20}>
                                <Col span={12}>
                                    <Select
                                        label="الفريق الذي سينضم إليه اللاعب في ناديك"
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
                        </>
                    }
                </form>
            </Stack>
        </Modal>
    );
};