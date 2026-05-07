import React, { useState } from 'react';
import { Card, Avatar, Text, Group, Badge, Stack, Divider, Menu, ActionIcon, Flex, Box, Tooltip, Modal, Grid, Col, MantineTheme } from '@mantine/core';
import {
    DotsVertical, EditCircle, Trash, Id, Paperclip, Upload, ChartDots,
    XboxX, History, Printer, Check, X, CalendarStats, Phone, Mail, MapPin, Target, LayoutDashboard, Briefcase, Medal, FileCertificate, Eye, ArrowsLeftRight, LockOpen
} from 'tabler-icons-react';
import { GiPlayerPrevious as GiPlayerPreviousIcon, GiPlayerNext as GiPlayerNextIcon } from "react-icons/gi";
import dayjs from 'dayjs';
import { useTheme } from '@emotion/react';
import { getImageUrl } from '../../lib/helpers/image';

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

const allClasses = {
    firstDegree: { label: "الفريق الاول", color: "lime" },
    secondDegree: { label: "تحت 23 سنة", color: "orange" },
    young: { label: "تحت 18 سنة", color: "grape" },
    rookies: { label: "تحت 16 سنة", color: "indigo" }
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

    const person = (type === 'assembly' || type === 'transfer' || type === 'loan') ? data?.person || data : data?.person;
    if (!person) return null;

    const fullName = `${person?.first_name || ''} ${person?.second_name || ''} ${person?.third_name || ''} ${person?.tribe || ''}`.trim();
    const avatarUrl = person?.personal_picture ? getImageUrl(person.personal_picture) : '/unknow player.png';
    const age = person?.date_birth ? dayjs().diff(dayjs(person.date_birth), 'year') : 'N/A';
    
    const status = (type === 'transfer' || type === 'loan') ? data?.status || data?.lastTransfer?.status || data?.lastLoan?.status : data?.status;
    const isSuspended = status === 'suspended';

    const isAssemblyApproved = (() => {
        if (type === 'assembly') {
            const year = dayjs(data?.subscription_date).format("YYYY");
            const date1 = new Date(`${parseInt(year) + 1}-01-01`);
            const date2 = new Date();
            return date2 < date1;
        }
        return false;
    })();

    const renderStatusBadge = () => {
        if (type === 'assembly') {
            return !isAssemblyApproved ? <Badge color="red" variant="filled" size="xs">منتهي</Badge> : <Badge color="teal" variant="filled" size="xs">يعمل</Badge>;
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

    const statistics = [
        {
            label: 'الرقم المدني',
            value: person?.card_number || '-',
        },
        {
            label: 'التاريخ',
            value: data?.membership_date ? dayjs(data.membership_date).format('YYYY-MM-DD') : (data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD') : '-'),
        },
        {
            label: 'النوع',
            value: type === 'player' ? 'لاعب' : type === 'technical' ? 'جهاز فني' : type === 'member' ? 'عضو' : type === 'assembly' ? 'عمومية' : type === 'transfer' ? 'انتقال' : 'إعارة',
        },
    ];

    const getTransferInfo = () => {
        if (type === 'transfer' || type === 'loan') {
            const transfer = type === 'transfer' ? data?.lastTransfer : data?.lastLoan;
            const fromClub = transfer?.team_from?.name  || '-';
            const toClub = transfer?.team_to?.name  || '-';
            const dateStart = transfer?.date_start ? dayjs(transfer.date_start).format('YYYY-MM-DD') : null;
            const dateEnd = transfer?.date_end ? dayjs(transfer.date_end).format('YYYY-MM-DD') : null;
            return { fromClub, toClub, dateStart, dateEnd };
        }
        return null;
    };

    const transferInfo = getTransferInfo();

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
                                    <Badge color="dark" variant="filled">
                                        {type === 'player' ? 'لاعب' : type === 'technical' ? 'جهاز فني' : type === 'member' ? 'عضو' : type === 'assembly' ? 'عمومية' : 'آخر'}
                                    </Badge>
                                </Group>
                                <Flex align="center" gap={8} mb={16}>
                                    <Avatar 
                                        size={28} 
                                        radius="xl" 
                                        color="blue" 
                                        src={data?.team?.logo ? `${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${data.team.logo}` : null}
                                    >
                                        {data?.team?.name?.charAt(0) || 'L'}
                                    </Avatar>
                                    <Text weight={800} size="md" color="white">{data?.team?.name || 'النادي الرياضي'}</Text>
                                </Flex>
                            </Col>
                            <Col md={6} order={2}>
                                <Grid grow gutter="md">
                                    <Col span={6}>
                                        <Stack spacing={8}>
                                            <Box><Text color="white" opacity={0.8} size="10px">الرقم المدني</Text><Text color="white" weight={800}>{person?.card_number || '-'}</Text></Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">تاريخ الميلاد</Text><Text color="white" weight={800}>{person?.date_birth ? dayjs(person.date_birth).format('YYYY-MM-DD') : '-'}</Text></Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">العمر</Text><Text color="white" weight={800}>{age} سنة</Text></Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">النشاط</Text><Text color="white" weight={800}>{data?.activity || '-'}</Text></Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">الوظيفة</Text><Text color="white" weight={800}>{data?.job || '-'}</Text></Box>
                                        </Stack>
                                    </Col>
                                    <Col span={6}>
                                        <Stack spacing={8}>
                                            <Box><Text color="white" opacity={0.8} size="10px">رقم الهاتف</Text><Text color="white" weight={800}>{person?.phone || '-'}</Text></Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">تاريخ الانضمام</Text><Text color="white" weight={800}>{data?.membership_date ? dayjs(data.membership_date).format('YYYY-MM-DD') : '-'}</Text></Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">التصنيف</Text><Text color="white" weight={800}>{data?.classification || '-'}</Text></Box>
                                            {transferInfo?.dateStart && (
                                                <Box>
                                                    <Text color="white" opacity={0.8} size="10px">{type === 'loan' ? 'تاريخ بداية الإعارة' : 'تاريخ الانتقال'}</Text>
                                                    <Text color="white" weight={800}>{transferInfo.dateStart}</Text>
                                                </Box>
                                            )}
                                            {transferInfo?.dateEnd && type === 'loan' && (
                                                <Box>
                                                    <Text color="white" opacity={0.8} size="10px">تاريخ نهاية الإعارة</Text>
                                                    <Text color="white" weight={800}>{transferInfo.dateEnd}</Text>
                                                </Box>
                                            )}
                                            <Box>
                                                <Text color="white" opacity={0.8} size="10px">الدرجة</Text>
                                                <Text color="white" weight={800}>
                                                    {data?.class === 'firstDegree' ? 'الفريق الاول' : 
                                                     data?.class === 'secondDegree' ? 'تحت 23 سنة' :
                                                     data?.class === 'young' ? 'تحت 18 سنة' : 
                                                     data?.class === 'rookies' ? 'تحت 16 سنة' : (data?.class || '-')}
                                                </Text>
                                            </Box>
                                            <Box><Text color="white" opacity={0.8} size="10px">ملاحظات</Text><Text color="white" weight={800}>{data?.note || '-'}</Text></Box>
                                            {data?.parentApproval && (
                                                <Box>
                                                    <Text color="white" opacity={0.8} size="10px">موافقة ولي الأمر</Text>
                                                    <Text component="a" href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${data.parentApproval}`} target="_blank" weight={800} color="white" sx={{ textDecoration: 'underline' }}>عرض المرفق</Text>
                                                </Box>
                                            )}
                                            {data?.nationalID && (
                                                <Box>
                                                    <Box 
                                                        component="a" 
                                                        href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${data.nationalID}`} 
                                                        target="_blank" 
                                                        sx={{ 
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            textDecoration: 'none', 
                                                            '&:hover': { opacity: 0.8 } 
                                                        }}
                                                    >
                                                        <Text color="white" weight={800} size="sm">واجهة امامية</Text>
                                                        <Box sx={{ backgroundColor: '#f0fdf4', padding: 6, borderRadius: 8, display: 'flex' }}>
                                                            <Id size={20} color="#15803d" />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                            {data?.nationalIDBack && (
                                                <Box>
                                                    <Box 
                                                        component="a" 
                                                        href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${data.nationalIDBack}`} 
                                                        target="_blank" 
                                                        sx={{ 
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            textDecoration: 'none', 
                                                            '&:hover': { opacity: 0.8 } 
                                                        }}
                                                    >
                                                        <Text color="white" weight={800} size="sm">واجهة خلفية</Text>
                                                        <Box sx={{ backgroundColor: '#f0fdf4', padding: 6, borderRadius: 8, display: 'flex' }}>
                                                            <Id size={20} color="#15803d" />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Col>
                                </Grid>
                            </Col>
                        </Grid>
                    </Box>
                    <Box sx={{ backgroundColor: 'white', padding: '24px 0', borderTop: '1px solid #eee' }}>
                        <Grid grow gutter={0}>
                            <Col span={4} sx={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
                                <Text weight={800} size={24} color="slate.9">{person?.card_number || '-'}</Text>
                                <Text size="10px" color="gray.5" weight={700}>الرقم المدني</Text>
                            </Col>
                            <Col span={4} sx={{ textAlign: 'center', borderLeft: '1px solid #eee' }}>
                                <Text weight={800} size={24} color="slate.9">{age}</Text>
                                <Text size="10px" color="gray.5" weight={700}>العمر</Text>
                            </Col>
                            <Col span={4} sx={{ textAlign: 'center' }}>
                                <Text weight={800} size={24} color="slate.9">{status === 'accepted' ? 'نشط' : 'غير نشط'}</Text>
                                <Text size="10px" color="gray.5" weight={700}>الحالة</Text>
                            </Col>
                        </Grid>
                    </Box>
                </Box>
            </Modal>

            <Box sx={{ width: '100%', maxWidth: 380, margin: '0 auto', direction: 'rtl' }}>
                <Box sx={(theme) => ({
                    borderRadius: 24,
                    border: `1px solid ${theme.colors.gray[3]}`,
                    backgroundColor: theme.colors.gray[0],
                    overflow: 'hidden',
                    boxShadow: theme.shadows.md,
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
                                <Group spacing={4}>
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
                                                        <Menu.Item component="a" icon={<Printer size={14} />} href={`https://print.omkooora.com/#/${data?.id}`} target="_blank">طباعة البطاقة</Menu.Item>
                                                    )}
                                                </>
                                            ) : type === 'player' && status === 'accepted' ? (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.person?.id || data?.id)}>إضافة صورة</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onAddAttachment && onAddAttachment(data?.id)}>إضافة مرفقات</Menu.Item>}
                                                    {hasPermission("1") && <Menu.Item icon={<ChartDots size={14} />} onClick={() => onStatPlayer && onStatPlayer(data?.id)}>احصائيات اللاعب</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<LockOpen size={14} />} onClick={() => onFreePlayer && onFreePlayer(data?.id)}>تحرير اللاعب</Menu.Item>}
                                                </>
                                            ) : type === 'player' ? (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.person?.id || data?.id)}>إضافة صورة</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<Id size={14} />} onClick={() => onVerifyIdentity && onVerifyIdentity(data)}>تحقق</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Paperclip size={14} />} onClick={() => onAddAttachment && onAddAttachment(data?.id)}>إضافة مرفقات</Menu.Item>}
                                                    {hasPermission("1") && <Menu.Item icon={<ChartDots size={14} />} onClick={() => onStatPlayer && onStatPlayer(data?.id)}>احصائيات اللاعب</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                                                    {hasPermission("2") && <Menu.Item icon={<LockOpen size={14} />} onClick={() => onFreePlayer && onFreePlayer(data?.id)}>تحرير اللاعب</Menu.Item>}
                                                    {hasPermission("4") && <Menu.Item icon={<Trash size={14} color="red" />} color="red" onClick={() => onDelete && onDelete(data?.id)}>حذف</Menu.Item>}
                                                </>
                                            ) : (
                                                <>
                                                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل المعلومات</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.person?.id || data?.id)}>إضافة صورة</Menu.Item>}
                                                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                                                    {(type === 'technical' || type === 'member') && hasPermission("5") && status !== 'accepted' && (
                                                        <Menu.Item icon={<Check size={14} />} color="teal" onClick={() => onChangeStatus && onChangeStatus(data?.id, "accepted")}>قبول</Menu.Item>
                                                    )}
                                                    {(type === 'technical' || type === 'member') && hasPermission("5") && status !== 'rejected' && (
                                                        <Menu.Item icon={<X size={14} />} color="red" onClick={() => onChangeStatus && onChangeStatus(data?.id, "rejected")}>رفض</Menu.Item>
                                                    )}
                                                    {hasPermission("4") && <Menu.Item icon={<Trash size={14} color="red" />} color="red" onClick={() => onDelete && onDelete(data?.id)}>حذف</Menu.Item>}
                                                </>
                                            )}
                                            
                                            {type === 'player' && hasPermission("2") && (
                                                <>
                                                    <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onTransferPlayer && onTransferPlayer(data)}>نقل لاعب</Menu.Item>
                                                    <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onLoanPlayer && onLoanPlayer(data)}>إعارة لاعب</Menu.Item>
                                                </>
                                            )}
                                            
                                            {(type === 'transfer' || type === 'loan') && (data?.status === 'waiting' || data?.lastTransfer?.status === 'waiting' || data?.lastLoan?.status === 'waiting') && hasPermission("2") && (
                                                <>
                                                    <Menu.Item icon={<Check size={14} />} color="teal" onClick={() => onChangeStatus && onChangeStatus(data?.id || (type === 'transfer' ? data?.lastTransfer?.id : data?.lastLoan?.id), "accepted")}>قبول</Menu.Item>
                                                    <Menu.Item icon={<X size={14} />} color="red" onClick={() => onChangeStatus && onChangeStatus(data?.id || (type === 'transfer' ? data?.lastTransfer?.id : data?.lastLoan?.id), "rejected")}>رفض</Menu.Item>
                                                </>
                                            )}

                                            {type === 'loan' && (
                                                <>
                                                    <Menu.Item icon={<CalendarStats size={14} />} onClick={() => onRenewSubscription && onRenewSubscription(data?.lastLoan)}>تمديد</Menu.Item>
                                                    <Menu.Item icon={<Trash size={14} color="red" />} onClick={() => onDelete && onDelete(data?.lastLoan)}>إلغاء</Menu.Item>
                                                </>
                                            )}
                                            {hasPermission("8") && type !== 'assembly' && (
                                                <Menu.Item component="a" icon={<Printer size={14} />} href={`https://print.omkooora.com/#/${data?.id}`} target="_blank">طباعة البطاقة</Menu.Item>
                                            )}
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Box>

                            <Box sx={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }} onClick={() => onShowDetails && onShowDetails(data)}>
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
                                    <Group spacing={4} position="center" dir="rtl">
                                        <Text size="10px" color="blue.7" weight={600}>{transferInfo.fromClub}</Text>
                                        <ArrowsLeftRight size={10} color="gray" />
                                        <Text size="10px" color="teal.7" weight={600}>{transferInfo.toClub}</Text>
                                    </Group>
                                    {type === 'loan' && transferInfo.dateStart && (
                                        <Text size="8px" color="gray.6" weight={500}>
                                            من: {transferInfo.dateStart} إلى: {transferInfo.dateEnd || 'غير محدد'}
                                        </Text>
                                    )}
                                </Stack>
                            ) : (
                                <Text size="10px" color="gray.6">{data?.occupation || data?.player_center || 'عضو'} / {age} سنة</Text>
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
