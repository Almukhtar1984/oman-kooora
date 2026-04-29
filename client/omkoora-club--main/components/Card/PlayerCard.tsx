import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

import { Box, Flex, Text, Badge, Menu, ActionIcon, Group, Tooltip, Avatar, Stack, Divider, Grid, Col } from '@mantine/core';
import { DotsVertical, EditCircle, Trash, Id, Paperclip, Upload, ChartDots, XboxX, History, Eye, Check, X, ArrowsLeftRight, Printer, LockOpen } from 'tabler-icons-react';
import { GiPlayerPrevious as GiPlayerPreviousIcon, GiPlayerNext as GiPlayerNextIcon } from "react-icons/gi";

export interface PlayerData {
  id: string;
  membership_date?: string;
  subscription_date?: string;
  createdAt?: string;
  player_center?: string;
  status?: string;
  class?: string;
  activity?: string;
  job?: string;
  nationalID?: string;
  nationalIDBack?: string;
  note?: string;
  parentApproval?: string;
  classification?: string;
  attachmentsPlayer?: any[];
  transfer?: any[];
  person?: {
    first_name: string;
    second_name: string;
    third_name: string;
    tribe: string;
    personal_picture?: string;
    card_number?: string;
    date_birth?: string;
    phone?: string;
  };
  team?: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface PlayerCardProps {
  data: PlayerData;
  hasPermission?: (permission: string) => boolean;
  onEdit?: (data: any) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, status: string) => void;
  onVerifyIdentity?: (data: any) => void;
  onShowAttachments?: (data: any) => void;
  onAddAttachment?: (id: string) => void;
  onStatPlayer?: (data: PlayerData) => void;
  onTransferPlayer?: (data: any) => void;
  onLoanPlayer?: (data: any) => void;
  onOpenTransferHistory?: (data: any) => void;
  onAddSanction?: (data: any) => void;
  onUpdateSanction?: (data: any) => void;
  onShowDetails?: () => void;
  onChangeClassification?: (data: any) => void;
  onAddImage?: (id: string | any) => void;
  onConvertToTechnical?: (id: string) => void;
  onFreePlayer?: (id: string) => void;
}

const getFullName = (person: PlayerData['person']) => {
  if (!person) return '';
  return `${person.first_name || ''} ${person.second_name || ''} ${person.third_name || ''} ${person.tribe || ''}`.trim();
};

const getAvatarUrl = (photo?: string) => {
  return photo ? `${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${photo}` : '/unknow player.png';
};

/**
 * Compact Player Card (Mini View)
 */
