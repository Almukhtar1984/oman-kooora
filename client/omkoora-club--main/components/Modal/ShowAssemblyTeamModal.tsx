import {Box, Button, Center, Group, Loader, Select, Text} from "@mantine/core";
import {ChevronDown, Printer, Search, X} from "tabler-icons-react";
import React, {useEffect, useMemo, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {useAllAssemblyTeam, useAllTeams} from "../../graphql";
import {openPrint} from "../../lib/helpers/openPrint";
import useStore from "../../store/useStore";
import {AssemblyTableTeam} from "../Tables";

type Props = {
    hasPermission: (permission: string) => boolean;
} & ModalProps;

export const ShowAssemblyTeamModal = ({hasPermission, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const idClub = userData?.person?.clubManagement?.club?.id;
    const [team, setTeam] = useState<string | null>(null);
    const [getAllTeams, { data: dataAllTeams }] = useAllTeams();
    const [getAllAssemblyTeam, { loading, error, data, called, variables }] = useAllAssemblyTeam();

    useEffect(() => {
        if (props.opened && idClub) {
            getAllTeams({
                variables: {idClub},
                fetchPolicy: "cache-and-network"
            })
        }
    }, [props.opened, idClub])

    const allTeams = useMemo(
        () => (dataAllTeams?.allTeam || [])
            .map((item: any) => ({label: item?.name, value: item?.id}))
            .sort((a: any, b: any) => ("" + (a.label ?? "")).localeCompare("" + (b.label ?? ""), "ar")),
        [dataAllTeams]
    );

    const loadTeam = (idTeam: string | null) => {
        if (!idTeam) return;
        getAllAssemblyTeam({
            variables: {idTeam, withClubMembers: true},
            fetchPolicy: "network-only",
            onError: error => console.log(error)
        })
    };

    const onChangeTeam = (value: string | null) => {
        setTeam(value);
        loadTeam(value);
    };

    // Only show the result that belongs to the currently selected team.
    const showingTeam = called && team && variables?.idTeam === team;
    const allAssembly: any[] = showingTeam ? (data?.allAssemblyTeam || []) : [];

    const closeModal = () => {
        props.onClose();
        setTeam(null)
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                    </Group>
                </Box>
            }
            // @ts-ignore
            size={"70%"}
        >
            <Group position={"apart"} spacing={"md"} noWrap={true}>
                <Select
                    placeholder="حدد الفريق"
                    withAsterisk
                    rightSection={<ChevronDown size={14} />}
                    rightSectionWidth={30}
                    styles={{ rightSection: { pointerEvents: 'none' } }}
                    data={allTeams}

                    value={team}
                    onChange={onChangeTeam}

                    searchable={true}
                    clearable={true}

                    style={{width: "100%"}}
                    nothingFound="لا يوجد فرق"
                />
                <Button
                    rightIcon={<Search size={16} strokeWidth="3" />}
                    sx={{ fontWeight: 500 }}
                    onClick={() => loadTeam(team)}
                    disabled={!team}
                    loading={loading}
                    color={"primary"}
                >
                    عرض
                </Button>

                {hasPermission("6")
                    ? <Button
                        rightIcon={<Printer size={16} strokeWidth="3" />}
                        sx={{ fontWeight: 500 }}
                        color={"primary"}
                        variant={"outline"}
                        disabled={!team}

                        component={"a"}
                        href={`https://print.omkooora.com/#/assembly/${team}/team`}
                        target={"_blank"}
                        onClick={(e) => { e.preventDefault(); if (team) openPrint(`/assembly/${team}/team`); }}
                    >
                        طباعة القائمة
                    </Button>
                    : null
                }
            </Group>

            <Box mt={20}>
                {!team ? (
                    <Text size="sm" color="dimmed" ta="center" py="xl">اختر الفريق لعرض أعضائه</Text>
                ) : loading ? (
                    <Center py="xl"><Loader size="sm" /></Center>
                ) : error && showingTeam ? (
                    <Text size="sm" color="red" ta="center" py="xl">تعذر تحميل البيانات، حاول مرة أخرى</Text>
                ) : (
                    <AssemblyTableTeam list={allAssembly}/>
                )}
            </Box>
        </Modal>
    );
};
