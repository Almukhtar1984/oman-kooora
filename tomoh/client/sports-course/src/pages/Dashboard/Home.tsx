import React, {useEffect, useState} from 'react'
import {Container, Group, useMantineTheme, Button, TextInput} from "@mantine/core";
import {IconPlus, IconSearch} from "@tabler/icons-react";
import useStore from "../../store/useStore";
import {searchSortedData, sortedData} from "../../lib/helpers/sort";
import {useAllLeagues} from "../../graphql";
import {
    AddLeague,
    UpdateLeague,
    DeleteLeague,
    AddParticipating,
    ShowLeague,
    AddMatch,
    ShowMatch,
    UpdateParticipating,
    AddMatchResult,
    DeleteMatch,
    UpdateMatch,
    UpdateMatchResult,
    AddMatchCard,
    AddManOfMatch,
    UpdateManOfMatch,
    AddParticipatingPlayers,
    ShowParticipatingPlayers,
    UpdateParticipatingPlayers,
    AddParticipatingTechnicalStaff,
    ShowParticipatingTechnicalStaff,
    AddScorerMatch,
    UpdateScorerMatch
} from "../../components/Modals";
import {LeaguesTabel} from "../../components/Tables";

export const Home = () => {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();

    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openShowGroupsModal, setOpenShowGroupsModal] = useState<boolean>(false);
    const [openShowMatchsModal, setOpenShowMatchsModal] = useState<boolean>(false);

    const [openAddParticipatingModal, setOpenAddParticipatingModal] = useState<boolean>(false);
    const [openEditParticipatingModal, setOpenEditParticipatingModal] = useState<boolean>(false);
    const [openAddMatchModal, setOpenAddMatchModal] = useState<boolean>(false);
    const [openEditMatchModal, setOpenEditMatchModal] = useState<boolean>(false);
    const [openDeleteMatchModal, setOpenDeleteMatchModal] = useState<boolean>(false);
    const [openAddMatchResultModal, setOpenAddMatchResultModal] = useState<boolean>(false);
    const [openEditMatchResultModal, setOpenEditMatchResultModal] = useState<boolean>(false);

    const [openAddMatchCardModal, setOpenAddMatchCardModal] = useState<boolean>(false);

    const [openAddManOfMatchModal, setOpenAddManOfMatchModal] = useState<boolean>(false);
    const [openEditManOfMatchModal, setOpenEditManOfMatchModal] = useState<boolean>(false);

    const [openAddScorerModal, setOpenAddScorerModal] = useState<boolean>(false);
    const [openUpdateScorerModal, setOpenUpdateScorerModal] = useState<boolean>(false);

    const [openAddParticipatingPlayersModal, setOpenAddParticipatingPlayersModal] = useState<boolean>(false);
    const [openEditParticipatingPlayersModal, setOpenEditParticipatingPlayersModal] = useState<boolean>(false);
    const [openShowParticipatingPlayersModal, setOpenShowParticipatingPlayersModal] = useState<boolean>(false);

    const [openAddParticipatingTechnicalStaffModal, setOpenAddParticipatingTechnicalStaffModal] = useState<boolean>(false);
    const [openShowParticipatingTechnicalStaffModal, setOpenShowParticipatingTechnicalStaffModal] = useState<boolean>(false);

    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedData, setSelectedData] = useState<any>({});
    const [selectedMatch, setSelectedMatch] = useState<any>({});
    const [selectedPlayer, setSelectedPlayer] = useState<any>("");

    const [allLeagues, setAllLeagues] = useState<object[]>([]);
    const [allLeaguesSorting, setAllLeaguesSorting] = useState<object[]>([]);

    const [getAllLeague, { data: dataAllLeagues }] = useAllLeagues();

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllLeague({
                variables: {idClub}
            })
        }
    }, [userData])

    useEffect(() => {
        if (dataAllLeagues && "allLeagues" in dataAllLeagues) {
            setAllLeagues([...dataAllLeagues.allLeagues])
        }
    }, [dataAllLeagues])

    useEffect(() => {
        if (allLeagues.length >= 0) {
            const filterAllLeagues = sortedData(allLeagues)

            setAllLeaguesSorting([...filterAllLeagues])
        }
    }, [allLeagues])

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        setSearchValue(value);

        const filterAllTeams = searchSortedData(allLeagues,['name'], value)
        setAllLeaguesSorting([...filterAllTeams])
    };

    return (
        <Container size={'lg'} >
            <Group justify={"space-between"} gap={"xs"} mt={20} mb={30}>
                <TextInput
                    value={searchValue}
                    rightSection={<IconSearch color={theme.colors.gray[4]} size={16} />}
                    placeholder="بحث"
                    onChange={handleSearchChange}
                />

                <Button
                    rightSection={<IconPlus size={15} />}
                    onClick={() => setOpenAddModal(true)}
                    color={"cyan"}
                >إضافة</Button>
            </Group>

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
            />

            <AddLeague title="إضافة دورة" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <UpdateLeague title="تعديل دورة" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteLeague title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)}/>

            <AddParticipating title="إضافة فرق" data={selectedData} opened={openAddParticipatingModal} onClose={() => setOpenAddParticipatingModal(false)}/>
            <UpdateParticipating title="تعديل فرق" data={selectedData} opened={openEditParticipatingModal} onClose={() => setOpenEditParticipatingModal(false)}/>
            
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
            />

            <AddMatch title="إضافة مباراة" data={selectedData} opened={openAddMatchModal} onClose={() => setOpenAddMatchModal(false)}/>
            <UpdateMatch title="تعديل المباراة" dataLeague={selectedData} data={selectedMatch} opened={openEditMatchModal} onClose={() => setOpenEditMatchModal(false)}/>
            <DeleteMatch title="" opened={openDeleteMatchModal} data={selectedMatch} onClose={() => setOpenDeleteMatchModal(false)}/>

            <AddMatchResult title="إضافة نتيجة مباراة" data={selectedMatch} opened={openAddMatchResultModal} onClose={() => setOpenAddMatchResultModal(false)}/>
            <UpdateMatchResult title="تعديل نتيجة المباراة" data={selectedMatch} opened={openEditMatchResultModal} onClose={() => setOpenEditMatchResultModal(false)}/>
            <AddMatchCard title="إضافة بطاقة" data={selectedMatch} opened={openAddMatchCardModal} onClose={() => setOpenAddMatchCardModal(false)}/>

            <AddManOfMatch title="إضافة رجل المباراة" data={selectedMatch} opened={openAddManOfMatchModal} onClose={() => setOpenAddManOfMatchModal(false)}/>
            <UpdateManOfMatch title="تعديل رجل المباراة" data={selectedMatch} opened={openEditManOfMatchModal} onClose={() => setOpenEditManOfMatchModal(false)}/>

            <AddParticipatingPlayers title="إضافة لاعبين للفريق" data={selectedData} opened={openAddParticipatingPlayersModal} onClose={() => setOpenAddParticipatingPlayersModal(false)}/>
            <UpdateParticipatingPlayers title="تعديل لاعبين للفريق" data={selectedPlayer} opened={openEditParticipatingPlayersModal} onClose={() => setOpenEditParticipatingPlayersModal(false)}/>
            <ShowParticipatingPlayers
                title="عرض لاعبين الفريق"
                data={selectedMatch}
                opened={openShowParticipatingPlayersModal}
                onClose={() => setOpenShowParticipatingPlayersModal(false)}

                setSelectedData={setSelectedPlayer}
                setOpenEditParticipatingPlayersModal={setOpenEditParticipatingPlayersModal}
            />


            <AddParticipatingTechnicalStaff title="إضافة جهاز فني" data={selectedData} opened={openAddParticipatingTechnicalStaffModal} onClose={() => setOpenAddParticipatingTechnicalStaffModal(false)}/>

            <ShowParticipatingTechnicalStaff
                title="عرض جهاز فني" 
                data={selectedMatch}
                opened={openShowParticipatingTechnicalStaffModal}
                onClose={() => setOpenShowParticipatingTechnicalStaffModal(false)}

                setSelectedData={setSelectedPlayer}
            />

            <AddScorerMatch
                title="إضافة هداف"
                data={selectedMatch}
                opened={openAddScorerModal}
                onClose={() => setOpenAddScorerModal(false)}
            />
            <UpdateScorerMatch
                title="تعديل الهدافين"
                data={selectedMatch}
                opened={openUpdateScorerModal}
                onClose={() => setOpenUpdateScorerModal(false)}
            />
        </Container>
    )
}