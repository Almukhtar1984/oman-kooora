import { Filter, Search, Calendar } from "tabler-icons-react";
import { IconDatabaseOff } from "@tabler/icons-react";
import { useTheme } from "@emotion/react";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { Button, Box, Grid, Col, Group, Pagination, Stack, Text, TextInput, Select, Menu, ActionIcon, MantineTheme, RingProgress, Divider } from "@mantine/core";
import { MemberCard } from "../Card/MemberCard";
import { searchSortedData, sortedData } from "../../lib/helpers/sort";

interface MemberSectionProps {
    list: any[];
    type: 'player' | 'technical' | 'member' | 'assembly';
    hasPermission: (permission: string) => boolean;
    onEdit?: (data: any) => void;
    onDelete?: (id: string) => void;
    onChangeStatus?: (id: string, status: string) => void;
    onVerifyIdentity?: (data: any) => void;
    onShowAttachments?: (data: any) => void;
    onAddAttachment?: (id: string) => void;
    onStatPlayer?: (data: any) => void;
    onTransferPlayer?: (data: any) => void;
    onLoanPlayer?: (data: any) => void;
    onOpenTransferHistory?: (data: any) => void;
    onAddSanction?: (data: any) => void;
    onUpdateSanction?: (data: any) => void;
    onChangeClassification?: (data: any) => void;
    onShowDetails?: (data: any) => void;
    onRenewSubscription?: (data: any) => void;
    onAddImage?: (id: string | any) => void;
    onConvertToTechnical?: (id: string) => void;
    onFreePlayer?: (id: string) => void;
}

const LegendItem = ({ color, label, count }: { color: string; label: string; count: number }) => {
    const theme = useTheme() as MantineTheme;
    return (
        <Group spacing={8}>
            <Box w={10} h={10} sx={{ borderRadius: "50%", backgroundColor: theme.colors[color][6] }} />
            <Text size="xs" weight={500} color="gray.7">{label}: {count}</Text>
        </Group>
    );
};

