import {
    Box,
    Button,
    Center,
    Container,
    Group,
    Pagination,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
    useMantineTheme,
} from "@mantine/core";
import { IconPlus, IconSearch, IconTrophy } from "@tabler/icons-react";
import React, { useEffect, useMemo, useState } from 'react';
import {
AddLeague,AddManOfMatch,AddMatch,AddMatchCard,AddMatchResult,AddParticipating,AddParticipatingPlayers,AddParticipatingTechnicalStaff,AddScorerMatch,DeleteLeague,DeleteMatch,ShowLeague,ShowMatch,ShowParticipatingPlayers,ShowParticipatingTechnicalStaff,UpdateLeague,UpdateManOfMatch,UpdateMatch,
UpdateMatchResult,UpdateParticipating,UpdateParticipatingPlayers,UpdateScorerMatch
} from "../../components/Modals";
import { LeagueCard } from "../../components/Cards";
import { useAllLeagues } from "../../graphql";
import { searchSortedData,sortedData } from "../../lib/helpers/sort";
import useStore from "../../store/useStore";

const PAGE_SIZE = 9;

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
    const [selectedDataId, setSelectedDataId] = useState<string | null>(null);
    const [selectedDataFallback, setSelectedDataFallback] = useState<any>({});
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<any>("");

    const [allLeagues, setAllLeagues] = useState<any[]>([]);
    const [allLeaguesSorting, setAllLeaguesSorting] = useState<any[]>([]);
    const [activePage, setActivePage] = useState<number>(1);

    const idClub = userData?.person?.clubManagement?.club?.id;
    const { data: dataAllLeagues } = useAllLeagues({
        variables: { idClub },
        skip: !idClub,
        fetchPolicy: "cache-and-network",
        notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        if (dataAllLeagues && "allLeagues" in dataAllLeagues) {
            setAllLeagues([...dataAllLeagues.allLeagues])
        }
    }, [dataAllLeagues])

    useEffect(() => {
        const filterAllLeagues = sortedData(allLeagues)
        if (searchValue) {
            setAllLeaguesSorting(searchSortedData(filterAllLeagues, ['name'], searchValue))
        } else {
            setAllLeaguesSorting([...filterAllLeagues])
        }
    }, [allLeagues, searchValue])

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.currentTarget.value);
        setActivePage(1)
    };

    // Live-derived selections: when allLeagues is refetched after a mutation,
    // the selected league/match references stay current automatically.
    const selectedData = useMemo(() => {
        if (!selectedDataId) return selectedDataFallback;
        return allLeagues.find((l: any) => l.id === selectedDataId) || selectedDataFallback;
    }, [allLeagues, selectedDataId, selectedDataFallback]);

    const selectedMatch = useMemo(() => {
        if (!selectedMatchId || !selectedData?.matchs) return {};
        return selectedData.matchs.find((m: any) => m.id === selectedMatchId) || {};
    }, [selectedData, selectedMatchId]);

    const setSelectedData = (rowOrId: any) => {
        if (rowOrId && typeof rowOrId === "object" && rowOrId.id) {
            setSelectedDataId(rowOrId.id);
            setSelectedDataFallback(rowOrId);
        } else if (typeof rowOrId === "string") {
            // legacy callers pass row.id directly (e.g., DeleteLeague modal)
            setSelectedDataId(rowOrId);
        } else {
            setSelectedDataId(null);
            setSelectedDataFallback({});
        }
    };

    const setSelectedMatch = (rowOrId: any) => {
        if (rowOrId && typeof rowOrId === "object" && rowOrId.id) {
            setSelectedMatchId(rowOrId.id);
        } else if (typeof rowOrId === "string") {
            setSelectedMatchId(rowOrId);
        } else {
            setSelectedMatchId(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(allLeaguesSorting.length / PAGE_SIZE));
    const pageData = useMemo(() => {
        const start = (activePage - 1) * PAGE_SIZE;
        return allLeaguesSorting.slice(start, start + PAGE_SIZE);
    }, [allLeaguesSorting, activePage]);

    // unified handlers
    const handleShowMatches = (row: any) => { setSelectedData(row); setOpenShowMatchsModal(true); };
    const handleShowGroups = (row: any) => { setSelectedData(row); setOpenShowGroupsModal(true); };
    const handleAddMatch = (row: any) => { setSelectedData(row); setOpenAddMatchModal(true); };
    const handleAddParticipating = (row: any) => { setSelectedData(row); setOpenAddParticipatingModal(true); };
    const handleEditParticipating = (row: any) => { setSelectedData(row); setOpenEditParticipatingModal(true); };
    const handleAddParticipatingPlayers = (row: any) => { setSelectedData(row); setOpenAddParticipatingPlayersModal(true); };
    const handleAddParticipatingTechnicalStaff = (row: any) => { setSelectedData(row); setOpenAddParticipatingTechnicalStaffModal(true); };
    const handleEdit = (row: any) => { setSelectedData(row); setOpenEditModal(true); };
    const handleDelete = (row: any) => { setSelectedData(row.id); setOpenDeleteModal(true); };

    return (
        <Container size={"lg"}>
            {/* Page header */}
            <Paper
                radius="lg"
                p="md"
                mt={20}
                mb={20}
                style={{
                    background:
                        "linear-gradient(135deg, var(--mantine-color-cyan-7) 0%, var(--mantine-color-cyan-5) 100%)",
                    color: "white",
                }}
            >
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap={12} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Box
                            style={{
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: 12,
                                padding: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <IconTrophy size={26} />
                        </Box>
                        <Box style={{ minWidth: 0 }}>
                            <Title order={3} c="white" style={{ lineHeight: 1.1 }}>
                                الدورات
                            </Title>
                            <Text size="sm" opacity={0.9}>
                                إدارة دورات وبطولات النادي ({allLeaguesSorting.length})
                            </Text>
                        </Box>
                    </Group>

                    <Button
                        rightSection={<IconPlus size={16} />}
                        onClick={() => setOpenAddModal(true)}
                        variant="white"
                        color="cyan"
                        radius="md"
                    >
                        إضافة دورة
                    </Button>
                </Group>
            </Paper>

            {/* Search */}
            <Group justify="flex-end" mb="md">
                <TextInput
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="بحث باسم الدورة"
                    leftSection={<IconSearch size={16} color={theme.colors.gray[5]} />}
                    radius="md"
                    style={{ width: 280 }}
                />
            </Group>

            {/* Grid */}
            {pageData.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" verticalSpacing="md">
                    {pageData.map((row: any) => (
                        <LeagueCard
                            key={row.id}
                            data={row}
                            onShowMatches={handleShowMatches}
                            onShowGroups={handleShowGroups}
                            onAddMatch={handleAddMatch}
                            onAddParticipating={handleAddParticipating}
                            onEditParticipating={handleEditParticipating}
                            onAddParticipatingPlayers={handleAddParticipatingPlayers}
                            onAddParticipatingTechnicalStaff={handleAddParticipatingTechnicalStaff}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </SimpleGrid>
            ) : (
                <Paper radius="lg" withBorder p="xl" mt="md">
                    <Center>
                        <Stack align="center" gap={6}>
                            <IconTrophy size={48} color={theme.colors.gray[4]} />
                            <Text fw={600} c="gray.6">
                                {searchValue ? "لا توجد نتائج للبحث" : "لا توجد دورات بعد"}
                            </Text>
                            <Text size="sm" c="gray.5">
                                {searchValue
                                    ? "جرّب اسم آخر أو امسح حقل البحث."
                                    : "ابدأ بإضافة دورة جديدة من الزر أعلاه."}
                            </Text>
                        </Stack>
                    </Center>
                </Paper>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Group justify="center" mt="xl">
                    <Pagination
                        total={totalPages}
                        value={activePage}
                        onChange={setActivePage}
                        radius="md"
                        color="cyan"
                    />
                </Group>
            )}

            <AddLeague title="إضافة دورة" opened={openAddModal} onClose={() => setOpenAddModal(false)}/>
            <UpdateLeague title="تعديل دورة" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)}/>
            <DeleteLeague title="" opened={openDeleteModal} data={selectedData?.id || selectedDataId} onClose={() => setOpenDeleteModal(false)}/>

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
            <DeleteMatch title="" opened={openDeleteMatchModal} data={selectedMatch?.id || selectedMatchId} onClose={() => setOpenDeleteMatchModal(false)}/>

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
