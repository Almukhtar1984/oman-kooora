import {
    Avatar, Badge, Box, Card, Col, Container, Divider, Flex, Grid, Group,
    Loader, MantineTheme, Pagination, RingProgress, SimpleGrid, Skeleton, Stack, Tabs, Text, Title, Tooltip,
    TextInput, Textarea, Button, Modal, ActionIcon, Menu, Select, FileInput, Image
} from "@mantine/core";
import { useTheme } from "@emotion/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTeamDetails, useAllPlayers, useAllEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useAllMembers, useAllTechnicals, useAllAssembly } from "../../graphql";
import {
    Users, UserCheck, Clock, Phone, Shield, Activity,
    ArrowLeft, Id, CalendarStats, Plus, LayoutDashboard, CalendarEvent, Check, X,
    AlertCircle, CalendarTime, ShieldCheck, Article, Printer
} from "tabler-icons-react";
import { GiAbstract042 } from "react-icons/gi";
import { GradientStatCard, OutlineStatCard } from "../../components/Stats/ModernStatCards";
import { useQuery } from "@apollo/client";
import useStore from "../../store/useStore";
import { getImageUrl } from "../../lib/helpers/image";
import { StatCard } from "../../components/TeamDetails/StatCard";
import { EventList } from "../../components/TeamDetails/EventList";
import { EventForm } from "../../components/TeamDetails/EventForm";
import { EventCarouselModal } from "../../components/TeamDetails/EventCarouselModal";
import { MemberSection } from "../../components/TeamDetails/MemberSection";
import {
    UpdatePlayerModal, UpdateTechnicalModal, UpdateMemberModal, UpdateAssemblyModal,
    DeletePlayersModal, DeleteTechnicalModal, DeleteMembersModal, DeleteAssemblyModal,
    ChangeClassificationModal, AddPlayerModal, AddTechnicalModal, AddMembersModal, AddAssemblyModal, PrintModal,
    VerifyIdentityModal, ShowAttachments, AddAttachmentPlayerModal, DeleteAttachmentPlayerModal, ShowStatPlayer,
    PlayersTransferModal, PlayersLoanModal, AddSanctionModal, UpdateSanction, ChangeStatusPlayersModal,
    ChangeStatusTechnicalsModal, ChangeStatusMembersModal, AddImagePlayersModal, RenewAssemblyModal, FreePlayerModal
} from "../../components/Modal";
import { SearchAssemblyModal } from "../../components/Modal/SearchAssemblyModal";

dayjs.extend(relativeTime);