export const MemberSection = (props: MemberSectionProps) => {
    const { list, type, hasPermission, ...handlers } = props;
    const theme = useTheme() as MantineTheme;
    
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(type === 'assembly' ? 'all' : null);
    const [classFilter, setClassFilter] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [filteredList, setFilteredList] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        let result = sortedData(list);

        if (type === 'assembly') {
            // 2. Status Filter
            if (statusFilter && statusFilter !== "all") {
                result = result.filter((item: any) => {
                    const year = dayjs(item?.subscription_date).format("YYYY");
                    const date1 = new Date(`${parseInt(year) + 1}-01-01`);
                    const date2 = new Date();
                    const isExpired = date2 >= date1;
                    return statusFilter === "active" ? !isExpired : isExpired;
                });
            }

            // 3. Date Range Filter
            if (dateFrom || dateTo) {
                result = result.filter((item: any) => {
                    const subDate = dayjs(item?.subscription_date);
                    if (dateFrom && subDate.isBefore(dayjs(dateFrom), 'day')) return false;
                    if (dateTo && subDate.isAfter(dayjs(dateTo), 'day')) return false;
                    return true;
                });
            }

            // 4. Sort
            result.sort((a: any, b: any) => {
                const dateA = dayjs(a.membership_date || a.createdAt);
                const dateB = dayjs(b.membership_date || b.createdAt);
                return sortOrder === "desc" 
                    ? (dateB.isAfter(dateA) ? 1 : -1) 
                    : (dateA.isAfter(dateB) ? 1 : -1);
            });
        } else {
            if (statusFilter) {
                result = result.filter((item: any) => item?.status === statusFilter);
            }

            if (classFilter) {
                result = result.filter((item: any) => item?.class === classFilter);
            }
        }

        if (searchValue) {
            result = searchSortedData(
                result,
                ['person.first_name', "person.second_name", "person.third_name", "person.tribe", "person.phone", "person.card_number", "occupation", "classification"],
                searchValue
            );
        }

        setFilteredList(result);
        setPage(1);
    }, [list, statusFilter, searchValue, classFilter, dateFrom, dateTo, sortOrder]);

    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const paginatedItems = filteredList.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Stack spacing="md">
            <Group position="apart">
                <Group>
                    <TextInput 
                        placeholder="بحث..." 
                        icon={<Search size={16} />} 
                        value={searchValue} 
                        onChange={(e) => setSearchValue(e.target.value)} 
                    />
                    <Menu position="bottom-start" withArrow shadow="md" closeOnItemClick={false} width={type === 'assembly' ? 300 : undefined}>
                        <Menu.Target>
                            <Button variant="outline" color="gray" leftIcon={<Filter size={16} />} size="sm">
                                {type === 'assembly' ? "الفلترة والترتيب" : "الفلترة"}
                            </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {type === 'assembly' ? (
                                <Stack p="md" spacing="sm">
                                    <Text size="xs" weight={700} color="gray.7">الحالة</Text>
                                    <Group grow spacing="xs">
                                        <Button size="xs" variant={statusFilter === 'all' ? 'filled' : 'outline'} onClick={() => setStatusFilter('all')}>الكل</Button>
                                        <Button size="xs" variant={statusFilter === 'active' ? 'filled' : 'outline'} onClick={() => setStatusFilter('active')} color="teal">يعمل</Button>
                                        <Button size="xs" variant={statusFilter === 'expired' ? 'filled' : 'outline'} onClick={() => setStatusFilter('expired')} color="red">منتهي</Button>
                                    </Group>

                                    <Divider />
                                    <Text size="xs" weight={700} color="gray.7">تاريخ الاشتراك</Text>
                                    <Group grow spacing="xs">
                                        <DatePickerInput
                                            clearable
                                            placeholder="من"
                                            value={dateFrom}
                                            onChange={setDateFrom}
                                            icon={<Calendar size={14} />}
                                            size="xs"
                                        />
                                        <DatePickerInput
                                            clearable
                                            placeholder="إلى"
                                            value={dateTo}
                                            onChange={setDateTo}
                                            icon={<Calendar size={14} />}
                                            size="xs"
                                        />
                                    </Group>

                                    <Divider />
                                    <Text size="xs" weight={700} color="gray.7">الترتيب حسب تاريخ العضوية</Text>
                                    <Group grow spacing="xs">
                                        <Button size="xs" variant={sortOrder === 'desc' ? 'filled' : 'outline'} onClick={() => setSortOrder('desc')}>الأحدث</Button>
                                        <Button size="xs" variant={sortOrder === 'asc' ? 'filled' : 'outline'} onClick={() => setSortOrder('asc')}>الأقدم</Button>
                                    </Group>
                                </Stack>
                            ) : (
                                <Box p="xs">
                                    <Select
                                        label="الحالة"
                                        placeholder="اختر الحالة"
                                        clearable
                                        value={statusFilter}
                                        onChange={setStatusFilter}
                                        data={[
                                            { label: 'مقبول', value: 'accepted' },
                                            { label: 'مرفوض', value: 'rejected' },
                                            { label: 'قيد الانتظار', value: 'waiting' },
                                            { label: 'بانتظار النادي', value: 'waiting_club' },
                                            { label: 'معاقب', value: 'suspended' },
                                        ]}
                                        mb="sm"
                                    />
                                    <Select
                                        label="الفئة"
                                        placeholder="اختر الفئة"
                                        clearable
                                        value={classFilter}
                                        onChange={setClassFilter}
                                        data={[
                                            { label: "الفريق الاول", value: "firstDegree" },
                                            { label: "تحت 23 سنة", value: "secondDegree" },
                                            { label: "تحت 18 سنة", value: "young" },
                                            { label: "تحت 16 سنة", value: "rookies" }
                                        ]}
                                    />
                                </Box>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                </Group>
                <Text size="sm" color="dimmed">{filteredList.length} نتائج</Text>
            </Group>

            {paginatedItems.length > 0 ? (
                <>
                    <Grid gutter="xl">
                        {paginatedItems.map((item) => (
                            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                                <MemberCard 
                                    data={item} 
                                    type={type}
                                    hasPermission={hasPermission}
                                    {...handlers}
                                />
                            </Col>

                        ))}
                    </Grid>
                    {totalPages > 1 && (
                        <Group position="center" mt="xl">
                            <Pagination total={totalPages} value={page} onChange={setPage} color="blue" radius="xl" />
                        </Group>
                    )}

                    {type === 'player' && (
                        <Box mt={30} sx={{ borderTop: "1px solid #eee", paddingTop: 20 }}>
                            <Text weight={700} mb="md">توزيع الحالة</Text>
                            <Group spacing={40}>
                                <RingProgress
                                    size={120}
                                    thickness={12}
                                    sections={[
                                        { value: (list.filter((p: any) => p.status === 'accepted').length / (list.length || 1)) * 100, color: 'teal' },
                                        { value: (list.filter((p: any) => p.status === 'waiting' || p.status === 'waiting_club').length / (list.length || 1)) * 100, color: 'orange' },
                                        { value: (list.filter((p: any) => p.status === 'rejected').length / (list.length || 1)) * 100, color: 'red' },
                                    ]}
                                    label={<Text ta="center" size="xs" weight={700}>{list.length}</Text>}
                                />
                                <Stack spacing={4}>
                                    <LegendItem color="teal" label="مقبول" count={list.filter((p: any) => p.status === 'accepted').length} />
                                    <LegendItem color="orange" label="قيد الانتظار" count={list.filter((p: any) => p.status === 'waiting' || p.status === 'waiting_club').length} />
                                    <LegendItem color="red" label="مرفوض" count={list.filter((p: any) => p.status === 'rejected').length} />
                                </Stack>
                            </Group>
                        </Box>
                    )}
                </>
            ) : (
                <Stack mih={300} align="center" justify="center">
                    <IconDatabaseOff size={64} strokeWidth={1} color={theme.colors.gray[4]} />
                    <Text color="dimmed">لا توجد بيانات تطابق البحث</Text>
                </Stack>
            )}
        </Stack>
    );
};
