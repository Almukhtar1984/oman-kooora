import React, { useState } from 'react';
import { Card, Avatar, Text, Group, Badge, Stack, Divider, Menu, ActionIcon, Flex, Box, Tooltip, Modal, Grid, Col, MantineTheme } from '@mantine/core';
import {
    DotsVertical, EditCircle, Trash, Id, Paperclip, Upload, ChartDots,
    XboxX, History, Printer, Check, X, CalendarStats, Phone, Mail, MapPin, Target, LayoutDashboard, Briefcase, Medal, FileCertificate, Eye, ArrowsLeftRight, LockOpen
} from 'tabler-icons-react';
import { GiPlayerNext } from 'react-icons/gi';
import dayjs from 'dayjs';
import { useTheme } from '@emotion/react';
import { getImageUrl } from '../../lib/helpers/image';
import { openPrint } from '../../lib/helpers/openPrint';
import useStore from '../../store/useStore';

interface MemberCardProps {
    data: any;
    type: 'player' | 'technical' | 'member' | 'assembly' | 'transfer' | 'loan';
    hasPermission: (permission: string) => boolean;
    onEdit?: (data: any) => void;
    onDelete?: (id: string) => void;
    onChangeStatus?: (id: string, status: string) => void;
    onVerifyIdentity?: (data: any) => void;
    onShowAttachments?: (data: any) => void;
    onAddAttachment?: (id: string) => void;
    onStatPlayer?: (id: string) => void;
    onTransferPlayer?: (data: any) => void;
    onLoanPlayer?: (data: any) => void;
    onOpenTransferHistory?: (data: any) => void;
    onAddSanction?: (data: any) => void;
    onUpdateSanction?: (data: any) => void;
    onRenewSubscription?: (data: any) => void;
    onChangeClassification?: (data: any) => void;
    onAddImage?: (id: string | any) => void;
    onConvertToTechnical?: (id: string) => void;
    onFreePlayer?: (id: string) => void;
    onShowDetails?: (data: any) => void;
}

const CLASS_LABELS: Record<string, string> = {
    firstDegree: "الفريق الاول",
    secondDegree: "تحت 23 سنة",
    young: "تحت 18 سنة",
    rookies: "تحت 16 سنة",
};

const TYPE_LABELS: Record<MemberCardProps['type'], string> = {
    player: 'لاعب',
    technical: 'جهاز فني',
    member: 'مجلس الإدارة',
    assembly: 'عضوية',
    transfer: 'انتقال',
    loan: 'إعارة',
};

// Roles an assembly member can hold in teams (see Assembly.affiliations).
const ROLE_LABELS: Record<string, string> = {
    player: 'لاعب',
    technical: 'جهاز فني',
    member: 'مجلس الإدارة',
};

const STATUS_LABELS: Record<string, string> = {
    accepted: 'نشط',
    rejected: 'مرفوض',
    waiting_club: 'بانتظار النادي',
    waiting: 'بانتظار الفريق',
    suspended: 'معاقب',
};

const formatDate = (value?: string | null) => value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : '-';

type DetailField = { label: string; value: React.ReactNode };

type TeamRef = { id?: string; name: string; logo?: string; role?: string; position?: string };

// "Which team" line on the card face: the team logo + name (first team and a
// +N when an assembly member sits in several), or a clear "not in a team".
const TeamLine = ({ teams, clubName }: { teams: TeamRef[]; clubName: string }) => {
    if (teams.length === 0) {
        return <Badge color="gray" variant="light" size="sm" radius="sm">غير مسجل في فريق</Badge>;
    }
    const [first, ...rest] = teams;
    return (
        <Tooltip
            label={teams.map((t) => [t.name, t.role].filter(Boolean).join(' - ')).join('، ') + (clubName !== '-' ? ` • ${clubName}` : '')}
            withArrow
            multiline
            maw={260}
        >
            <Flex align="center" gap={6} sx={(theme) => ({ backgroundColor: theme.colors.blue[0], borderRadius: 999, padding: '2px 10px 2px 4px', maxWidth: '100%' })}>
                <Avatar size={18} radius="xl" color="blue" src={first.logo ? getImageUrl(first.logo) : null}>
                    {first.name?.charAt(0) || '-'}
                </Avatar>
                <Text size="xs" weight={700} color="blue.8" lineClamp={1}>{first.name}</Text>
                {rest.length > 0 && <Text size="10px" weight={700} color="blue.6">+{rest.length}</Text>}
            </Flex>
        </Tooltip>
    );
};

