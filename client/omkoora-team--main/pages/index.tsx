import {
    Avatar, Badge, Box, Card, Col, Container, Divider, Flex, Grid, Group,
    Loader, MantineTheme, Pagination, RingProgress, SimpleGrid, Skeleton, Stack, Tabs, Text, Title, Tooltip,
    TextInput, Textarea, Button, Modal, ActionIcon, Menu, Select, FileInput, Image, useMantineTheme
} from "@mantine/core";
import { useTheme } from "@emotion/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import { 
    useStatisticsTeam, useAllPlayers, useAllEvents, useAllMembers, 
    useAllTechnicals, useAllAssembly, useTeam,
    useCreateEvent, useUpdateEvent, useDeleteEvent
} from "../graphql";
import {
    Users, UserCheck, Clock, Phone, Shield, Activity,
    ArrowLeft, Id, CalendarStats, Plus, LayoutDashboard, CalendarEvent, Check, X,
    AlertCircle, CalendarTime, ShieldCheck, Article, BallFootball 
} from "tabler-icons-react";
import { GiAbstract042 } from "react-icons/gi";
import { GradientStatCard, OutlineStatCard } from "../components/Stats/ModernStatCards";
import useStore from "../store/useStore";
import { EventList } from "../components/TeamDetails/EventList";
import { EventForm } from "../components/TeamDetails/EventForm";
import { EventCarouselModal } from "../components/TeamDetails/EventCarouselModal";
import { MemberSection } from "../components/TeamDetails/MemberSection";
import {
    UpdatePlayersModal, UpdateTechnicalModal, UpdateMembersModal, UpdateAssemblyModal,
    DeletePlayersModal, DeleteTechnicalModal, DeleteMembersModal, DeleteAssemblyModal,
    ChangeStatusPlayersModal, ChangeStatusTechnicalsModal, ChangeStatusMembersModal,
    ChangeClassificationModal,
    AddPlayersModal, AddTechnicalModal, AddMembersModal, AddAssemblyModal,
    SearchAssemblyModal,
    VerifyIdentityModal, ShowAttachments, AddAttachmentPlayerModal, DeleteAttachmentPlayerModal,
    ShowStatPlayer, FreePlayerModal, ConvertPlayerToTechnicalModal, PlayersTransferModal,
    PlayersLoanModal, AddImagePlayersModal, RenewAssemblyModal
} from "../components/Modal";
import { getImageUrl } from "../lib/helpers/image";

dayjs.extend(relativeTime);

