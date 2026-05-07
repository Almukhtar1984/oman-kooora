import { createStyles, Container, Flex, Box, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/router";
import {
    Home,
    BallFootball,
    Users,
    Inbox,
    Send,
    CalendarEvent,
    Article,
    FileText,
    BuildingCommunity,
    ArrowsLeftRight,
    Repeat,
    ShieldLock,
    Activity,
} from "tabler-icons-react";
import useStore from "../../store/useStore";
import { useEffect, useState } from "react";
import Link from "next/link";

const useStyles = createStyles((theme) => ({
    navbar: {
        backgroundColor: theme.white,
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
        boxShadow: theme.shadows.sm,
        position: 'sticky',
        top: 64, // Matches Header height
        height: 80,
        zIndex: 100,
        direction: 'rtl',
        [`@media (max-width: 720px)`]: {
            display: 'none',
        },
    },
    linksContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xl,
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        scrollbarWidth: 'none',
    },
    link: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 24px',
        height: 80,
        textDecoration: 'none',
        fontSize: theme.fontSizes.sm,
        color: theme.colors.gray[6],
        fontWeight: 600,
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: 80,

        '&:hover': {
            backgroundColor: theme.colors.gray[0],
            color: theme.colors.gray[9],
        },
    },
    linkActive: {
        borderBottom: `3px solid #F59E0B`, // accent-orange-dark
        color: '#F59E0B',
        backgroundColor: '#FFFBEB',
        '&:hover': {
            backgroundColor: '#FEF3C7',
            color: '#F59E0B',
        }
    },
}));

type Pages = "teams" | "members" | "technicals" | "players" | "transferPlayers" | "loanPlayers" | "assembly" | "inbox" | "outbox" | "meetings" | "blogs" | "forms" | "permissions" | "monitor";

const HorizontalNavbar = () => {
    const { classes, cx, theme } = useStyles();
    const router = useRouter();
    const userData = useStore((state: any) => state.userData);
    const [role, setRole] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (userData && "person" in userData && userData?.person?.clubManagement?.role !== null) {
            setRole(userData?.person?.clubManagement?.role);
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission;
            setPermissions({
                teams: permission?.teams?.split(",") || [],
                members: permission?.members?.split(",") || [],
                technicals: permission?.technicals?.split(",") || [],
                players: permission?.players?.split(",") || [],
                transferPlayers: permission?.transferPlayers?.split(",") || [],
                loanPlayers: permission?.loanPlayers?.split(",") || [],
                assembly: permission?.assembly?.split(",") || [],
                inbox: permission?.inbox?.split(",") || [],
                outbox: permission?.outbox?.split(",") || [],
                meetings: permission?.meeting?.split(",") || [],
                blogs: permission?.blogs?.split(",") || [],
                forms: permission?.forms?.split(",") || [],
                permissions: permission?.permissions?.split(",") || [],
                monitor: permission?.monitor?.split(",") || []
            });
        }
    }, [userData]);

    const hasPermission = (page: Pages, permissionValue: string) => {
        if (role && role === "1") return true;
        const permissionPage = permissions[page];
        if (permissionPage && permissionPage.length > 0) {
            return permissionPage.includes(permissionValue);
        }
        return false;
    };

    const navItems = [
        { path: '/', label: 'الرئيسية', icon: <Home size={20} />, show: true },
        { path: '/team', label: 'الفرق', icon: <BallFootball size={20} />, show: hasPermission("teams", "1") },
        { path: '/members', label: 'الأعضاء', icon: <Users size={20} />, show: hasPermission("members", "1") || hasPermission("technicals", "1") || hasPermission("players", "1") || hasPermission("assembly", "1") },
        { path: '/players_transfer', label: 'إنتقالات اللاعبين', icon: <ArrowsLeftRight size={20} />, show: hasPermission("transferPlayers", "1") },
        { path: '/players_loan', label: 'إعارات اللاعبين', icon: <Repeat size={20} />, show: hasPermission("loanPlayers", "1") },
        { path: '/messages', label: ' الرسائل', icon: <Inbox size={20} />, show: hasPermission("inbox", "1") },
        { path: '/meetings', label: 'الاجتماعات', icon: <CalendarEvent size={20} />, show: hasPermission("meetings", "1") },
        { path: '/blog', label: 'الأخبار', icon: <Article size={20} />, show: hasPermission("blogs", "1") },
        { path: '/forms', label: 'الاستثمارات', icon: <FileText size={20} />, show: hasPermission("forms", "1") },
        { path: '/powers', label: 'الصلاحيات', icon: <ShieldLock size={20} />, show: hasPermission("permissions", "1") },
        { path: '/monitor', label: 'المراقبة', icon: <Activity size={20} />, show: hasPermission("monitor", "1") },
        { path: 'https://cheeryourteam.com/', label: 'شجع فريقك', icon: <BallFootball size={20} />, external: true, show: true },
    ];

    return (
        <Box className={classes.navbar}>
            <Container size="xl" h="100%">
                <ScrollArea type="never" h="100%" sx={{ '& > div': { height: '100%' } }}>
                    <Flex className={classes.linksContainer} h="100%" align="center">
                        {navItems.filter(item => item.show).map((item) => {
                            // Make members active for any of its sub-pages if we keep them separate temporarily
                            const isMembersRelated = ['/members', '/technicalApparatus', '/players', '/assembly'].includes(router.pathname);
                            const isActive = item.path === '/members' ? isMembersRelated : router.pathname === item.path;

                            if (item.external) {
                                return (
                                    <Box
                                        key={item.path}
                                        onClick={() => window.open(item.path, '_blank')}
                                        className={cx(classes.link, { [classes.linkActive]: isActive })}
                                        sx={(theme) => ({
                                            ...(item.path === 'https://cheeryourteam.com/' && {
                                                backgroundColor: '#285afeff', // Deep blue
                                                color: 'white !important',
                                                borderRadius: '12px',
                                                height: '56px',
                                                alignSelf: 'center',
                                                padding: '0 20px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                                '&:hover': {
                                                    backgroundColor: '#557dffff',
                                                    transform: 'translateY(-2px)',
                                                },
                                                '& .mantine-Text-root': {
                                                    color: 'white !important',
                                                    fontWeight: 700,
                                                },
                                                '& svg': {
                                                    color: 'white !important',
                                                }
                                            })
                                        })}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {item.icon}
                                        </Box>
                                        <Text>{item.label}</Text>
                                    </Box>
                                );
                            } else {
                                return (
                                    <Link href={item.path} key={item.path} passHref legacyBehavior>
                                        <a
                                            className={cx(classes.link, { [classes.linkActive]: isActive })}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {item.icon}
                                            </Box>
                                            <Text>{item.label}</Text>
                                        </a>
                                    </Link>
                                );
                            }
                        })}
                    </Flex>
                </ScrollArea>
            </Container>
        </Box>
    );
};

export default HorizontalNavbar;