export const MemberCard = ({
    data, type, hasPermission,
    onEdit, onDelete, onChangeStatus, onVerifyIdentity, onShowAttachments,
    onAddAttachment, onStatPlayer, onTransferPlayer, onLoanPlayer,
    onOpenTransferHistory, onAddSanction, onUpdateSanction, onRenewSubscription,
    onChangeClassification, onAddImage, onConvertToTechnical, onFreePlayer, onShowDetails
}: MemberCardProps) => {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const theme = useTheme() as MantineTheme;
    const userTeam = useStore((state: any) => state.userData?.person?.member?.team);

    const person = (type === 'assembly' || type === 'transfer' || type === 'loan') ? data?.person || data : data?.person;
    if (!person) return null;

    const fullName = `${person?.first_name || ''} ${person?.second_name || ''} ${person?.third_name || ''} ${person?.tribe || ''}`.trim();
    const avatarUrl = person?.personal_picture ? getImageUrl(person.personal_picture) : '/unknow player.png';
    const age = person?.date_birth ? dayjs().diff(dayjs(person.date_birth), 'year') : 'N/A';
    
    const status = (type === 'transfer' || type === 'loan') ? data?.status || data?.lastTransfer?.status || data?.lastLoan?.status : data?.status;
    const isSuspended = status === 'suspended';

    // The subscription covers the calendar year it was paid in. A row with no
    // subscription date was never subscribed.
    const hasSubscription = type === 'assembly' && Boolean(data?.subscription_date) && dayjs(data.subscription_date).isValid();
    const subscriptionYear = hasSubscription ? dayjs(data.subscription_date).year() : null;
    const isAssemblyApproved = subscriptionYear !== null && dayjs().year() <= subscriptionYear;

    const renderStatusBadge = () => {
        if (type === 'assembly') {
            if (!hasSubscription) return <Badge color="gray" variant="filled" size="xs">غير مشترك</Badge>;
            return !isAssemblyApproved ? <Badge color="red" variant="filled" size="xs">منتهي</Badge> : <Badge color="teal" variant="filled" size="xs">ساري</Badge>;
        }

        switch (status) {
            case "accepted": return <Badge color="teal" variant="filled" size="xs">مقبول</Badge>;
            case "rejected": return <Badge color="red" variant="filled" size="xs">مرفوض</Badge>;
            case "waiting_club": return <Badge color="yellow" variant="filled" size="xs">بانتظار النادي</Badge>;
            case "waiting": return <Badge color="yellow" variant="filled" size="xs">بانتظار الفريق</Badge>;
            case "suspended": return <Badge color="red" variant="filled" size="xs">معاقب</Badge>;
            default: return <Badge color="yellow" variant="filled" size="xs">قيد الانتظار</Badge>;
        }
    };

    const statusText = type === 'assembly'
        ? (!hasSubscription ? 'غير مشترك' : isAssemblyApproved ? 'ساري' : 'منتهي')
        : (STATUS_LABELS[status] || 'قيد الانتظار');

    // Teams: rows carry their own team (the signed-in team when only the id
    // came back); assembly rows are matched to the teams the same civil ID is
    // registered in.
    const ownTeam = data?.team?.name ? data.team : (data?.team?.id && data.team.id === userTeam?.id ? userTeam : null);
    const affiliations: any[] = type === 'assembly' ? (data?.affiliations || []).filter((a: any) => a?.team) : [];
    const teams: TeamRef[] = affiliations.length > 0
        ? affiliations.map((a: any) => ({ ...a.team, role: ROLE_LABELS[a.role], position: a.position }))
        : (ownTeam ? [ownTeam] : []);
    const club = data?.club || userTeam?.club;
    const clubName = club?.name || '-';
    const teamsText = teams.length > 0 ? teams.map((t) => t.name).filter(Boolean).join('، ') : 'غير مسجل في فريق';

    const joinDate = formatDate(data?.membership_date || data?.createdAt);
    const classLabel = data?.class ? (CLASS_LABELS[data.class] || data.class) : '-';

    // Short "what they do" line under the name.
    const roleText = (() => {
        switch (type) {
            case 'player': return data?.player_center || 'لاعب';
            case 'technical': return data?.classification || data?.occupation || 'جهاز فني';
            case 'member': return data?.classification || data?.occupation || 'عضو مجلس إدارة';
            case 'assembly': {
                const roles = Array.from(new Set(affiliations.map((a: any) => ROLE_LABELS[a.role]).filter(Boolean)));
                return [data?.type || 'عضو', ...roles].join(' • ');
            }
            default: return data?.player_center || 'لاعب';
        }
    })();

    const statistics = [
        { label: 'الرقم المدني', value: person?.card_number || '-' },
        type === 'assembly'
            ? { label: 'تاريخ العضوية', value: formatDate(data?.membership_date || data?.createdAt) }
            : type === 'technical'
                ? { label: 'تاريخ العقد', value: joinDate }
                : { label: 'تاريخ الانضمام', value: joinDate },
        type === 'assembly'
            ? { label: 'رقم العضوية', value: data?.membership_number || '-' }
            : type === 'player' || type === 'transfer' || type === 'loan'
                ? { label: 'مركز اللاعب', value: data?.player_center || '-' }
                : { label: 'رقم الهاتف', value: person?.phone || '-' },
    ];

    const getTransferInfo = () => {
        if (type === 'transfer' || type === 'loan') {
            const transfer = type === 'transfer' ? data?.lastTransfer : data?.lastLoan;
            const fromClub = transfer?.team_from?.club?.name || transfer?.team_from?.name || '-';
            const toClub = transfer?.club_to?.name || transfer?.team_to?.club?.name || transfer?.team_to?.name || '-';
            const dateStart = transfer?.date_start ? dayjs(transfer.date_start).format('YYYY-MM-DD') : null;
            const dateEnd = transfer?.date_end ? dayjs(transfer.date_end).format('YYYY-MM-DD') : null;
            return { fromClub, toClub, dateStart, dateEnd };
        }
        return null;
    };

    const transferInfo = getTransferInfo();

    // Detail rows shown in the "عرض التفاصيل" modal, relevant to each kind of card.
    const detailFields: DetailField[] = [
        { label: 'الرقم المدني', value: person?.card_number || '-' },
        { label: 'تاريخ الميلاد', value: formatDate(person?.date_birth) },
        { label: 'العمر', value: age === 'N/A' ? '-' : `${age} سنة` },
        { label: 'رقم الهاتف', value: person?.phone || '-' },
        ...(type === 'player' ? [
            { label: 'مركز اللاعب', value: data?.player_center || '-' },
            { label: 'الدرجة', value: classLabel },
            { label: 'الفريق', value: teamsText },
            { label: 'النادي', value: clubName },
            { label: 'تاريخ الانضمام', value: joinDate },
            { label: 'النشاط', value: data?.activity || '-' },
            { label: 'الوظيفة', value: data?.job || '-' },
            { label: 'ملاحظات', value: data?.note || '-' },
        ] : []),
        ...(type === 'technical' ? [
            { label: 'التصنيف', value: data?.classification || '-' },
            { label: 'الوظيفة', value: data?.occupation || '-' },
            { label: 'الفريق', value: teamsText },
            { label: 'النادي', value: clubName },
            { label: 'تاريخ العقد', value: joinDate },
            { label: 'تاريخ نهاية العقد', value: formatDate(data?.membership_date_end) },
            { label: 'الخبرة', value: data?.testimony_experience || '-' },
            { label: 'ملاحظات', value: data?.note || '-' },
        ] : []),
        ...(type === 'member' ? [
            { label: 'المنصب', value: data?.classification || '-' },
            { label: 'الوظيفة', value: data?.occupation || '-' },
            { label: 'الفريق', value: teamsText },
            { label: 'النادي', value: clubName },
            { label: 'تاريخ العضوية', value: joinDate },
            { label: 'تاريخ نهاية العضوية', value: formatDate(data?.membership_date_end) },
            { label: 'ملاحظات', value: data?.note || '-' },
        ] : []),
        ...(type === 'assembly' ? [
            { label: 'رقم العضوية', value: data?.membership_number || '-' },
            { label: 'التصنيف', value: data?.type || '-' },
            { label: 'الجنس', value: data?.gender === 'male' ? 'ذكر' : data?.gender === 'female' ? 'أنثى' : '-' },
            { label: 'النادي', value: clubName },
            { label: 'تاريخ العضوية', value: formatDate(data?.membership_date || data?.createdAt) },
            { label: 'تاريخ الاشتراك', value: formatDate(data?.subscription_date) },
            { label: 'الاشتراك صالح حتى', value: subscriptionYear !== null ? `${subscriptionYear}-12-31` : '-' },
            {
                label: 'الفرق',
                value: teams.length > 0
                    ? teams.map((t) => [t.role, t.name, t.position].filter(Boolean).join(' - ')).join('، ')
                    : 'غير مسجل في فريق',
            },
        ] : []),
        ...((type === 'transfer' || type === 'loan') ? [
            { label: 'مركز اللاعب', value: data?.player_center || '-' },
            { label: 'الدرجة', value: classLabel },
            { label: 'الفريق الحالي', value: teamsText },
            { label: 'من', value: transferInfo?.fromClub || '-' },
            { label: 'إلى', value: transferInfo?.toClub || '-' },
            { label: type === 'loan' ? 'تاريخ بداية الإعارة' : 'تاريخ الانتقال', value: transferInfo?.dateStart || '-' },
            ...(type === 'loan' ? [{ label: 'تاريخ نهاية الإعارة', value: transferInfo?.dateEnd || '-' }] : []),
            { label: 'ملاحظات', value: data?.note || '-' },
        ] : []),
    ];
    const detailColumns = [
        detailFields.slice(0, Math.ceil(detailFields.length / 2)),
        detailFields.slice(Math.ceil(detailFields.length / 2)),
    ];

    const attachmentLink = (file: string, label: string, back?: boolean) => (
        <Box
            component="a"
            href={getImageUrl(file)}
            target="_blank"
            sx={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
        >
            <Text color="white" weight={800} size="sm">{label}</Text>
            <Box sx={{ backgroundColor: back ? '#fef2f2' : '#f0fdf4', padding: 6, borderRadius: 8, display: 'flex' }}>
                <Id size={20} color={back ? '#dc2626' : '#15803d'} />
            </Box>
        </Box>
    );

    return (
        <>
            <Modal
                opened={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                title={<Text weight={700} size="lg" color="white">{fullName}</Text>}
                size="90%"
                dir="rtl"
                centered
                styles={{
                    content: { padding: '0 !important', overflow: 'hidden', borderRadius: '20px' },
                    header: { backgroundColor: '#FF9000', margin: 0, padding: '16px 24px', color: 'white' },
                    close: { color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }
                }}
            >
                <Box sx={{ backgroundColor: theme.colors.gray[0], padding: 0 }}>
                    <Box sx={{ backgroundColor: '#FF9000', padding: '0 24px 24px 24px' }}>
                        <Grid gutter={0} align="flex-end">
                            <Col md={3} order={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Avatar src={avatarUrl} size={200} radius={0} styles={{ image: { objectFit: 'contain' } }} />
                            </Col>
                            <Col md={3} order={3}>
                                <Stack spacing={4} mb={20}>
                                    <Text weight={800} size={24} color="white" sx={{ lineHeight: 1 }}>{person?.first_name || person?.second_name}</Text>
                                    <Text weight={800} size={48} color="white" sx={{ lineHeight: 1 }}>{person?.tribe || ''}</Text>
                                </Stack>
                                <Group spacing={8} mb={20}>
                                    {renderStatusBadge()}
                                    <Badge color="dark" variant="filled">{TYPE_LABELS[type]}</Badge>
                                    {roleText && roleText !== TYPE_LABELS[type] && (
                                        <Badge color="yellow" variant="filled" sx={{ color: '#000' }}>{roleText}</Badge>
                                    )}
                                </Group>
                                <Stack spacing={8} mb={16}>
                                    {teams.length > 0 ? teams.map((t, idx) => (
                                        <Flex key={`${t.id || t.name}-${idx}`} align="center" gap={8}>
                                            <Avatar size={28} radius="xl" color="blue" src={t.logo ? getImageUrl(t.logo) : null}>
                                                {t.name?.charAt(0) || '-'}
                                            </Avatar>
                                            <Box>
                                                <Text weight={800} size="md" color="white" sx={{ lineHeight: 1.2 }}>{t.name}</Text>
                                                {(t.role || t.position) && (
                                                    <Text size="xs" color="white" opacity={0.85}>{[t.role, t.position].filter(Boolean).join(' - ')}</Text>
                                                )}
                                            </Box>
                                        </Flex>
                                    )) : (
                                        <Text weight={700} size="sm" color="white" opacity={0.85}>غير مسجل في فريق</Text>
                                    )}
                                    <Flex align="center" gap={8}>
                                        <Avatar size={28} radius="xl" color="orange" src={club?.logo ? getImageUrl(club.logo) : null}>
                                            {clubName.charAt(0)}
                                        </Avatar>
                                        <Text weight={700} size="sm" color="white">{clubName}</Text>
                                    </Flex>
                                </Stack>
                            </Col>
                            <Col md={6} order={2}>
                                <Grid grow gutter="md">
                                    {detailColumns.map((column, colIdx) => (
                                        <Col span={6} key={colIdx}>
                                            <Stack spacing={8}>
                                                {column.map((field) => (
                                                    <Box key={field.label}>
                                                        <Text color="white" opacity={0.8} size="10px">{field.label}</Text>
                                                        <Text color="white" weight={800}>{field.value}</Text>
                                                    </Box>
                                                ))}
                                                {colIdx === 1 && data?.parentApproval && (
                                                    <Box>
                                                        <Text color="white" opacity={0.8} size="10px">موافقة ولي الأمر</Text>
                                                        <Text component="a" href={getImageUrl(data.parentApproval)} target="_blank" weight={800} color="white" sx={{ textDecoration: 'underline' }}>عرض المرفق</Text>
                                                    </Box>
                                                )}
                                                {colIdx === 1 && data?.nationalID && attachmentLink(data.nationalID, 'واجهة امامية')}
                                                {colIdx === 1 && data?.nationalIDBack && attachmentLink(data.nationalIDBack, 'واجهة خلفية', true)}
                                            </Stack>
                                        </Col>
                                    ))}
                                </Grid>
                            </Col>
                        </Grid>
                    </Box>
                    <Box sx={{ backgroundColor: 'white', padding: '24px 0', borderTop: '1px solid #eee' }}>
                        <Grid grow gutter={0}>
                            <Col span={3} sx={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
                                <Text weight={800} size={24} color="slate.9">{person?.card_number || '-'}</Text>
                                <Text size="10px" color="gray.5" weight={700}>الرقم المدني</Text>
                            </Col>
                            <Col span={3} sx={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
                                <Text weight={800} size={24} color="slate.9">{age === 'N/A' ? '-' : age}</Text>
                                <Text size="10px" color="gray.5" weight={700}>العمر</Text>
                            </Col>
                            <Col span={3} sx={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
                                <Text weight={800} size={24} color="slate.9" lineClamp={1} px={8}>{teams[0]?.name || '-'}</Text>
                                <Text size="10px" color="gray.5" weight={700}>الفريق</Text>
                            </Col>
                            <Col span={3} sx={{ textAlign: 'center' }}>
                                <Text weight={800} size={24} color="slate.9">{statusText}</Text>
                                <Text size="10px" color="gray.5" weight={700}>{type === 'assembly' ? 'الاشتراك' : 'الحالة'}</Text>
                            </Col>
                        </Grid>
                    </Box>
                </Box>
            </Modal>

            <Box sx={{ width: '100%', maxWidth: 380, margin: '0 auto', direction: 'rtl' }}>
                <Box onClick={() => setDetailsOpen(true)} sx={(theme) => ({
                    borderRadius: 24,
                    border: `1px solid ${theme.colors.gray[3]}`,
                    backgroundColor: theme.colors.gray[0],
                    overflow: 'hidden',
                    boxShadow: theme.shadows.md,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows.lg,
                        borderColor: isSuspended ? theme.colors.red[5] : '#F59E0B'
                    },
                })}>
                    <Box sx={{ backgroundColor: '#fff', padding: 16, borderBottom: `1px solid ${theme.colors.gray[2]}`, position: 'relative' }}>
                        <Box sx={{ position: 'relative', overflow: 'hidden', paddingBottom: 12 }}>
                            <Box sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Group spacing={4}>
                                    {renderStatusBadge()}
                                    {data?.classification && <Badge color="gray" variant="outline" size="xs">{data.classification}</Badge>}
                                </Group>
                                <Group spacing={4} onClick={(e) => e.stopPropagation()}>
                                    <Tooltip label="عرض التفاصيل">
                                        <ActionIcon variant="filled" color="blue" size="sm" onClick={() => setDetailsOpen(true)}>
                                            <Eye size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Menu shadow="md" width={220} position="bottom-end" withinPortal>
                                        <Menu.Target>
                                            <Tooltip label="الخيارات" position="left" withArrow>
                                                <ActionIcon variant="filled" color="gray" size="sm">
                                                    <DotsVertical size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            {type === 'assembly' ? (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل</Menu.Item>}
                                                    {hasPermission("4") && <Menu.Item icon={<X size={14} color="red" />} color="red" onClick={() => onDelete && onDelete(data?.id)}>حذف</Menu.Item>}
                                                    {!isAssemblyApproved && <Menu.Item icon={<CalendarStats size={14} />} onClick={() => onRenewSubscription && onRenewSubscription(data)}>تجديد الاشتراك</Menu.Item>}
                                                    {hasPermission("8") && (
                                                        <Menu.Item component="a" icon={<Printer size={14} />} href={`https://print.omkooora.com/#/${data?.id}`} target="_blank" onClick={(e) => { e.preventDefault(); openPrint(`/${data?.id}`); }}>طباعة البطاقة</Menu.Item>
                                                    )}
                                                </>
                                            ) : type === 'player' && status === 'accepted' ? (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.person?.id || data?.id)}>إضافة صورة</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onAddAttachment && onAddAttachment(data?.id)}>إضافة مرفقات</Menu.Item>}
                                                    {data?.attachmentsPlayer?.length > 0 && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onShowAttachments && onShowAttachments(data)}>المرفقات ({data?.attachmentsPlayer?.length})</Menu.Item>}
                                                    {hasPermission("1") && <Menu.Item icon={<ChartDots size={14} />} onClick={() => onStatPlayer && onStatPlayer(data?.id)}>احصائيات اللاعب</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<GiPlayerNext size={14} />} onClick={() => onLoanPlayer && onLoanPlayer(data)}>إعارة اللاعب</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<LockOpen size={14} />} onClick={() => onFreePlayer && onFreePlayer(data?.id)}>تحرير اللاعب</Menu.Item>}
                                                </>
                                            ) : type === 'player' ? (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.person?.id || data?.id)}>إضافة صورة</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<Id size={14} />} onClick={() => onVerifyIdentity && onVerifyIdentity(data)}>تحقق</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onAddAttachment && onAddAttachment(data?.id)}>إضافة مرفقات</Menu.Item>}
                                                    {data?.attachmentsPlayer?.length > 0 && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onShowAttachments && onShowAttachments(data)}>المرفقات ({data?.attachmentsPlayer?.length})</Menu.Item>}
                                                    {hasPermission("1") && <Menu.Item icon={<ChartDots size={14} />} onClick={() => onStatPlayer && onStatPlayer(data?.id)}>احصائيات اللاعب</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<LockOpen size={14} />} onClick={() => onFreePlayer && onFreePlayer(data?.id)}>تحرير اللاعب</Menu.Item>}
                                                    {hasPermission("4") && <Menu.Item icon={<Trash size={14} color="red" />} color="red" onClick={() => onDelete && onDelete(data?.id)}>حذف</Menu.Item>}
                                                </>
                                            ) : (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل المعلومات</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.person?.id || data?.id)}>إضافة صورة</Menu.Item>}
                                                    {type === 'technical' && hasPermission("3") && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onAddAttachment && onAddAttachment(data?.id)}>إضافة مرفقات</Menu.Item>}
                                                    {type === 'technical' && data?.attachmentsTechnical?.length > 0 && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onShowAttachments && onShowAttachments(data)}>المرفقات ({data?.attachmentsTechnical?.length})</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                                                    {hasPermission("4") && <Menu.Item icon={<Trash size={14} color="red" />} color="red" onClick={() => onDelete && onDelete(data?.id)}>حذف</Menu.Item>}
                                                </>
                                            )}
                                            
                                            {(type === 'transfer' || type === 'loan') && (data?.status === 'waiting' || data?.lastTransfer?.status === 'waiting' || data?.lastLoan?.status === 'waiting') && hasPermission("2") && (
                                                <>
                                                    <Menu.Item icon={<Check size={14} />} color="teal" onClick={() => onChangeStatus && onChangeStatus(data?.id || (type === 'transfer' ? data?.lastTransfer?.id : data?.lastLoan?.id), "accepted")}>قبول</Menu.Item>
                                                    <Menu.Item icon={<X size={14} />} color="red" onClick={() => onChangeStatus && onChangeStatus(data?.id || (type === 'transfer' ? data?.lastTransfer?.id : data?.lastLoan?.id), "rejected")}>رفض</Menu.Item>
                                                </>
                                            )}

                                            {hasPermission("8") && type !== 'assembly' && (
                                                <Menu.Item component="a" icon={<Printer size={14} />} href={`https://print.omkooora.com/#/${data?.id}`} target="_blank" onClick={(e) => { e.preventDefault(); openPrint(`/${data?.id}`); }}>طباعة البطاقة</Menu.Item>
                                            )}
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Box>

                            <Box sx={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setDetailsOpen(true)}>
                                <Box sx={(theme) => ({
                                    position: 'relative',
                                    height: 200,
                                    backgroundColor: isSuspended ? theme.colors.gray[6] : '#F59E0B',
                                    backgroundImage: isSuspended 
                                        ? `linear-gradient(to bottom, ${theme.colors.red[9]}, ${theme.colors.gray[7]})` 
                                        : 'linear-gradient(to bottom, #F59E0B, #FBBF24)',
                                    clipPath: 'polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end',
                                    border: `1px solid ${theme.colors.gray[2]}`,
                                })}>
                                    <Box
                                        component="img"
                                        src={avatarUrl}
                                        alt="Member"
                                        sx={{
                                            zIndex: 2,
                                            height: '90%',
                                            maxWidth: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Flex
                                align="center"
                                justify="center"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: isSuspended ? '#C53030' : '#FBBF24',
                                    backgroundImage: isSuspended 
                                        ? 'linear-gradient(to bottom, #E53E3E, #C53030)' 
                                        : 'linear-gradient(to bottom, #F59E0B, #FBBF24)',
                                    color: '#fff',
                                    fontWeight: 800,
                                    zIndex: 10,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Text size="md">{age}</Text>
                            </Flex>
                        </Box>

                        <Box sx={{ textAlign: 'center', paddingTop: 12 }}>
                            <Text size="md" weight={700} color="slate.9" mb={4}>{fullName}</Text>
                            {transferInfo ? (
                                <Stack spacing={4}>
                                    <Group spacing={4} position="center">
                                        <Text size="10px" color="blue.7" weight={600}>{transferInfo.fromClub}</Text>
                                        <ArrowsLeftRight size={10} color="gray" />
                                        <Text size="10px" color="teal.7" weight={600}>{transferInfo.toClub}</Text>
                                    </Group>
                                    {transferInfo.dateStart && (
                                        <Text size="8px" color="gray.6" weight={500}>
                                            {type === 'loan' ? `من: ${transferInfo.dateStart} إلى: ${transferInfo.dateEnd || 'غير محدد'}` : `تاريخ الانتقال: ${transferInfo.dateStart}`}
                                        </Text>
                                    )}
                                </Stack>
                            ) : (
                                <Stack spacing={6} align="center">
                                    <Text size="10px" color="gray.6">{roleText}{age !== 'N/A' ? ` / ${age} سنة` : ''}</Text>
                                    <TeamLine teams={teams} clubName={clubName} />
                                </Stack>
                            )}
                        </Box>
                    </Box>

                    <Grid gutter={0} sx={(theme) => ({
                        backgroundColor: theme.colors.gray[0],
                        padding: '12px 0',
                        borderTop: `1px solid ${theme.colors.gray[2]}`,
                        cursor: type === 'player' ? 'pointer' : 'default',
                        '&:hover': type === 'player' ? { backgroundColor: theme.colors.gray[1] } : {}
                    })}
                    onClick={(e) => {
                        if (type === 'player' && onStatPlayer) {
                            e.stopPropagation();
                            onStatPlayer(data?.id);
                        }
                    }}>
                        {statistics.map((stat, idx) => (
                            <Col key={stat.label} span={4} sx={(theme) => ({
                                textAlign: 'center',
                                borderLeft: idx > 0 ? `1px solid ${theme.colors.gray[3]}` : 'none'
                            })}>
                                <Text weight={700} size="xs">{stat.value}</Text>
                                <Text size="8px" color="gray.5" weight={500}>{stat.label}</Text>
                            </Col>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