export function PlayerCard1({ 
  data, hasPermission = () => true, onEdit, onDelete, onChangeStatus, onVerifyIdentity, 
  onShowAttachments, onAddAttachment, onStatPlayer, onTransferPlayer, onLoanPlayer, 
  onOpenTransferHistory, onAddSanction, onUpdateSanction, onShowDetails, onChangeClassification,
  onAddImage, onConvertToTechnical, onFreePlayer
}: PlayerCardProps) {
  const person = data?.person;
  const fullName = getFullName(person);
  const avatarUrl = getAvatarUrl(person?.personal_picture);
  const age = person?.date_birth ? dayjs().diff(dayjs(person.date_birth), 'year') : 'N/A';
  const isSuspended = data?.status === 'suspended';
  
  const statistics = [
    {
      label: 'الرقم المدني',
      value: person?.card_number || '-',
    },
    {
      label: 'تاريخ الانضمام',
      value: data?.membership_date ? dayjs(data.membership_date).format('YYYY-MM-DD') : (data?.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD') : '-'),
    },
    {
      label: 'مركز اللاعب',
      value: data?.player_center || '-',
    },
  ];

  const renderStatusBadge = () => {
    switch (data?.status) {
        case "accepted": return <Badge color="teal" variant="filled" size="xs">مقبول</Badge>;
        case "rejected": return <Badge color="red" variant="filled" size="xs">مرفوض</Badge>;
        case "waiting_club": return <Badge color="yellow" variant="filled" size="xs">قيد انتظار النادي</Badge>;
        case "waiting": return <Badge color="yellow" variant="filled" size="xs">قيد انتظار الفريق</Badge>;
        case "suspended": return <Badge color="red" variant="filled" size="xs">معاقب</Badge>;
        default: return <Badge color="yellow" variant="filled" size="xs">قيد الانتظار</Badge>;
    }
  };

  return (
    <Box sx={(theme) => ({
      width: '100%',
      maxWidth: 380,
      margin: '0 auto',
      padding: '0 8px',
      direction: 'rtl',
    })}>
      <Box sx={(theme) => ({
        borderRadius: 24,
        border: `1px solid ${theme.colors.gray[3]}`,
        backgroundColor: theme.colors.gray[0],
        overflow: 'hidden',
        boxShadow: theme.shadows.md,
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows.lg,
          borderColor: isSuspended ? theme.colors.red[5] : '#F59E0B'
        },
      })}>
        <Box sx={(theme) => ({
          backgroundColor: '#fff',
          padding: 16,
          borderBottom: `1px solid ${theme.colors.gray[2]}`,
          position: 'relative'
        })}>
          <Box sx={{ position: 'relative', overflow: 'hidden', paddingBottom: 12 }}>
            {/* Status and Actions Overlay */}
            <Box sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: 8,
              zIndex: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <Group spacing={4}>
                {renderStatusBadge()}
                {data?.class && (
                  <Badge 
                    sx={{ 
                      backgroundColor: '#f4fce3', 
                      color: '#69db7c',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '0 8px',
                      height: 20
                    }}
                  >
                    {data.class === 'firstDegree' ? 'الفريق الاول' : 
                     data.class === 'secondDegree' ? 'تحت 23 سنة' :
                     data.class === 'young' ? 'تحت 18 سنة' : 
                     data.class === 'rookies' ? 'تحت 16 سنة' : data.class}
                  </Badge>
                )}
              </Group>
              <Group spacing={4}>
                <Tooltip label="عرض التفاصيل">
                  <ActionIcon variant="filled" color="blue" size="sm" onClick={onShowDetails}>
                    <Eye size={16} />
                  </ActionIcon>
                </Tooltip>
                <Menu shadow="md" width={220} position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="filled" color="gray" size="sm" title='الخيارات'>
                      <DotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {hasPermission("3") && <Menu.Item icon={<EditCircle size={14} />} onClick={() => onEdit && onEdit(data)}>تعديل المعلومات</Menu.Item>}
                    {hasPermission("3") && <Menu.Item icon={<Upload size={14} />} onClick={() => onAddImage && onAddImage(data?.id)}>إضافة صورة</Menu.Item>}
                    {hasPermission("3") && <Menu.Item icon={<ArrowsLeftRight size={14} />} onClick={() => onChangeClassification && onChangeClassification(data)}>تغيير التصنيف</Menu.Item>}
                    {hasPermission("4") && <Menu.Item icon={<Trash size={14} color="red" />} color="red" onClick={() => onDelete && onDelete(data?.id)}>حذف</Menu.Item>}
                    {(data?.status === "waiting" || data?.status === "waiting_club") && hasPermission("5") && (
                      <Menu.Item icon={<Id size={14} />} onClick={() => onVerifyIdentity && onVerifyIdentity(data)}>تحقق من الهوية</Menu.Item>
                    )}
                    {data?.attachmentsPlayer && data.attachmentsPlayer.length > 0 && (
                      <Menu.Item icon={<Eye size={14} />} onClick={() => onShowAttachments && onShowAttachments(data)}>عرض المرفقات</Menu.Item>
                    )}
                    <Menu.Item icon={<Paperclip size={14} />} onClick={() => onAddAttachment && onAddAttachment(data?.id)}>إضافة مرفقات</Menu.Item>
                    <Menu.Item icon={<ChartDots size={14} />} onClick={() => onStatPlayer && onStatPlayer(data)}>احصائيات اللاعب</Menu.Item>
                    {data?.status === "accepted" && (
                      <>
                        {hasPermission("6") && (
                          <>
                            <Menu.Item icon={<GiPlayerPreviousIcon size={14} />} onClick={() => onTransferPlayer && onTransferPlayer(data)}>إنتقال اللاعب</Menu.Item>
                            <Menu.Item icon={<GiPlayerNextIcon size={14} />} onClick={() => onLoanPlayer && onLoanPlayer(data)}>إعارة اللاعب</Menu.Item>
                          </>
                        )}
                        {hasPermission("3") && <Menu.Item icon={<History size={14} />} onClick={() => onConvertToTechnical && onConvertToTechnical(data?.id)}>تحويل للجهاز الفني</Menu.Item>}
                        {hasPermission("2") && <Menu.Item icon={<LockOpen size={14} />} onClick={() => onFreePlayer && onFreePlayer(data?.id)}>تحرير اللاعب</Menu.Item>}
                      </>
                    )}
                    {data?.transfer && data.transfer.length > 0 && hasPermission("7") && (
                      <Menu.Item icon={<History size={14} />} onClick={() => onOpenTransferHistory && onOpenTransferHistory(data?.transfer)}>تاريخ إنتقال اللاعب</Menu.Item>
                    )}
                    {data?.status === "accepted" && (
                      <Menu.Item icon={<XboxX size={14} />} onClick={() => onAddSanction && onAddSanction(data)}>اضافة عقوبة</Menu.Item>
                    )}
                    {data?.status === "suspended" && (
                      <Menu.Item icon={<XboxX size={14} />} onClick={() => onUpdateSanction && onUpdateSanction(data)}>تحديث عقوبة</Menu.Item>
                    )}
                    {hasPermission("8") && (
                      <Menu.Item
                        component="a"
                        icon={<Printer size={14} />}
                        href={`https://print.omkooora.com/#/${data?.id}`}
                        target="_blank"
                      >
                        طباعة البطاقة
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Box>

            <Box sx={{ borderRadius: 16, overflow: 'hidden' }}>
              <Box sx={(theme) => ({
                position: 'relative',
                height: 300,
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
                <Box sx={{
                  position: 'absolute',
                  top: 40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1,
                  textAlign: 'center',
                  opacity: 0.2,
                  mixBlendMode: 'overlay',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 48,
                  lineHeight: 1,
                  fontStyle: 'italic',
                  width: '100%'
                }}>
                  <Text>{person?.first_name}</Text>
                  <Text style={{ marginTop: -8 }}>{person?.tribe}</Text>
                </Box>
                <Box
                  component="img"
                  src={avatarUrl}
                  alt="Player"
                  sx={{
                    zIndex: 2,
                    height: '95%',
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
                width: 40,
                height: 40,
                borderRadius: 12,
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
              <Text size="xl">{age}</Text>
            </Flex>
          </Box>

          <Box sx={{ textAlign: 'center', paddingTop: 12 }}>
            <Text size="lg" weight={700} color="slate.9" mb={4}>{fullName}</Text>
            <Text size="xs" color="gray.6">{data?.player_center || 'لاعب'} / {age} سنة</Text>
          </Box>
        </Box>

        <Grid gutter={0} sx={(theme) => ({
          backgroundColor: theme.colors.gray[0],
          padding: '16px 0',
          borderTop: `1px solid ${theme.colors.gray[2]}`,
        })}>
          {statistics.map((stat, idx) => (
            <Col key={stat.label} span={4} sx={(theme) => ({
              textAlign: 'center',
              borderLeft: idx > 0 ? `1px solid ${theme.colors.gray[3]}` : 'none'
            })}>
              <Text weight={700} size="sm">{stat.value}</Text>
              <Text size="10px" color="gray.5" weight={500}>{stat.label}</Text>
            </Col>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

/**
 * Detailed Player Stats View (Full View)
 */
export function PlayerStats1({ data }: PlayerCardProps) {
  const person = data?.person;
  const fullName = getFullName(person);
  const avatarUrl = getAvatarUrl(person?.personal_picture);
  const birthDate = person?.date_birth ? dayjs(person.date_birth).format('YYYY-MM-DD') : '-';
  const age = person?.date_birth ? dayjs().diff(dayjs(person.date_birth), 'year') : '-';
  const joinDate = (data?.membership_date || data?.subscription_date || data?.createdAt) 
    ? dayjs(data?.membership_date || data?.subscription_date || data?.createdAt).format('YYYY-MM-DD') 
    : '-';

  const metrics = [
    { label: 'الرقم المدني', value: person?.card_number || '-' },
    { label: 'تاريخ الميلاد', value: birthDate },
    { label: 'العمر', value: age },
    { label: 'رقم الهاتف', value: person?.phone || '-' },
    { label: 'تاريخ الانضمام', value: joinDate },
    { label: 'النشاط', value: data?.activity || '-' },
    { label: 'الوظيفة', value: data?.job || '-' },
    { label: 'مركز اللاعب', value: data?.player_center || '-' },
    { label: 'التصنيف', value: data?.classification || '-' },
    { 
      label: 'الدرجة', 
      value: data?.class === 'firstDegree' ? 'الفريق الاول' : 
             data?.class === 'secondDegree' ? 'تحت 23 سنة' :
             data?.class === 'young' ? 'تحت 18 سنة' : 
             data?.class === 'rookies' ? 'تحت 16 سنة' : (data?.class || '-') 
    },
    { label: 'ملاحظات', value: data?.note || '-' },
    { label: 'موافقة ولي الأمر', value: data?.parentApproval ? 'عرض المرفق' : '-' },
    { label: 'البطاقة المدنية (أمام)', value: data?.nationalID ? 'عرض المرفق' : '-' },
    { label: 'البطاقة المدنية (خلف)', value: data?.nationalIDBack ? 'عرض المرفق' : '-' }
  ];

  const statistics = [
    { label: 'الرقم المدني', value: person?.card_number || '-' },
    { label: 'العمر', value: age },
    { label: 'الحالة', value: data?.status === 'accepted' ? 'نشط' : 'غير نشط' },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto', direction: 'rtl' }}>
      <Box sx={(theme) => ({
        borderRadius: 20,
        border: `1px solid ${theme.colors.gray[3]}`,
        backgroundColor: '#FF9000',
        overflow: 'hidden'
      })}>
        <Grid gutter={0} sx={{ minHeight: 280, padding: 24 }} align="flex-end">
          <Col md={3} order={1} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
             <Avatar 
                src={avatarUrl}
                size={200}
                radius={0}
                styles={{ image: { objectFit: 'contain' } }}
              />
          </Col>
          
          <Col md={3} order={3} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ marginBottom: 20 }}>
              <Text weight={800} size={24} color="white" sx={{ lineHeight: 1 }}>{person?.first_name}</Text>
              <Text weight={800} size={48} color="white" sx={{ lineHeight: 1, marginTop: -6 }}>{person?.tribe}</Text>
            </Box>
            
            <Group spacing={8} mb={20}>
              <Badge color="yellow" variant="filled" size="xs" sx={{ color: '#000' }}>{data?.player_center || 'لاعب'}</Badge>
              <Badge color="dark" variant="filled" size="xs">
                {data?.status === 'accepted' ? 'نشط' : 'غير نشط'}
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
                    {metrics.slice(0, 7).map((metric) => (
                    <Box key={metric.label}>
                        <Text color="white" opacity={0.8} size="10px" weight={500}>{metric.label}</Text>
                        <Text color="white" weight={800} size="sm">{metric.value}</Text>
                    </Box>
                    ))}
                </Stack>
              </Col>
              <Col span={6}>
                <Stack spacing={8}>
                    {metrics.slice(7).map((metric) => (
                    <Box key={metric.label}>
                        <Text color="white" opacity={0.8} size="10px" weight={500}>{metric.label === 'البطاقة المدنية (أمام)' || metric.label === 'البطاقة المدنية (خلف)' ? '' : metric.label}</Text>
                        {metric.label === 'البطاقة المدنية (أمام)' || metric.label === 'البطاقة المدنية (خلف)' ? (
                            metric.value !== '-' && (
                                <Box 
                                    component="a" 
                                    href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${metric.label === 'البطاقة المدنية (أمام)' ? data.nationalID : data.nationalIDBack}`} 
                                    target="_blank" 
                                    sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        textDecoration: 'none', 
                                        '&:hover': { opacity: 0.8 } 
                                    }}
                                >
                                    <Text color="white" weight={800} size="sm">{metric.label === 'البطاقة المدنية (أمام)' ? 'واجهة امامية' : 'واجهة خلفية'}</Text>
                                    <Box sx={{ backgroundColor: '#f0fdf4', padding: 6, borderRadius: 8, display: 'flex' }}>
                                        <Id size={20} color="#15803d" />
                                    </Box>
                                </Box>
                            )
                        ) : metric.label === 'موافقة ولي الأمر' && metric.value !== '-' ? (
                            <Text 
                                component="a" 
                                href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${data.parentApproval}`} 
                                target="_blank" 
                                sx={{ color: '#fff', fontWeight: 800, fontSize: '14px', textDecoration: 'underline' }}
                            >
                                عرض المرفق
                            </Text>
                        ) : (
                            <Text color="white" weight={800} size="sm">{metric.value}</Text>
                        )}
                    </Box>
                    ))}
                </Stack>
              </Col>
            </Grid>
          </Col>
        </Grid>

        <Box sx={(theme) => ({
          backgroundColor: '#fff',
          padding: '24px 0',
          borderTop: `1px solid ${theme.colors.gray[2]}`,
        })}>
          <Grid grow gutter={0}>
            {statistics.map((stat, idx) => (
              <Col key={stat.label} span={4} sx={(theme) => ({
                textAlign: 'center',
                borderLeft: idx < statistics.length - 1 ? `1px solid ${theme.colors.gray[2]}` : 'none'
              })}>
                <Text weight={800} size={24} color="slate.9">{stat.value}</Text>
                <Text size="10px" color="gray.5" weight={700} transform="uppercase">{stat.label}</Text>
              </Col>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