// Modular components imported from ../../components/TeamDetails/

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function TeamDetailsPage() {
    const router = useRouter();
    const { id } = router.query;
    const theme = useTheme() as MantineTheme;

    const [getTeamDetails, { data, loading }] = useTeamDetails();
    const [getAllPlayers, { data: playersData, loading: playersLoading }] = useAllPlayers();
    const [getAllEvents, { data: eventsData, loading: eventsLoading }] = useAllEvents();
    const [getAllMembers, { data: membersData, loading: membersLoading }] = useAllMembers();
    const [getAllTechnical, { data: techData, loading: techLoading }] = useAllTechnicals();
    const [getAllAssembly, { data: assemblyData, loading: assemblyLoading }] = useAllAssembly();

    const [activeTab, setActiveTab] = useState<string | null>("overview");
    const [memberTab, setMemberTab] = useState<string | null>("players");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [eventModalOpened, setEventModalOpened] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [viewEvent, setViewEvent] = useState<any>(null);
    const [carouselOpened, setCarouselOpened] = useState(false);

    // Member Action States - separate per modal to avoid cross-modal side effects
    const [editData, setEditData] = useState<any>(null);
    const [deleteData, setDeleteData] = useState<any>(null);
    const [classificationData, setClassificationData] = useState<any>(null);
    const [openAddPlayer, setOpenAddPlayer] = useState(false);
    const [openAddTechnical, setOpenAddTechnical] = useState(false);
    const [openAddMember, setOpenAddMember] = useState(false);
    const [openAddAssembly, setOpenAddAssembly] = useState(false);
    const [openSearchAssembly, setOpenSearchAssembly] = useState(false);
    const [openPrint, setOpenPrint] = useState(false);

    const [openEditPlayer, setOpenEditPlayer] = useState(false);
    const [openEditTechnical, setOpenEditTechnical] = useState(false);
    const [openEditMember, setOpenEditMember] = useState(false);
    const [openDeletePlayer, setOpenDeletePlayer] = useState(false);
    const [openDeleteTechnical, setOpenDeleteTechnical] = useState(false);
    const [openDeleteMember, setOpenDeleteMember] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openChangeClassification, setOpenChangeClassification] = useState(false);
    
    // New Action States
    const [openChangeStatus, setOpenChangeStatus] = useState(false);
    const [openVerifyIdentity, setOpenVerifyIdentity] = useState(false);
    const [openShowAttachments, setOpenShowAttachments] = useState(false);
    const [openAddAttachment, setOpenAddAttachment] = useState(false);
    const [openDeleteAttachment, setOpenDeleteAttachment] = useState(false);
    const [openTransfer, setOpenTransfer] = useState(false);
    const [openLoan, setOpenLoan] = useState(false);
    const [openAddSanction, setOpenAddSanction] = useState(false);
    const [openUpdateSanction, setOpenUpdateSanction] = useState(false);
    const [openShowStat, setOpenShowStat] = useState(false);
    const [openShowDetails, setOpenShowDetails] = useState(false);
    const [openAddImage, setOpenAddImage] = useState(false);
    const [openRenewModal, setOpenRenewModal] = useState(false);
    const [openFreePlayer, setOpenFreePlayer] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
    const [newStatus, setNewStatus] = useState("");
    const [classificationFrom, setClassificationFrom] = useState<"player" | "technical" | "member">("technical");

    const handleEdit = (item: any, type: "player" | "technical" | "member" | "assembly") => {
        setEditData(item);
        if (type === 'player') setOpenEditPlayer(true);
        if (type === 'technical') setOpenEditTechnical(true);
        if (type === 'member') setOpenEditMember(true);
        if (type === 'assembly') setOpenEditModal(true);
    };

    const handleDelete = (memberId: string, type: "player" | "technical" | "member" | "assembly") => {
        setDeleteData(memberId);
        if (type === 'player') setOpenDeletePlayer(true);
        if (type === 'technical') setOpenDeleteTechnical(true);
        if (type === 'member') setOpenDeleteMember(true);
        if (type === 'assembly') setOpenDeleteModal(true);
    };

    const handleChangeClassification = (item: any, type: "player" | "technical" | "member") => {
        setClassificationData(item);
        setClassificationFrom(type);
        setOpenChangeClassification(true);
    };

    const handleChangeStatus = (item: any, status: string, type: "player" | "technical" | "member") => {
        setEditData(item);
        setNewStatus(status);
        setOpenChangeStatus(true);
    };

    const handleVerifyIdentity = (item: any) => {
        setEditData(item);
        setOpenVerifyIdentity(true);
    };

    const handleShowAttachments = (item: any) => {
        setEditData(item);
        setOpenShowAttachments(true);
    };

    const handleAddAttachment = (id: string) => {
        setDeleteData(id);
        setOpenAddAttachment(true);
    };

    const handleTransfer = (item: any) => {
        setEditData(item);
        setOpenTransfer(true);
    };

    const handleLoan = (item: any) => {
        setEditData(item);
        setOpenLoan(true);
    };

    const handleAddSanction = (item: any) => {
        setEditData(item);
        setOpenAddSanction(true);
    };

    const handleUpdateSanction = (item: any) => {
        setEditData(item);
        setOpenUpdateSanction(true);
    };

    const handleShowStat = (item: any) => {
        setEditData(item?.id || item);
        setOpenShowStat(true);
    };

    const handleShowDetails = (item: any) => {
        setEditData(item);
        setOpenShowDetails(true);
    };

    const handleAddImage = (id: string) => {
        setDeleteData(id);
        setOpenAddImage(true);
    };

    const handleFreePlayer = (id: string) => {
        setEditData(id);
        setOpenFreePlayer(true);
    };

    const refetchAll = () => {
        if (clubId) {
            getAllPlayers({ variables: { idClub: clubId }, fetchPolicy: 'network-only' });
            getAllMembers({ variables: { idClub: clubId }, fetchPolicy: 'network-only' });
            getAllTechnical({ variables: { idClub: clubId }, fetchPolicy: 'network-only' });
            getAllAssembly({ variables: { idClub: clubId }, fetchPolicy: 'network-only' });
        }
    };

    const [createEvent] = useCreateEvent();
    const [updateEvent] = useUpdateEvent();
    const [deleteEvent] = useDeleteEvent();

    const userData = useStore((state: any) => state.userData);
    const clubId = userData?.person?.clubManagement?.club?.id;

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    useEffect(() => {
        if (id) {
            getTeamDetails({ variables: { id } });
            getAllEvents({ variables: { idTeam: id } });
        }
    }, [id]);

    useEffect(() => {
        if (clubId) {
            getAllPlayers({ variables: { idClub: clubId } });
            getAllMembers({ variables: { idClub: clubId } });
            getAllTechnical({ variables: { idClub: clubId } });
            getAllAssembly({ variables: { idClub: clubId } });
        }
    }, [clubId]);

    const team = data?.team;
    const stats = data?.statisticsTeam;

    return (
        <Box dir="rtl">
            <Head>
                <title>{team?.name ?? "تفاصيل الفريق"}</title>
            </Head>

            {/* ─── Hero Banner ─── */}
            <Box
                sx={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #1e5fa8 60%, #2563eb 100%)",
                    position: "relative",
                    overflow: "hidden",
                    paddingBottom: 60,
                }}
                pt={40}
                pb={80}
                px="xl"
            >
                <Flex
                    align="center"
                    gap={6}
                    mb={24}
                    sx={{ cursor: "pointer", width: "fit-content", opacity: 0.85, "&:hover": { opacity: 1 } }}
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={18} color="white" />
                    <Text size="sm" color="white" weight={500}>رجوع</Text>
                </Flex>

                <Container size="xl">
                    {loading ? (
                        <Flex align="center" gap="xl">
                            <Skeleton circle width={100} height={100} />
                            <Box>
                                <Skeleton width={200} height={24} mb={10} />
                                <Skeleton width={120} height={16} />
                            </Box>
                        </Flex>
                    ) : (
                        <Flex align="center" gap="xl" wrap="wrap">
                            <Avatar
                                src={getImageUrl(team?.logo as string)}
                                size={100}
                                radius={100}
                                styles={{
                                    root: {
                                        border: "4px solid rgba(255,255,255,0.4)",
                                        background: "white",
                                    }
                                }}
                            />
                            <Box>
                                <Title order={1} color="white" mb={4}>{team?.name}</Title>
                                <Group spacing={8}>
                                    <Badge color={team?.account_status ? "teal" : "red"} variant="filled" radius="sm">
                                        {team?.account_status ? "نشط" : "متوقف"}
                                    </Badge>
                                    {team?.activities && <Badge color="blue" variant="light" radius="sm">{team.activities}</Badge>}
                                    {team?.category && <Badge color="orange" variant="light" radius="sm">{team.category}</Badge>}
                                </Group>
                                {team?.phone && (
                                    <Flex align="center" gap={4} mt={8}>
                                        <Phone size={14} color="rgba(255,255,255,0.7)" />
                                        <Text size="sm" color="rgba(255,255,255,0.8)">{team.phone}</Text>
                                    </Flex>
                                )}
                                <Text mt={4} size="xs" color="rgba(255,255,255,0.6)">
                                    تأسس {dayjs(team?.createdAt).locale("ar").fromNow()}
                                </Text>
                            </Box>
                        </Flex>
                    )}
                </Container>
            </Box>

            {/* ─── Content ─── */}
            <Container size="xl" sx={{ marginTop: -40, position: "relative", zIndex: 1 }}>
                <Tabs value={activeTab} onTabChange={setActiveTab} variant="pills" radius="md"
                    styles={(t) => ({
                        tabsList: {
                            backgroundColor: "white",
                            padding: 6,
                            borderRadius: t.radius.md,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            marginBottom: 24,
                            gap: 10
                        },
                        tab: {
                            fontWeight: 700,
                            fontSize: t.fontSizes.md,
                            padding: "16px 32px",
                            border: "none",
                            transition: 'all 0.2s',
                            "&[data-active]": {
                                backgroundColor: "#1E3A8A",
                                color: "white",
                                transform: 'scale(1.05)'
                            }
                        }
                    })}
                >
                    <Tabs.List>
                        <Tabs.Tab value="overview" icon={<LayoutDashboard size={18} />}>نظرة عامة</Tabs.Tab>
                        <Tabs.Tab value="members" icon={<Users size={18} />}>الأعضاء</Tabs.Tab>
                        <Tabs.Tab value="events" icon={<CalendarEvent size={18} />}>الفعاليات</Tabs.Tab>
                    </Tabs.List>

                    {/* ─── Overview Tab ─── */}
                    <Tabs.Panel value="overview">
                        <Box py="lg">
                            <Text size="xs" color="dimmed" fw={600} mb={12} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                اللاعبون
                            </Text>
                            <Grid mb={24} gutter="md">
                                <Col span={12} xs={6} md={3}>
                                    <GradientStatCard
                                        label="إجمالي اللاعبين"
                                        value={stats?.numberPlayers ?? 0}
                                        gradientFrom={theme.colors.blue[5]}
                                        gradientTo={theme.colors.blue[7]}
                                        accentColor={theme.colors.blue[6]}
                                        icon={<Users size={22} color="white" />}
                                    />
                                </Col>
                                <Col span={12} xs={6} md={3}>
                                    <GradientStatCard
                                        label="قيد الانتظار"
                                        value={stats?.numberPlayersWaiting ?? 0}
                                        gradientFrom={theme.colors.orange[4]}
                                        gradientTo={theme.colors.orange[6]}
                                        accentColor={theme.colors.orange[6]}
                                        icon={<CalendarTime size={22} color="white" />}
                                    />
                                </Col>
                                <Col span={12} xs={6} md={3}>
                                    <GradientStatCard
                                        label="لاعبون مقبولون"
                                        value={stats?.numberPlayersAccepted ?? 0}
                                        gradientFrom={theme.colors.green[5]}
                                        gradientTo={theme.colors.green[7]}
                                        accentColor={theme.colors.green[6]}
                                        icon={<ShieldCheck size={22} color="white" />}
                                    />
                                </Col>
                                <Col span={12} xs={6} md={3}>
                                    <GradientStatCard
                                        label="لاعبون مرفوضون"
                                        value={stats?.numberPlayersRejected ?? 0}
                                        gradientFrom={theme.colors.red[4]}
                                        gradientTo={theme.colors.red[6]}
                                        accentColor={theme.colors.red[6]}
                                        icon={<AlertCircle size={22} color="white" />}
                                    />
                                </Col>
                            </Grid>

                            <Text size="xs" color="dimmed" fw={600} mb={12} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                الهيكل والمرافق
                            </Text>
                            <Grid gutter="md">
                                <Col span={12} xs={6} md={4}>
                                    <OutlineStatCard
                                        label="مجلس الإدارة"
                                        value={stats?.numberMembers ?? 0}
                                        subLabel="عضو"
                                        accentColor={theme.colors.blue[7]}
                                        borderColor={theme.colors.blue[2]}
                                        iconBg={theme.colors.blue[0]}
                                        icon={<Article size={28} color={theme.colors.blue[6]} />}
                                    />
                                </Col>
                                <Col span={12} xs={6} md={4}>
                                    <OutlineStatCard
                                        label="الجهاز الفني"
                                        value={stats?.numberTechnicales ?? 0}
                                        subLabel="موظف"
                                        accentColor={theme.colors.green[7]}
                                        borderColor={theme.colors.green[2]}
                                        iconBg={theme.colors.green[0]}
                                        icon={<Users size={28} color={theme.colors.green[6]} />}
                                    />
                                </Col>
                                <Col span={12} xs={6} md={4}>
                                    <OutlineStatCard
                                        label="الملاعب"
                                        value={stats?.numberStadiums ?? 0}
                                        subLabel="مرفق"
                                        accentColor={theme.colors.cyan[7]}
                                        borderColor={theme.colors.cyan[2]}
                                        iconBg={theme.colors.cyan[0]}
                                        icon={<GiAbstract042 size={28} color={theme.colors.cyan[6]} />}
                                    />
                                </Col>
                            </Grid>

                            <Divider my={30} />
                            
                        </Box>
                        <Grid gutter="lg">
                            <Col span={12}>
                                <Card shadow="none" p="xl" radius="md" withBorder sx={{ borderColor: theme.colors.gray[2] }}>
                                    <Text size="md" weight={700} color="#1E3A8A" mb="md">معلومات الفريق</Text>
                                    <Stack spacing={0}>
                                        {[
                                            { label: "اسم الفريق", value: team?.name, icon: Shield },
                                            { label: "النشاط", value: team?.activities, icon: Activity },
                                            { label: "هاتف", value: team?.phone, icon: Phone },
                                            {
                                                label: "مدير الفريق",
                                                // Prefer the live admin (User → Person) chain so the row
                                                // reflects reality. Fall back to the legacy
                                                // teams.manager_name string only when there's no admin
                                                // attached, so unmigrated teams still show something.
                                                value: team?.admin?.person
                                                    ? [
                                                        team.admin.person.first_name,
                                                        team.admin.person.second_name,
                                                        team.admin.person.third_name,
                                                        team.admin.person.tribe,
                                                    ].filter(Boolean).join(" ")
                                                    : (team?.manager_name ? `${team.manager_name} (بدون حساب)` : null),
                                                icon: Users
                                            },
                                            { label: "رمز الفريق", value: team?.code, icon: Id },
                                            { label: "تاريخ الإنشاء", value: team?.createdAt ? dayjs(team.createdAt).format("YYYY-MM-DD") : null, icon: CalendarStats },
                                            {
                                                label: "إضافة لاعبين",
                                                value: team?.enableAddPlayer ? "مفعل" : "متوقف",
                                                icon: team?.enableAddPlayer ? Check : X
                                            },
                                        ].map(({ label, value, icon: Icon }) => !value ? null : (
                                            <Flex key={label} align="center" gap={20} py={12}
                                                sx={(t) => ({ borderBottom: `1px solid ${t.colors.gray[1]}` })}>
                                                <Flex align="center" gap={8} w={150}>
                                                    <Icon size={16} strokeWidth={2} color={theme.colors.gray[5]} />
                                                    <Text size="sm" color="gray.6">{label}</Text>
                                                </Flex>
                                                <Text size="sm" weight={600} color="gray.8">{value as string}</Text>
                                            </Flex>
                                        ))}
                                    </Stack>
                                </Card>
                            </Col>
                        </Grid>
                    </Tabs.Panel>

                    {/* ─── Members Tab ─── */}
                    <Tabs.Panel value="members">
                        <Tabs value={memberTab} onTabChange={setMemberTab} variant="outline" radius="md"
                            styles={(t) => ({
                                tab: {
                                    fontWeight: 600,
                                    '&[data-active]': {
                                        color: 'white',
                                        borderColor: '#FBBF24',
                                        backgroundColor: '#1E3A8A',
                                    }
                                }
                            })}
                        >
                            <Tabs.List mb="md" grow>
                                <Tabs.Tab value="players">اللاعبين</Tabs.Tab>
                                <Tabs.Tab value="technicals">الجهاز الفني</Tabs.Tab>
                                <Tabs.Tab value="board">مجلس الإدارة</Tabs.Tab>
                                <Tabs.Tab value="assembly">العمومية</Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="players">
                                <Box py="lg">
                                    <Group position="apart" mb="md">
                                        <Text weight={700}>قائمة اللاعبين</Text>
                                        <Group>
                                            <Button size="xs" variant="light" leftIcon={<Printer size={16} />} onClick={() => setOpenPrint(true)}>طباعة القائمة</Button>
                                            <Button size="xs" leftIcon={<Plus size={16} />} onClick={() => setOpenAddPlayer(true)}>إضافة لاعب</Button>
                                        </Group>
                                    </Group>
                                    <MemberSection 
                                        type="player"
                                        list={(playersData?.allPlayersClub || []).filter((p: any) => p?.team?.id === id)}
                                        hasPermission={() => true}
                                        onEdit={(item: any) => handleEdit(item, 'player')}
                                        onDelete={(memberId: string) => handleDelete(memberId, 'player')}
                                        onChangeClassification={(item: any) => handleChangeClassification(item, 'player')}
                                        onChangeStatus={(item: any, status: string) => handleChangeStatus(item, status, 'player')}
                                        onVerifyIdentity={handleVerifyIdentity}
                                        onShowAttachments={handleShowAttachments}
                                        onAddAttachment={handleAddAttachment}
                                        onTransferPlayer={handleTransfer}
                                        onLoanPlayer={handleLoan}
                                        onAddSanction={handleAddSanction}
                                        onUpdateSanction={handleUpdateSanction}
                                        onStatPlayer={handleShowStat}
                                        onAddImage={handleAddImage}
                                        onShowDetails={handleShowDetails}
                                        onFreePlayer={handleFreePlayer}
                                    />
                                </Box>
                            </Tabs.Panel>
                            <Tabs.Panel value="technicals">
                                <Box py="lg">
                                    <Group position="apart" mb="md">
                                        <Text weight={700}>أعضاء الجهاز الفني</Text>
                                        <Button size="xs" leftIcon={<Plus size={16} />} onClick={() => setOpenAddTechnical(true)}>إضافة عضو جهاز فني</Button>
                                    </Group>
                                    <MemberSection 
                                        type="technical"
                                        list={(techData?.allTechnicalApparatusClub || []).filter((t: any) => t?.team?.id === id)}
                                        hasPermission={() => true}
                                        onEdit={(item: any) => handleEdit(item, 'technical')}
                                        onDelete={(memberId: string) => handleDelete(memberId, 'technical')}
                                        onChangeClassification={(item: any) => handleChangeClassification(item, 'technical')}
                                        onChangeStatus={(item: any, status: string) => handleChangeStatus(item, status, 'technical')}
                                        onAddImage={handleAddImage}
                                    />
                                </Box>
                            </Tabs.Panel>
                            <Tabs.Panel value="board">
                                <Box py="lg">
                                    <Group position="apart" mb="md">
                                        <Text weight={700}>مجلس الإدارة</Text>
                                        <Button size="xs" leftIcon={<Plus size={16} />} onClick={() => setOpenAddMember(true)}>إضافة عضو مجلس إدارة</Button>
                                    </Group>
                                    <MemberSection 
                                        type="member"
                                        list={(membersData?.allMembersClub || []).filter((m: any) => m?.team?.id === id)}
                                        hasPermission={() => true}
                                        onEdit={(item: any) => handleEdit(item, 'member')}
                                        onDelete={(memberId: string) => handleDelete(memberId, 'member')}
                                        onChangeClassification={(item: any) => handleChangeClassification(item, 'member')}
                                        onChangeStatus={(item: any, status: string) => handleChangeStatus(item, status, 'member')}
                                        onAddImage={handleAddImage}
                                    />
                                </Box>
                            </Tabs.Panel>
                            <Tabs.Panel value="assembly">
                                <Box py="lg">
                                    <Group position="apart" mb="md">
                                        <Text weight={700}>الجمعية العمومية</Text>
                                        <Menu shadow="md" width={200}>
                                            <Menu.Target>
                                                <Button size="xs" leftIcon={<Plus size={16} />}>إضافة عضو للجمعية</Button>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item onClick={() => { setEditData(null); setOpenAddAssembly(true); }}>إضافة عضو جديد</Menu.Item>
                                                <Menu.Item onClick={() => { setEditData(null); setOpenSearchAssembly(true); }}>إضافة عضو موجود</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                    <MemberSection 
                                        type="assembly"
                                        list={assemblyData?.allAssemblyClub || []}
                                        onEdit={(item: any) => handleEdit(item, 'assembly')}
                                        onDelete={(memberId: string) => handleDelete(memberId, 'assembly')}
                                        onRenewSubscription={(item: any) => { setEditData(item); setOpenRenewModal(true); }}
                                        hasPermission={() => true}
                                    />
                                </Box>
                            </Tabs.Panel>
                        </Tabs>
                    </Tabs.Panel>

                    {/* ─── Events Tab ─── */}
                    <Tabs.Panel value="events">
                        <Group position="apart" mb="xl">
                            <Title order={3} color="#1E3A8A">الفعاليات</Title>
                            <Button size="md" color="blue" leftIcon={<Plus size={18} />} onClick={() => { setSelectedEvent(null); setEventModalOpened(true); }}>
                                إضافة فعالية جديدة
                            </Button>
                        </Group>

                        <EventList
                            events={eventsData?.allEvents || []}
                            loading={eventsLoading}
                            idTeam={id as string}
                            onView={(ev) => { setViewEvent(ev); setCarouselOpened(true); }}
                            onEdit={(ev) => { setSelectedEvent(ev); setEventModalOpened(true); }}
                            onDelete={(idEvent) => {
                                if (confirm("هل أنت متأكد من حذف هذه الفعالية؟")) {
                                    deleteEvent({ variables: { id: idEvent } }).then(() => getAllEvents({ variables: { idTeam: id } }));
                                }
                            }}
                        />
                    </Tabs.Panel>
                </Tabs>
            </Container>

            {/* Event Modal */}
            <Modal
                opened={eventModalOpened}
                onClose={() => setEventModalOpened(false)}
                title={selectedEvent ? "تعديل فعالية" : "إضافة فعالية جديدة"}
                size="lg"
                radius="md"
            >
                <EventForm
                    event={selectedEvent}
                    onSuccess={() => { setEventModalOpened(false); getAllEvents({ variables: { idTeam: id } }); }}
                    idTeam={id as string}
                    createEvent={createEvent}
                    updateEvent={updateEvent}
                />
            </Modal>

            {/* Event View/Carousel Modal */}
            <EventCarouselModal 
                opened={carouselOpened} 
                onClose={() => setCarouselOpened(false)} 
                event={viewEvent} 
            />

            {/* Member Action Modals */}
            <AddPlayerModal title="إضافة لاعب" opened={openAddPlayer} id={id as string} onClose={() => setOpenAddPlayer(false)} onCompleted={refetchAll}/>
            <UpdatePlayerModal title="تعديل اللاعب" opened={openEditPlayer} id={editData?.id} onClose={() => setOpenEditPlayer(false)} onSuccess={refetchAll} />
            <DeletePlayersModal title="حذف لاعب" opened={openDeletePlayer} id={deleteData} onClose={() => setOpenDeletePlayer(false)} onSuccess={refetchAll} />

            <AddTechnicalModal title="إضافة عضو جهاز فني" opened={openAddTechnical} id={id as string} onClose={() => setOpenAddTechnical(false)} onCompleted={refetchAll}/>
            <UpdateTechnicalModal title="تعديل عضو الجهاز فني" opened={openEditTechnical} id={editData?.id} onClose={() => setOpenEditTechnical(false)} onSuccess={refetchAll} />
            <DeleteTechnicalModal title="حذف عضو" opened={openDeleteTechnical} id={deleteData} onClose={() => setOpenDeleteTechnical(false)} onSuccess={refetchAll} />

            <AddMembersModal title="إضافة عضو مجلس إدارة" opened={openAddMember} id={id as string} onClose={() => setOpenAddMember(false)} onCompleted={refetchAll}/>
            <UpdateMemberModal title="تعديل عضو مجلس الأدارة" opened={openEditMember} id={editData?.id} onClose={() => setOpenEditMember(false)} onSuccess={refetchAll} />
            <DeleteMembersModal title="حذف عضو مجلس الأدارة" opened={openDeleteMember} id={deleteData} onClose={() => setOpenDeleteMember(false)} onSuccess={refetchAll} />

            <AddAssemblyModal title="إضافة عضو عمومية" opened={openAddAssembly} data={editData} onClose={() => setOpenAddAssembly(false)} onCompleted={refetchAll}/>
            <UpdateAssemblyModal title="تعديل معلومات العضو" data={editData} opened={openEditModal} onClose={() => setOpenEditModal(false)} onSuccess={refetchAll} />
            <DeleteAssemblyModal title="حذف عضو الجمعية" data={deleteData} opened={openDeleteModal} onClose={() => setOpenDeleteModal(false)} onSuccess={refetchAll} />

            <SearchAssemblyModal 
                title="البحث عن عضو" 
                opened={openSearchAssembly} 
                onClose={() => setOpenSearchAssembly(false)} 
                setOpenAddModal={setOpenAddAssembly}
                setSelectedData={setEditData}
            />

            <PrintModal title="طباعة قائمة اللاعبين" opened={openPrint} onClose={() => setOpenPrint(false)} id={editData?.id} />

            <ChangeClassificationModal 
                opened={openChangeClassification} 
                onClose={() => { setOpenChangeClassification(false); }} 
                data={classificationData} 
                fromType={classificationFrom} 
                onSuccess={refetchAll} 
                idClub={clubId}
            />

            {/* Status & Identity Modals */}
            <ChangeStatusPlayersModal title="تعديل حالة لاعب" opened={openChangeStatus} id={editData?.id} onClose={() => setOpenChangeStatus(false)} status={newStatus}/>
            <VerifyIdentityModal
                title="تحقق من هوية لاعب"
                opened={openVerifyIdentity}
                data={editData}
                onClose={() => setOpenVerifyIdentity(false)}
                setNewStatus={setNewStatus}
                setOpenChangeStatusModal={setOpenChangeStatus}
            />

            {/* Attachment Modals */}
            <ShowAttachments
                title="المرفقات"
                setSelectedData={setSelectedAttachment}
                setOpenDeleteAttachmentModal={setOpenDeleteAttachment}
                opened={openShowAttachments}
                data={editData}
                onClose={() => setOpenShowAttachments(false)}
            />
            <AddAttachmentPlayerModal title="إضافة مرفقات" opened={openAddAttachment} id={deleteData} onClose={() => setOpenAddAttachment(false)}/>
            <DeleteAttachmentPlayerModal
                title="حذف المرفق"
                opened={openDeleteAttachment}
                id={selectedAttachment}
                onClose={() => setOpenDeleteAttachment(false)}
            />

            {/* Transfer & Loan Modals */}
            <PlayersTransferModal title="نقل لاعب" opened={openTransfer} data={editData} onClose={() => setOpenTransfer(false)}/>
            <PlayersLoanModal title="إعارة اللاعب" opened={openLoan} data={editData} onClose={() => setOpenLoan(false)}/>

            {/* Sanction Modals */}
            <AddSanctionModal opened={openAddSanction} onClose={() => setOpenAddSanction(false)} player={editData} />
            <UpdateSanction playerId={editData?.id} opened={openUpdateSanction} onClose={() => setOpenUpdateSanction(false)} />

            {/* Stats & Image Modals */}
            <ShowStatPlayer
                title="احصائيات اللاعب"
                playerId={editData}
                opened={openShowStat}
                onClose={() => setOpenShowStat(false)}
                setSelectedPlayer={() => {}}
                setOpenEditPlayerModal={() => {}}
            />
            <ShowStatPlayer
                title="تفاصيل اللاعب"
                playerId={editData}
                opened={openShowDetails}
                onClose={() => setOpenShowDetails(false)}
                setSelectedPlayer={() => {}}
                setOpenEditPlayerModal={() => {}}
            />
            <AddImagePlayersModal title="إضافة صورة" opened={openAddImage} id={deleteData} onClose={() => setOpenAddImage(false)}/>
            <RenewAssemblyModal title="تجديد اشتراك العضو" data={editData} opened={openRenewModal} onClose={() => setOpenRenewModal(false)} />
            <FreePlayerModal title="تحرير لاعب" opened={openFreePlayer} id={editData} onClose={() => setOpenFreePlayer(false)} />
        </Box>
    );
}