export default function Home() {
    const theme = useMantineTheme();
    const userData = useStore((state: any) => state.userData);
    const teamId = userData?.person?.member?.team?.id;
    const router = useRouter();

    // Queries
    const { data: teamData, loading: teamLoading } = useTeam({ 
        variables: { id: teamId },
        skip: !teamId 
    });
    const team = teamData?.team || userData?.person?.member?.team;

    const [getStatisticsTeam, { data: statsData, loading: statsLoading }] = useStatisticsTeam();
    const [getAllPlayers, { data: playersData, loading: playersLoading }] = useAllPlayers();
    const [getAllEvents, { data: eventsData, loading: eventsLoading }] = useAllEvents();
    const [getAllMembers, { data: membersData, loading: membersLoading }] = useAllMembers();
    const [getAllTechnical, { data: techData, loading: techLoading }] = useAllTechnicals();
    const [getAllAssembly, { data: assemblyData, loading: assemblyLoading }] = useAllAssembly();

    // States
    const [activeTab, setActiveTab] = useState<string | null>("overview");
    const [memberTab, setMemberTab] = useState<string | null>("players");
    const [editData, setEditData] = useState<any>(null);
    const [openShowStatDetails, setOpenShowStatDetails] = useState(false);
    const [deleteId, setDeleteId] = useState<string>("");
    const [statusId, setStatusId] = useState<string>("");
    const [statusValue, setStatusValue] = useState<string>("");
    
    const [openEditPlayer, setOpenEditPlayer] = useState(false);
    const [openEditTechnical, setOpenEditTechnical] = useState(false);
    const [openEditMember, setOpenEditMember] = useState(false);
    const [openEditAssembly, setOpenEditAssembly] = useState(false);
    
    const [openDeletePlayer, setOpenDeletePlayer] = useState(false);
    const [openDeleteTechnical, setOpenDeleteTechnical] = useState(false);
    const [openDeleteMember, setOpenDeleteMember] = useState(false);
    const [openDeleteAssembly, setOpenDeleteAssembly] = useState(false);

    const [openStatusPlayer, setOpenStatusPlayer] = useState(false);
    const [openStatusTechnical, setOpenStatusTechnical] = useState(false);
    const [openStatusMember, setOpenStatusMember] = useState(false);
    const [openChangeClass, setOpenChangeClass] = useState(false);
    const [fromType, setFromType] = useState<any>(null);

    const [openAddPlayer, setOpenAddPlayer] = useState(false);
    const [openAddTechnical, setOpenAddTechnical] = useState(false);
    const [openAddMember, setOpenAddMember] = useState(false);
    const [openAddAssembly, setOpenAddAssembly] = useState(false);
    const [openSearchModal, setOpenSearchModal] = useState(false);
    const [searchTarget, setSearchTarget] = useState<'player' | 'technical' | 'member' | 'assembly' | null>(null);

    const [openAddImageModal, setOpenAddImageModal] = useState(false);
    const [openVerifyIdentityModal, setOpenVerifyIdentityModal] = useState(false);
    const [openShowAttachmentPlayerModal, setOpenShowAttachmentPlayerModal] = useState(false);
    const [openAddAttachmentPlayerModal, setOpenAddAttachmentPlayerModal] = useState(false);
    const [openDeleteAttachmentModal, setOpenDeleteAttachmentModal] = useState(false);
    const [StatPlayerModal, setStatPlayerModal] = useState(false);
    const [openTransferModal, setOpenTransferModal] = useState(false);
    const [openRenewModal, setOpenRenewModal] = useState(false);
    const [openLoanModal, setOpenLoanModal] = useState(false);
    const [openFreePlayerModal, setOpenFreePlayerModal] = useState(false);
    const [openConvertToTechnicalModal, setOpenConvertToTechnicalModal] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<any>("");


    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [eventModalOpened, setEventModalOpened] = useState(false);
    const [carouselOpened, setCarouselOpened] = useState(false);

    const [createEvent] = useCreateEvent();
    const [updateEvent] = useUpdateEvent();
    const [deleteEvent] = useDeleteEvent();

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
        if (teamId) {
            getStatisticsTeam({ variables: { idTeam: teamId } });
            getAllEvents({ variables: { idTeam: teamId } });
            getAllPlayers({ variables: { idTeam: teamId } });
            getAllMembers({ variables: { idTeam: teamId } });
            getAllTechnical({ variables: { idTeam: teamId } });
        }
        if (team?.club?.id) {
            getAllAssembly({ variables: { idClub: team.club.id } });
        }
    }, [teamId, team?.club?.id]);

    const stats = statsData?.statisticsTeam;

    const handleEdit = (item: any, type: string) => {
        setEditData(item);
        if (type === 'player') setOpenEditPlayer(true);
        if (type === 'technical') setOpenEditTechnical(true);
        if (type === 'member') setOpenEditMember(true);
        if (type === 'assembly') setOpenEditAssembly(true);
        if (type === 'event') {
            setSelectedEvent(item);
            setEventModalOpened(true);
        }
    };

    const handleDelete = (id: string, type: string) => {
        setDeleteId(id);
        if (type === 'player') setOpenDeletePlayer(true);
        if (type === 'technical') setOpenDeleteTechnical(true);
        if (type === 'member') setOpenDeleteMember(true);
        if (type === 'assembly') setOpenDeleteAssembly(true);
        if (type === 'event') {
            if (confirm("هل أنت متأكد من حذف هذه الفعالية؟")) {
                deleteEvent({ variables: { id } }).then(() => getAllEvents({ variables: { idTeam: teamId } }));
            }
        }
    };

    const handleChangeStatus = (id: string, status: string, type: string) => {
        setStatusId(id);
        setStatusValue(status);
        if (type === 'player') setOpenStatusPlayer(true);
        if (type === 'technical') setOpenStatusTechnical(true);
        if (type === 'member') setOpenStatusMember(true);
    };

    const handleChangeClassification = (item: any, type: string) => {
        setEditData(item);
        setFromType(type);
        setOpenChangeClass(true);
    };

    const handleVerifyIdentity = (data: any) => { setEditData(data); setOpenVerifyIdentityModal(true); };
    const handleShowAttachments = (data: any) => { setEditData(data); setOpenShowAttachmentPlayerModal(true); };
    const handleAddAttachment = (id: string) => { setEditData(id); setOpenAddAttachmentPlayerModal(true); };
    const handleStatPlayer = (id: string) => { setEditData(id); setStatPlayerModal(true); };
    const handleTransferPlayer = (data: any) => { setEditData(data); setOpenTransferModal(true); };
    const handleLoanPlayer = (data: any) => { setEditData(data); setOpenLoanModal(true); };
    const handleFreePlayer = (id: string) => { setEditData(id); setOpenFreePlayerModal(true); };
    const handleConvertToTechnical = (id: string) => { setEditData(id); setOpenConvertToTechnicalModal(true); };
    const handleAddImage = (id: string) => { setEditData(id); setOpenAddImageModal(true); };
    const handleRenewSubscription = (data: any) => { setEditData(data); setOpenRenewModal(true); };

    // Permission map keyed by page name. Mirrors the parsing already done in
    // components/Layout/Sidebar.tsx so the dashboard tabs honour the same
    // permission flags. The "role" derived here is *internal* (chairman vs
    // not), not the global user role: classification === "رئيس" → "1".
    const [permRole, setPermRole] = useState("");
    const [pagePerms, setPagePerms] = useState<Record<string, string[]>>({});
    useEffect(() => {
        if (userData?.person?.member?.classification != null) {
            setPermRole(userData.person.member.classification === "رئيس" ? "1" : "2");
        }
        const perm = userData?.permission;
        if (perm) {
            setPagePerms({
                members: perm?.members?.split(",") || [],
                technicals: perm?.technicals?.split(",") || [],
                players: perm?.players?.split(",") || [],
                assembly: perm?.assembly?.split(",") || [],
            });
        }
    }, [userData]);

    const makeHasPermission = (page: "members" | "technicals" | "players" | "assembly") =>
        (code: string): boolean => {
            if (permRole === "1") return true;
            const codes = pagePerms[page];
            return Array.isArray(codes) && codes.includes(code);
        };

    return (
        <Box dir="rtl">
            <Head>
                <title>{team?.name || "طموح"} - لوحة التحكم</title>
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
                <Container size="xl">
                    <Flex align="center" gap="xl" wrap="wrap">
                        <Avatar
                            src={getImageUrl(team?.logo)}
                            size={100}
                            radius={100}
                            styles={{
                                root: {
                                    border: "4px solid rgba(255,255,255,0.4)",
                                    background: "white",
                                }
                            }}
                        >
                            {!team?.logo && <BallFootball size={60} color={theme.colors.blue[7]} />}
                        </Avatar>
                        <Box>
                            <Title order={1} color="white" mb={4}>{team?.name || "فريقك"}</Title>
                            <Group spacing={8}>
                                <Badge color={"teal"} variant="filled" radius="sm">
                                    نشط
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

                            <Grid gutter="lg">
                                <Col span={12}>
                                    <Card shadow="none" p="xl" radius="md" withBorder sx={{ borderColor: theme.colors.gray[2] }}>
                                        <Text size="md" weight={700} color="#1E3A8A" mb="md">معلومات الفريق</Text>
                                        <Stack spacing={0}>
                                            {[
                                                { label: "اسم الفريق", value: team?.name, icon: Shield },
                                                { label: "النشاط", value: team?.activities, icon: Activity },
                                                { label: "هاتف", value: team?.phone, icon: Phone },
                                                { label: "اسم رئيس الفريق", value: team?.manager_name, icon: Users },
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
                        </Box>
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
                                    <Group position="right" mb="md">
                                        <Button 
                                            size="sm" 
                                            color="blue" 
                                            leftIcon={<Plus size={18} />}
                                            onClick={() => { setEditData(null); setOpenAddPlayer(true); }}
                                        >إضافة لاعب</Button>
                                    </Group>
                                    <MemberSection
                                        type="player"
                                        list={playersData?.allPlayers || []}
                                        hasPermission={makeHasPermission("players")}
                                        onEdit={(item) => handleEdit(item, 'player')}
                                        onDelete={(id) => handleDelete(id, 'player')}
                                        onChangeStatus={(id, status) => handleChangeStatus(id, status, 'player')}
                                        onChangeClassification={(item) => handleChangeClassification(item, 'player')}
                                        onVerifyIdentity={handleVerifyIdentity}
                                        onShowAttachments={handleShowAttachments}
                                        onAddAttachment={handleAddAttachment}
                                        onStatPlayer={handleStatPlayer}
                                        onTransferPlayer={handleTransferPlayer}
                                        onLoanPlayer={handleLoanPlayer}
                                        onFreePlayer={handleFreePlayer}
                                        onConvertToTechnical={handleConvertToTechnical}
                                        onAddImage={handleAddImage}
                                        onShowDetails={(item) => { setEditData(item); setOpenShowStatDetails(true); }}
                                    />
                                </Box>
                            </Tabs.Panel>
                            <Tabs.Panel value="technicals">
                                <Box py="lg">
                                    <Group position="right" mb="md">
                                        <Button 
                                            size="sm" 
                                            color="blue" 
                                            leftIcon={<Plus size={18} />}
                                            onClick={() => { setEditData(null); setOpenAddTechnical(true); }}
                                        >إضافة عضو فني</Button>
                                    </Group>
                                    <MemberSection
                                        type="technical"
                                        list={techData?.allTechnicalApparatus || []}
                                        hasPermission={makeHasPermission("technicals")}
                                        onEdit={(item) => handleEdit(item, 'technical')}
                                        onDelete={(id) => handleDelete(id, 'technical')}
                                        onChangeStatus={(id, status) => handleChangeStatus(id, status, 'technical')}
                                        onChangeClassification={(item) => handleChangeClassification(item, 'technical')}
                                        onAddImage={handleAddImage}
                                    />
                                </Box>
                            </Tabs.Panel>
                            <Tabs.Panel value="board">
                                <Box py="lg">
                                    <Group position="right" mb="md">
                                        <Button 
                                            size="sm" 
                                            color="blue" 
                                            leftIcon={<Plus size={18} />}
                                            onClick={() => { setEditData(null); setOpenAddMember(true); }}
                                        >إضافة عضو مجلس إدارة</Button>
                                    </Group>
                                    <MemberSection
                                        type="member"
                                        list={membersData?.allMembers || []}
                                        hasPermission={makeHasPermission("members")}
                                        onEdit={(item) => handleEdit(item, 'member')}
                                        onDelete={(id) => handleDelete(id, 'member')}
                                        onChangeStatus={(id, status) => handleChangeStatus(id, status, 'member')}
                                        onChangeClassification={(item) => handleChangeClassification(item, 'member')}
                                        onAddImage={handleAddImage}
                                    />
                                </Box>
                            </Tabs.Panel>
                            <Tabs.Panel value="assembly">
                                <Box py="lg">
                                    <Group position="right" mb="md">
                                        <Menu shadow="md" width={200}>
                                            <Menu.Target>
                                                <Button size="sm" color="blue" leftIcon={<Plus size={18} />}>إضافة عضو عمومية</Button>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item onClick={() => { setEditData(null); setOpenAddAssembly(true); }}>إضافة عضو جديد</Menu.Item>
                                                <Menu.Item onClick={() => { setSearchTarget('assembly'); setOpenSearchModal(true); }}>بحث عن عضو موجود</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                    <MemberSection
                                        type="assembly"
                                        list={assemblyData?.allAssemblyClub || []}
                                        hasPermission={makeHasPermission("assembly")}
                                        onEdit={(item) => handleEdit(item, 'assembly')}
                                        onDelete={(id) => handleDelete(id, 'assembly')}
                                        onRenewSubscription={handleRenewSubscription}
                                        onAddImage={handleAddImage}
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
                            idTeam={teamId}
                            onView={(ev) => { setSelectedEvent(ev); setCarouselOpened(true); }}
                            onEdit={(ev) => handleEdit(ev, 'event')}
                            onDelete={(id) => handleDelete(id, 'event')}
                        />
                    </Tabs.Panel>
                </Tabs>
            </Container>

            {/* Modals */}
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
                    onSuccess={() => { setEventModalOpened(false); getAllEvents({ variables: { idTeam: teamId } }); }}
                    idTeam={teamId}
                    createEvent={createEvent}
                    updateEvent={updateEvent}
                />
            </Modal>
            {selectedEvent && (
                <EventCarouselModal
                    opened={carouselOpened}
                    onClose={() => setCarouselOpened(false)}
                    event={selectedEvent}
                />
            )}

            <UpdatePlayersModal opened={openEditPlayer} onClose={() => setOpenEditPlayer(false)} id={editData?.id} />
            <UpdateTechnicalModal opened={openEditTechnical} onClose={() => setOpenEditTechnical(false)} id={editData?.id} />
            <UpdateMembersModal opened={openEditMember} onClose={() => setOpenEditMember(false)} id={editData?.id} />
            <UpdateAssemblyModal opened={openEditAssembly} onClose={() => setOpenEditAssembly(false)} data={editData} />

            <DeletePlayersModal opened={openDeletePlayer} onClose={() => setOpenDeletePlayer(false)} id={deleteId} />
            <DeleteTechnicalModal opened={openDeleteTechnical} onClose={() => setOpenDeleteTechnical(false)} id={deleteId} />
            <DeleteMembersModal opened={openDeleteMember} onClose={() => setOpenDeleteMember(false)} id={deleteId} />
            <DeleteAssemblyModal opened={openDeleteAssembly} onClose={() => setOpenDeleteAssembly(false)} id={deleteId} />

            <ChangeStatusPlayersModal opened={openStatusPlayer} onClose={() => setOpenStatusPlayer(false)} id={statusId} status={statusValue} />
            <ChangeStatusTechnicalsModal opened={openStatusTechnical} onClose={() => setOpenStatusTechnical(false)} id={statusId} status={statusValue} />
            <ChangeStatusMembersModal opened={openStatusMember} onClose={() => setOpenStatusMember(false)} id={statusId} status={statusValue} />

            <ChangeClassificationModal
                opened={openChangeClass}
                onClose={() => setOpenChangeClass(false)}
                data={editData}
                fromType={fromType}
                onSuccess={() => {}}
                idTeam={teamId}
            />

            <SearchAssemblyModal
                title="البحث عن شخص"
                setOpenAddModal={(open) => {
                    if (searchTarget === 'assembly') setOpenAddAssembly(open);
                }}
                setSelectedData={setEditData}
                opened={openSearchModal}
                onClose={() => setOpenSearchModal(false)}
            />

            <AddPlayersModal title="إضافة لاعب" data={editData} opened={openAddPlayer} onClose={() => setOpenAddPlayer(false)} />
            <AddTechnicalModal title="إضافة عضو فني" data={editData} opened={openAddTechnical} onClose={() => setOpenAddTechnical(false)} />
            <AddMembersModal title="إضافة عضو مجلس إدارة" data={editData} opened={openAddMember} onClose={() => setOpenAddMember(false)} />
            <AddAssemblyModal title="إضافة عضو عمومية" data={editData} opened={openAddAssembly} onClose={() => setOpenAddAssembly(false)} />

            <VerifyIdentityModal
                title="تحقق من هوية لاعب"
                opened={openVerifyIdentityModal}
                data={editData}
                onClose={() => setOpenVerifyIdentityModal(false)}
                setNewStatus={(status) => { setStatusValue(status); setStatusId(editData?.id); }}
                setOpenChangeStatusModal={setOpenStatusPlayer}
            />

            <ShowAttachments
                title="المرفقات"
                setSelectedData={setSelectedAttachment}
                setOpenDeleteAttachmentModal={setOpenDeleteAttachmentModal}
                opened={openShowAttachmentPlayerModal}
                data={editData}
                onClose={() => setOpenShowAttachmentPlayerModal(false)}
            />

            <AddAttachmentPlayerModal title="إضافة مرفقات" opened={openAddAttachmentPlayerModal} id={editData} onClose={() => setOpenAddAttachmentPlayerModal(false)} />
            <DeleteAttachmentPlayerModal title="" opened={openDeleteAttachmentModal} id={selectedAttachment} onClose={() => setOpenDeleteAttachmentModal(false)} />

            <ShowStatPlayer
                playerId={editData}
                opened={StatPlayerModal}
                onClose={() => setStatPlayerModal(false)}
                setSelectedPlayer={() => { }}
                setOpenEditPlayerModal={() => { }}
            />

            <ShowStatPlayer
                title="تفاصيل اللاعب"
                playerId={editData}
                opened={openShowStatDetails}
                onClose={() => setOpenShowStatDetails(false)}
                setSelectedPlayer={() => { }}
                setOpenEditPlayerModal={() => { }}
            />

            <PlayersTransferModal title="نقل لاعب" opened={openTransferModal} data={editData} onClose={() => setOpenTransferModal(false)} />
            <PlayersLoanModal title="إعارة اللاعب" opened={openLoanModal} data={editData} onClose={() => setOpenLoanModal(false)} />
            <FreePlayerModal title="تحرير لاعب" opened={openFreePlayerModal} id={typeof editData === 'string' ? editData : editData?.id} onClose={() => setOpenFreePlayerModal(false)} />
            <ConvertPlayerToTechnicalModal title="تحويل للجهاز الفني" opened={openConvertToTechnicalModal} id={editData?.id} onClose={() => setOpenConvertToTechnicalModal(false)} />
            <AddImagePlayersModal title="اضافة صورة" opened={openAddImageModal} id={typeof editData === 'string' ? editData : editData?.id} onClose={() => setOpenAddImageModal(false)} />
            <RenewAssemblyModal title="تجديد اشتراك العضو" data={editData} opened={openRenewModal} onClose={() => setOpenRenewModal(false)} />
        </Box>
    );
}
