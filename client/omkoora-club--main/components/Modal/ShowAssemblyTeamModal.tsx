import {Box, Button, Group, Menu, Select, Text, TextInput, useMantineTheme} from "@mantine/core";
import {Check, ChevronDown, Printer, Search, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllBlog, AllPlayers, useAllAssembly, useAllAssemblyTeam, useAllTeams, useDeleteBlog} from "../../graphql";
import useStore from "../../store/useStore";
import {AssemblyTableTeam} from "../Tables";

type Props = {
    hasPermission: (permission: string) => boolean;
} & ModalProps;

export const ShowAssemblyTeamModal = ({hasPermission, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const [team, setTeam] = useState<string | null>(null);
    const [allTeams, setAllTeams] = useState<{label: string, value: string}[]>([]);
    const [allAssembly, setAllAssembly] = useState<object[]>([]);
    const [getAllTeams, { loading: loadingAllTeams, error: errorAllTeams, data: dataAllTeams }] = useAllTeams();
    const [getAllAssemblyTeam, { loading, error, data: dataAllAssemblyTeam }] = useAllAssemblyTeam();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTeams({
                variables: {idClub},
                fetchPolicy: "cache-and-network"
            })
        }
    }, [props.opened])

    useEffect(() => {
        if (dataAllTeams && "allTeam" in dataAllTeams && dataAllTeams?.allTeam?.length >= 0) {
            const allTeams: {label: string, value: string}[] = []

            dataAllTeams?.allTeam?.map((item: any) => {
                allTeams.push({label: item?.name, value: item?.id})
            })

            setAllTeams([...allTeams])
        }
    }, [dataAllTeams])

    useEffect(() => {
        if (dataAllAssemblyTeam && "allAssemblyTeam" in dataAllAssemblyTeam) {
            setAllAssembly([...dataAllAssemblyTeam.allAssemblyTeam])
        }
    }, [dataAllAssemblyTeam])

    const onSubmit = () => {
        getAllAssemblyTeam({
            variables: {idTeam: team},
            fetchPolicy: "network-only",
            onError: error => console.log(error)
        })
    };

    const closeModal = () => {
        props.onClose();
        setTeam(null)
    };

    // @ts-ignore
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
                    onChange={setTeam}

                    searchable={true}
                    clearable={true}

                    style={{width: "100%"}}
                    nothingFound="لا يوجد فرق"
                />
                <Button
                    rightIcon={<Search size={16} strokeWidth="3" />}
                    sx={{ fontWeight: 500 }}
                    onClick={onSubmit}
                    color={"primary"}
                >
                    عرض
                </Button>

                {hasPermission("6")
                    ? <Button
                        rightIcon={<Printer size={16} strokeWidth="3" />}
                        sx={{ fontWeight: 500 }}
                        onClick={onSubmit}
                        color={"primary"}
                        variant={"outline"}

                        component={"a"}
                        href={`https://print.omkooora.com/#/assembly/${team}/team`}
                        target={"_blank"}
                    >
                        طباعة القائمة
                    </Button>
                    : null
                }
            </Group>

            <Box mt={20}>
                <AssemblyTableTeam list={allAssembly}/>
            </Box>
        </Modal>
    );
};