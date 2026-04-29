import { ActionIcon, Box, Button, Container, Flex, MantineTheme, Menu, Text, Tooltip, Divider, Burger, Drawer, Stack, Group, Avatar } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { ChevronDown, Logout, Search, BellRinging, User, ShieldLock, Activity, Home, BallFootball, Users, Inbox, Send, CalendarEvent, Article, FileText, ArrowsLeftRight, Repeat } from "tabler-icons-react";
import { useTheme } from "@emotion/react";
import { useDisclosure } from "@mantine/hooks";
import useStore from "../../store/useStore";
import { useRouter } from "next/router";
import { useLogout } from "../../graphql";
import { SearchPerson } from "../Modal";
import useSocket from "../../sockets/useSocket";
import { useAllNotificationClub, useMarkNotificationsAsRead } from "../../graphql"; // Import the hook
import { getTimeAgo } from "../../lib/helpers/Time"
import { notifications } from '@mantine/notifications';
import { format } from 'date-fns';
import { getImageUrl } from "../../lib/helpers/image";

type Props = {};

type Notification = {
    __typename: string;
    id: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    deletedAt: string;
    updatedAt: string;
};

const Header = (props: Props) => {
    const theme = useTheme() as MantineTheme;
    const userData = useStore((state: any) => state.userData);
    const [openprofileOptionMenu, setopenprofileOptionMenu] = useState<boolean>(false);
    const router = useRouter();
    const [logOut, { data }] = useLogout();
    const [openShowModal, setOpenShowModal] = useState<boolean>(false);
    const [notificationsList, setNotifications] = useState<Notification[]>([]);
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const { clubManagement } = userData?.person || {};
    const { club } = clubManagement || {};
    const clubId = club?.id;

    const [getNotifications, { loading, error, data: notificationsData }] = useAllNotificationClub();
    const [markAsRead] = useMarkNotificationsAsRead();

    const unreadCount = notificationsList.filter(n => !n.isRead).length;

    const onLogout = () => {
        logOut({
            onCompleted: ({ logOut }: any) => {
                router.push("/login/");
                useStore.setState({ token: undefined });
                useStore.setState({ isAuth: false });
                useStore.setState({ userData: {} });
            }
        });
    };

    const socket = useSocket();

    useEffect(() => {
        if (socket) {
            socket.on("newNotification", (newNotification: Notification) => {
                const updatedNotification = {
                    ...newNotification,
                    isRead: false,
                    createdAt: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
                };

                // Play notification sound
                try {
                    // @ts-ignore
                    if (window.__notificationAudio) {
                        // @ts-ignore
                        window.__notificationAudio.currentTime = 0;
                        // @ts-ignore
                        window.__notificationAudio.play().catch(err => console.error(err));
                    } else {
                        const audio = new Audio('/sound/notification.mp3');
                        audio.play().catch(err => console.error("Audio play failed:", err));
                    }
                } catch (error) {
                    console.error("Error initializing audio:", error);
                }

                setNotifications(prevNotifications => {
                    const notificationsWithNew = [updatedNotification, ...prevNotifications];
                    if (notificationsWithNew.length > 10) {
                        notificationsWithNew.pop();
                    }
                    notifications.clean()
                    notifications.show({
                        title: 'اشعار',
                        message: newNotification.body,
                        color: "red",
                    })
                    return notificationsWithNew;
                });
            });

            return () => {
                socket.off("newNotification");
            };
        }
    }, [socket]);

    useEffect(() => {
        if (!clubId) return;
        getNotifications({ variables: { idClub: clubId } }).catch(console.error);
    }, [clubId]);

    useEffect(() => {
        if (notificationsData) {
            setNotifications(notificationsData.allNotificationClub);
        }
    }, [notificationsData]);

    useEffect(() => {
        const handleFirstInteraction = () => {
            try {
                const audio = new Audio('/sound/notification.mp3');
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    // @ts-ignore
                    window.__notificationAudio = audio;
                }).catch(() => {});
            } catch (error) {}
        };
        
        
       
    }, []);


    const mobileNavLinks = [
        { path: '/', label: 'الرئيسية', icon: <Home size={18} /> },
        { path: '/team', label: 'الفرق', icon: <BallFootball size={18} /> },
        { path: '/members', label: 'الأعضاء', icon: <Users size={18} /> },
        { path: '/players_transfer', label: 'إنتقالات اللاعبين', icon: <ArrowsLeftRight size={18} /> },
        { path: '/players_loan', label: 'إعارات اللاعبين', icon: <Repeat size={18} /> },
        { path: '/messages', label: 'الرسائل', icon: <Inbox size={18} /> },
        { path: '/meetings', label: 'الاجتماعات', icon: <CalendarEvent size={18} /> },
        { path: '/blog', label: 'الأخبار', icon: <Article size={18} /> },
        { path: '/forms', label: 'الاستثمارات', icon: <FileText size={18} /> },
        { path: '/powers', label: 'الصلاحيات', icon: <ShieldLock size={18} /> },
        { path: '/monitor', label: 'المراقبة', icon: <Activity size={18} /> }, 
        { path: 'https://cheeryourteam.com/', label: 'شجع فريقك', icon: <BallFootball size={18} />, external: true },
    ];

    return (
        <Box
            sx={(theme) => ({
                height: "64px",
                width: "100%",
                background: "linear-gradient(to left, #1d4ed8, #2563eb)",
                boxShadow: theme.shadows.md,
                position: 'relative',
                zIndex: 1000
            })}
        >
            <Container size={"xl"} w="100%" h={"100%"}>
                <Flex align={"center"} h="100%" w="100%" justify={"space-between"}>

                    {/* Right Side: Burger (Mobile) + Logo + Name */}
                    <Flex align="center" gap={12}>
                        {/* Mobile Burger Toggle (Hidden on Desktop) */}
                        <Box sx={{
                            display: 'flex',
                            [`@media (min-width: 720px)`]: {
                                display: 'none !important'
                            }
                        }}>
                            <Burger
                                opened={drawerOpened}
                                onClick={toggleDrawer}
                                color="white"
                                size="sm"
                            />
                        </Box>

                        <Box>
                            <Text size="xl" weight={700} color="white">
                                {club?.name || "Team Omkooora"}
                            </Text>
                            <Text size={12} color="white" opacity={0.8} mt={-4} sx={{
                                [`@media (max-width: 600px)`]: {
                                    display: 'none'
                                }
                            }}>
                                نظام إدارة النادي
                            </Text>
                        </Box>
                        {club?.logo ? (
                            <Box w={40} h={40} sx={{ borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                <img src={getImageUrl(club.logo)} alt="Club Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </Box>
                        ) : (
                            <Box w={40} h={40} sx={{ borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Text size={20}>⚽</Text>
                            </Box>
                        )}
                    </Flex>



                    {/* Left Side: Actions */}
                    <Flex align={"center"} h="100%" gap={8}>


                        {/* Search */}
                        <Tooltip label={"البحث بالرقم المدني"} position={"bottom"}>
                            <ActionIcon variant="transparent" sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }} onClick={() => setOpenShowModal(true)}>
                                <Search size={20} color="white" />
                            </ActionIcon>
                        </Tooltip>

                        {/* Notifications */}
                        <Menu shadow="md" closeOnClickOutside width={250} onOpen={() => {
                            if (unreadCount > 0) {
                                markAsRead({ variables: { idClub: clubId } }).then(() => {
                                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                }).catch(console.error);
                            }
                        }}>
                            <Menu.Target>
                                <Tooltip label={"الإشعارات"} position={"bottom"}>
                                    <ActionIcon variant="transparent" sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                                        <BellRinging size={20} color="white" />
                                        {unreadCount > 0 && (
                                            <Box sx={{ 
                                                position: 'absolute', 
                                                top: -4, 
                                                right: -4, 
                                                minWidth: 16, 
                                                height: 16, 
                                                backgroundColor: '#ef4444', 
                                                borderRadius: '50%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                border: '2px solid #2563eb',
                                                padding: '0 4px'
                                            }}>
                                                <Text size={10} weight={700} color="white">{unreadCount}</Text>
                                            </Box>
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>الاشعارات</Menu.Label>
                                {notificationsList.length > 0 ? notificationsList.map((notification, index) => (
                                    <Menu.Item key={index} disabled sx={{ 
                                        backgroundColor: !notification.isRead ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                                        borderRight: !notification.isRead ? '3px solid #2563eb' : 'none'
                                    }}>
                                        <Text size="sm" weight={!notification.isRead ? 600 : 400} color={!notification.isRead ? "blue.9" : "gray.6"}>{notification.body}</Text>
                                        <Text size="xs" color="gray.4">{getTimeAgo(notification.createdAt)}</Text>
                                    </Menu.Item>
                                )) : (
                                    <Menu.Item disabled><Text size="sm" color="gray.5">لا توجد إشعارات</Text></Menu.Item>
                                )}
                            </Menu.Dropdown>
                        </Menu>

                        <Menu
                            shadow="md"
                            opened={openprofileOptionMenu}
                            onOpen={() => setopenprofileOptionMenu(true)}
                            onClose={() => setopenprofileOptionMenu(false)}
                            closeOnClickOutside
                            width={220}
                        >
                            <Menu.Target>
                                <Button
                                    variant="subtle"
                                    px="xs"
                                    h={40}
                                    sx={{
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                                        display: 'flex',
                                        [`@media (max-width: 720px)`]: {
                                            display: 'none !important'
                                        }
                                    }}
                                >
                                    <Flex align="center" gap={8}>
                                        <Box w={32} h={32} sx={{ borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} color="white" />
                                        </Box>
                                        <Text size="sm" weight={500}>
                                            {`${userData?.person?.first_name || ""} ${userData?.person?.second_name || ""}`.trim() || 'مستخدم'}
                                        </Text>
                                        <ChevronDown size={16} opacity={0.8} />
                                    </Flex>
                                </Button>
                            </Menu.Target>

                            <Menu.Dropdown p={0}>
                                <Box p="md" sx={{ borderBottom: '1px solid #E5E7EB' }}>
                                    <Text size="sm" weight={600} color="gray.8">
                                        {`${userData?.person?.first_name || ""} ${userData?.person?.second_name || ""} ${userData?.person?.third_name || ""} ${userData?.person?.tribe || ""}`.trim() || 'مستخدم'}
                                    </Text>
                                    <Text size="xs" color="gray.5">{userData?.email || ""}</Text>
                                </Box>
                                <Box p={4}>
                                    <Menu.Item color="red" icon={<Logout size={16} />} onClick={onLogout} sx={{ fontWeight: 500 }}>
                                        تسجيل الخروج
                                    </Menu.Item>
                                </Box>
                            </Menu.Dropdown>
                        </Menu>


                    </Flex>
                </Flex>
            </Container>

            {/* Mobile Navigation Drawer */}
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="70%"
                padding="md"
                position="right"
                withCloseButton={true}
            >
                <Stack spacing="xs" sx={{ direction: 'rtl' }}>
                    <Divider label="التنقل" labelPosition="center" />
                    {mobileNavLinks.map((nav: any) => (
                        <Box
                            key={nav.path}
                            onClick={() => {
                                if (nav.external) {
                                    window.open(nav.path, '_blank');
                                } else {
                                    router.push(nav.path);
                                }
                                closeDrawer();
                            }}
                            
                            sx={(theme) => ({
                                padding: '12px 16px',
                                borderRadius: theme.radius.sm,
                                cursor: 'pointer',
                                backgroundColor: router.pathname === nav.path ? theme.colors.blue[0] : 'transparent',
                                color: router.pathname === nav.path ? theme.colors.blue[7] : theme.colors.gray[7],
                                '&:hover': {
                                    backgroundColor: theme.colors.gray[1],
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                justifyContent: 'flex-start'
                            })}
                        >
                            <Box sx={{ color: router.pathname === nav.path ? theme.colors.blue[6] : theme.colors.gray[5] }}>
                                {nav.icon}
                            </Box>
                            <Text size="sm" weight={router.pathname === nav.path ? 600 : 500}>
                                {nav.label}
                            </Text>
                        </Box>
                    ))}

                    <Box mt="xl">
                        <Divider label="الحساب" labelPosition="center" mb="sm" />
                        <Box p="sm" mb="sm" sx={{ backgroundColor: theme.colors.gray[0], borderRadius: theme.radius.md }}>
                            <Text size="sm" weight={600} color="gray.8">
                                {`${userData?.person?.first_name || ""} ${userData?.person?.second_name || ""} ${userData?.person?.third_name || ""} ${userData?.person?.tribe || ""}`.trim() || 'مستخدم'}
                            </Text>
                            <Text size="xs" color="gray.5">{userData?.email || ""}</Text>
                        </Box>
                        
                        <Box
                            onClick={onLogout}
                            sx={(theme) => ({
                                padding: '12px 16px',
                                borderRadius: theme.radius.sm,
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                color: theme.colors.red[7],
                                border: `1px solid ${theme.colors.red[2]}`,
                                '&:hover': {
                                    backgroundColor: theme.colors.red[0],
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                justifyContent: 'flex-start'
                            })}
                        >
                            <Logout size={18} />
                            <Text size="sm" weight={500}>
                                تسجيل الخروج
                            </Text>
                        </Box>
                    </Box>
                </Stack>
            </Drawer>

            <SearchPerson title="بحث بالرقم المدني" opened={openShowModal} data={null} onClose={() => setOpenShowModal(false)} />
        </Box>
    );
};

export default Header;
