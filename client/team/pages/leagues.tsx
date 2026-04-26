
import { Box, Container, Group, Stack, TextInput, Title,useMantineTheme } from "@mantine/core";
import { Lock, Search } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { searchSortedData, sortedData } from "../lib/helpers/sort";
import { useAllLeaguesTeam } from "../graphql";
import useStore from "../store/useStore";
import { LeaguesTabel } from "../components/Tables";
import {
    UpdateLeague,
    AddParticipating,
    ShowLeague,
    ShowMatch,
    AddParticipatingPlayers,
    ShowParticipatingPlayers,
    UpdateParticipatingPlayers,
    UpdateParticipating,
    AddParticipatingTechnicalStaff,
    ShowParticipatingTechnicalStaff,
    TeamParticipationAccptedModal,
    AddParticipatingPlayersMatch,
    ShowPlayerListModal
} from "../components/Modal";

export default function Leagues() {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openShowGroupsModal, setOpenShowGroupsModal] = useState(false);
    const [openShowMatchsModal, setOpenShowMatchsModal] = useState(false);
    const [openAddParticipatingModal, setOpenAddParticipatingModal] = useState(false);
    const [openEditParticipatingModal, setOpenEditParticipatingModal] = useState(false);
    const [openAddMatchModal, setOpenAddMatchModal] = useState(false);
    const [openEditMatchModal, setOpenEditMatchModal] = useState(false);
    const [openDeleteMatchModal, setOpenDeleteMatchModal] = useState(false);
    const [openAddMatchResultModal, setOpenAddMatchResultModal] = useState(false);
    const [openEditMatchResultModal, setOpenEditMatchResultModal] = useState(false);
    const [openAddMatchCardModal, setOpenAddMatchCardModal] = useState(false);
    const [openAddManOfMatchModal, setOpenAddManOfMatchModal] = useState(false);
    const [openEditManOfMatchModal, setOpenEditManOfMatchModal] = useState(false);
    const [openAddScorerModal, setOpenAddScorerModal] = useState(false);
    const [openUpdateScorerModal, setOpenUpdateScorerModal] = useState(false);
    const [openTeamParticipationAccptedModal,setOpenTeamParticipationAccptedModal ] = useState(false) 
    const [SelectedParticipationTeam,setSelectedParticipationTeam] = useState<any>([]);
    const [openAddParticipatingPlayersModal, setOpenAddParticipatingPlayersModal] = useState(false);
    const [openEditParticipatingPlayersModal, setOpenEditParticipatingPlayersModal] = useState(false);
    const [openShowParticipatingPlayersModal, setOpenShowParticipatingPlayersModal] = useState(false);
    const [openAddParticipatingTechnicalStaffModal, setOpenAddParticipatingTechnicalStaffModal] = useState(false);
    const [openShowParticipatingTechnicalStaffModal, setOpenShowParticipatingTechnicalStaffModal] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [selectedData, setSelectedData] = useState({});
    const [selectedMatch, setSelectedMatch] = useState({});
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [allLeagues, setAllLeagues] = useState<any>([]);
    const [allLeaguesSorting, setAllLeaguesSorting] = useState<any>([]);
    const [role, setRole] = useState<any>(null);
    const [permissions, setPermissions] = useState([]);
    const [openAddParticipatingPlayersMatch, setOpenAddParticipatingPlayersMatch] = useState<boolean>(false);
    const [openShowPlayerListModal,setopenShowPlayerListModal] = useState<boolean>(false);

    const [getAllLeagues, { loading, error, data: dataAllLeagues }] = useAllLeaguesTeam();

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData.person.member.team.id;
            getAllLeagues({
                variables: { idTeam }
            });
        }

        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2");
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            setPermissions(userData.permission.players.split(","));
        }
    }, [userData, getAllLeagues]);

    useEffect(() => {
        
        if (dataAllLeagues && "allLeaguesTeam" in dataAllLeagues) {
            setAllLeagues([...dataAllLeagues.allLeaguesTeam]);
        }
        console.log("dataAllLeagues:",dataAllLeagues)
    }, [dataAllLeagues]);

    useEffect(() => {
        console.log("allLeagues:",allLeagues)
        if (allLeagues.length >= 0) {
            const filterAllLeagues = sortedData(allLeagues);
            setAllLeaguesSorting([...filterAllLeagues]);
        }
    }, [allLeagues]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);
    
    
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);
        const filterAllLeagues = searchSortedData(allLeagues, ['name'], value);
        setAllLeaguesSorting([...filterAllLeagues]);
    };

    const hasPermission = (permission: string) => {
        if (role && role === "1") {
            return true
        } else {
            if (permissions && permissions.length > 0) {
                const permissionChacked = permissions.filter((item: string) => item === permission)
                return permissionChacked.length > 0
            } else return false
        }
    }

    if (!hasPermission("1")) {
        return (
            <Box>
                <Head>
                    <title>طموح</title>
                </Head>
                <Container size={"xl"}>
                    <Stack justify={"center"} align={"center"} h={"calc(100vh - 200px)"}>
                        <Lock color={theme.colors.gray[4]} size={100} strokeWidth={1.5} />
                        <Title size={"h5"} color={theme.colors.gray[5]} >ليس لديك الاذن بإكتشاف محتوى الصفحة</Title>
                    </Stack>
                </Container>
            </Box>
        );
    }


    return (
        <Box >
            <Head>
                <title>طموح</title>
            </Head>
            <Container size={"xl"} style={{maxWidth:"1550px"}}>
                <Box mb={30} mt={"20px"}>
                    <Group position={"apart"}>
                        <TextInput
                            value={searchValue}
                            icon={<Search color={theme.colors.gray[4]} size={16} />}
                            placeholder="بحث"
                            onChange={handleSearchChange}
                        />
                    </Group>
                </Box>

                <LeaguesTabel
                    data={allLeaguesSorting}
                    setSelectedData={setSelectedData}
                    setOpenShowGroupsModal={setOpenShowGroupsModal}
                    setOpenShowMatchsModal={setOpenShowMatchsModal}
                    setOpenEditModal={setOpenEditModal}
                    setOpenDeleteModal={setOpenDeleteModal}
                    setOpenAddParticipatingModal={setOpenAddParticipatingModal}
                    setOpenEditParticipatingModal={setOpenEditParticipatingModal}
                    setOpenAddMatchModal={setOpenAddMatchModal}
                    setOpenAddParticipatingPlayersModal={setOpenAddParticipatingPlayersModal}
                    setOpenAddParticipatingTechnicalStaffModal={setOpenAddParticipatingTechnicalStaffModal}
                    idTeam={userData?.person?.member?.team?.id}
                    setOpenTeamParticipationAccptedModal = {setOpenTeamParticipationAccptedModal}
                    setSelectedParticipationTeam  ={setSelectedParticipationTeam}
                    
                />
            </Container>

            {/* Portal Components */}
            
            <UpdateLeague title="تعديل دورة" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)} />

            
            <UpdateParticipating title="تعديل فرق" data={selectedData} opened={openEditParticipatingModal} onClose={() => setOpenEditParticipatingModal(false)} />
            <ShowLeague
                title="مجموعات الدورة"
                opened={openShowGroupsModal}
                data={selectedData}
                onClose={() => setOpenShowGroupsModal(false)}
                setSelectedData={setSelectedMatch}
                setOpenShowParticipatingPlayersModal={setOpenShowParticipatingPlayersModal}
                setOpenShowParticipatingTechnicalStaffModal={setOpenShowParticipatingTechnicalStaffModal}
            />
            <ShowMatch
                title="المباريات"
                opened={openShowMatchsModal}
                data={selectedData}
                onClose={() => setOpenShowMatchsModal(false)}
                setSelectedData={setSelectedMatch}
                setOpenEditMatchModal={setOpenEditMatchModal}
                setOpenDeleteMatchModal={setOpenDeleteMatchModal}
                setOpenAddMatchResultModal={setOpenAddMatchResultModal}
                setOpenEditMatchResultModal={setOpenEditMatchResultModal}
                setOpenAddMatchCardModal={setOpenAddMatchCardModal}
                setOpenAddManOfMatchModal={setOpenAddManOfMatchModal}
                setOpenEditManOfMatchModal={setOpenEditManOfMatchModal}
                setOpenAddScorerModal={setOpenAddScorerModal}
                setOpenUpdateScorerModal={setOpenUpdateScorerModal}
                setOpenAddParticipatingPlayersMatch={setOpenAddParticipatingPlayersMatch}
                setopenShowPlayerListModal={setopenShowPlayerListModal}

            />
            <AddParticipatingPlayers title="إضافة لاعبين للفريق" data={selectedData} opened={openAddParticipatingPlayersModal} onClose={() => setOpenAddParticipatingPlayersModal(false)} />
            <UpdateParticipatingPlayers title="تعديل لاعبين للفريق" data={selectedPlayer} opened={openEditParticipatingPlayersModal} onClose={() => setOpenEditParticipatingPlayersModal(false)} />
            <ShowParticipatingPlayers
                title="عرض لاعبين الفريق"
                data={selectedMatch}
                opened={openShowParticipatingPlayersModal}
                onClose={() => setOpenShowParticipatingPlayersModal(false)}
                setSelectedData={setSelectedPlayer}
                setOpenEditParticipatingPlayersModal={setOpenEditParticipatingPlayersModal}
            />
            <AddParticipatingPlayersMatch title="إضافة التشكيلة" dataMatch={selectedMatch} data={selectedData} opened={openAddParticipatingPlayersMatch} onClose={() => setOpenAddParticipatingPlayersMatch(false)} setOpenShowMatchsModal={setOpenShowMatchsModal}/>
        
            <AddParticipatingTechnicalStaff title="إضافة جهاز فني" data={selectedData} opened={openAddParticipatingTechnicalStaffModal} onClose={() => setOpenAddParticipatingTechnicalStaffModal(false)} />
            <ShowParticipatingTechnicalStaff
                title="عرض جهاز فني"
                data={selectedMatch}
                opened={openShowParticipatingTechnicalStaffModal}
                onClose={() => setOpenShowParticipatingTechnicalStaffModal(false)}
                setSelectedData={setSelectedPlayer}
            />
            
            <TeamParticipationAccptedModal title="الانضمام الى البطولة" opened={openTeamParticipationAccptedModal} onClose={() => setOpenTeamParticipationAccptedModal(false) } SelectedParticipationTeam={SelectedParticipationTeam}/>
            <ShowPlayerListModal title="قائمة اللاعبين" dataMatch={selectedMatch}  opened={openShowPlayerListModal} onClose={() => setopenShowPlayerListModal(false)}/>
        </Box>
    );
}
