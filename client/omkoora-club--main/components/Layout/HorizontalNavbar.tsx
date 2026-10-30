import { ActionIcon, Badge, createStyles, Container, Flex, Box, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/router";
import {
    Home,
    BallFootball,
    Users,
    Inbox,
    Bell,
    Send,
    CalendarEvent,
    Article,
    FileText,
    BuildingCommunity,
    ArrowsLeftRight,
    Repeat,
    ShieldLock,
    Activity,
    ChartBar,
    Scale,
    Trophy,
    Coin,
    Route,
    ChevronRight,
    ChevronLeft,
} from "tabler-icons-react";

// Public league/competitions site. Override with NEXT_PUBLIC_LEAGUE_URL.
const LEAGUE_URL = process.env.NEXT_PUBLIC_LEAGUE_URL || "https://league.omkooora.com";
import useStore from "../../store/useStore";
import { useClubPendingRequests } from "../../graphql";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    hasRailAfter, hasRailBefore, railDelta, railOverflows,
} from "../../lib/helpers/navRail";

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
        gap: theme.spacing.md,
        // Take the full content width inside the ScrollArea viewport so the
        // tabs that don't fit stay reachable by scrolling instead of being
        // clipped off-screen (the bar now holds 15 items).
        width: 'max-content',
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
    arrow: {
        // السهمان داخل الصفّ لا فوق الشريط: لو طافا عليه لحجبا أوّل تبويب
        // وآخره، والمقصود أن تُرى الصفحات لا أن تُغطّى.
        flexShrink: 0,
        backgroundColor: theme.white,
        borderColor: theme.colors.gray[3],
        boxShadow: theme.shadows.xs,
        '&:not(:disabled):hover': {
            backgroundColor: theme.colors.gray[0],
        },
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
                transferPlayers: permission?.transfer_players?.split(",") || [],
                loanPlayers: permission?.loan_players?.split(",") || [],
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

    // الطلبات المعلّقة: العدّاد الأحمر على الشريط، محسوب من العمل نفسه.
    const { data: pendingData } = useClubPendingRequests();
    const pendingTotal = pendingData?.clubPendingRequests?.total || 0;

    const navItems = [
        { path: '/', label: 'الرئيسية', icon: <Home size={20} />, show: true },
        { path: '/statistics', label: 'الإحصاء', icon: <ChartBar size={20} />, show: role === "1" },
        { path: '/committees', label: 'اللجان', icon: <Scale size={20} />, show: role === "1" },
        { path: '/team', label: 'الفرق', icon: <BallFootball size={20} />, show: hasPermission("teams", "1") },
        { path: '/members', label: 'الأعضاء', icon: <Users size={20} />, show: hasPermission("members", "1") || hasPermission("technicals", "1") || hasPermission("players", "1") || hasPermission("assembly", "1") },
        { path: '/membership', label: 'العضوية', icon: <Users size={20} />, show: hasPermission("assembly", "1") || hasPermission("players", "1") },
        { path: '/requests', label: 'الطلبات', icon: <Bell size={20} />, show: true, badge: pendingTotal },
        { path: '/players_transfer', label: 'إنتقالات اللاعبين', icon: <ArrowsLeftRight size={20} />, show: hasPermission("transferPlayers", "1") },
        { path: '/players_loan', label: 'إعارات اللاعبين', icon: <Repeat size={20} />, show: hasPermission("loanPlayers", "1") },
        { path: '/releases', label: 'إخلاء الطرف', icon: <ArrowsLeftRight size={20} />, show: hasPermission("transferPlayers", "1") },
        { path: '/tracking', label: 'مسار الطلبات', icon: <Route size={20} />, show: true },
        { path: '/payments', label: 'المدفوعات', icon: <Coin size={20} />, show: true },
        { path: '/messages', label: ' الرسائل', icon: <Inbox size={20} />, show: hasPermission("inbox", "1") },
        { path: '/meetings', label: 'الاجتماعات', icon: <CalendarEvent size={20} />, show: hasPermission("meetings", "1") },
        { path: LEAGUE_URL, label: 'المسابقات', icon: <Trophy size={20} />, external: true, show: true },
        { path: '/blog', label: 'الأخبار', icon: <Article size={20} />, show: hasPermission("blogs", "1") },
        { path: '/forms', label: 'الاستمارات', icon: <FileText size={20} />, show: hasPermission("forms", "1") },
        { path: '/powers', label: 'الصلاحيات', icon: <ShieldLock size={20} />, show: hasPermission("permissions", "1") },
        { path: '/monitor', label: 'المراقبة', icon: <Activity size={20} />, show: hasPermission("monitor", "1") },
    ];

    const visible = navItems.filter((item) => item.show);

    // الشريط: مرجع حاويته، وهل خلفه أو أمامه صفحات لا تُرى.
    const viewport = useRef<HTMLDivElement>(null);
    const [rail, setRail] = useState({ overflows: false, before: false, after: false });

    const readRail = useCallback(() => {
        const el = viewport.current;
        if (!el) return;
        setRail({ overflows: railOverflows(el), before: hasRailBefore(el), after: hasRailAfter(el) });
    }, []);

    // عرض النافذة يتغيّر، والصلاحيات تصل متأخّرةً فتطول القائمة — وفي الحالتين
    // يُعاد السؤال: أين طرفا الشريط الآن؟
    useEffect(() => {
        const el = viewport.current;
        if (!el) return;
        readRail();
        if (typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver(readRail);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [readRail, visible.length]);

    // والصفحة التي أنت فيها تُجلب إلى النظر: لو وقفت خارج الشريط لظننتَ أنك
    // لا تقف عليها. تُقاس بالمستطيلات لا بـ scrollLeft — الفرق بين موضعين
    // واحدٌ في كل المتصفحات، وإشارة scrollLeft ليست كذلك.
    useEffect(() => {
        const el = viewport.current;
        const active = el?.querySelector<HTMLElement>("[data-active]");
        if (!el || !active) return;

        const box = el.getBoundingClientRect();
        const item = active.getBoundingClientRect();
        if (item.left >= box.left && item.right <= box.right) return;
        el.scrollBy({ left: item.left + item.width / 2 - (box.left + box.width / 2) });
    }, [router.pathname, visible.length]);

    const nudge = (toward: "before" | "after") => {
        const el = viewport.current;
        if (!el) return;
        // اتجاه اللوحة هو ما يقرّر إشارة الخطوة، والشريط يتبع اتجاه ما حوله.
        el.scrollBy({ left: railDelta(el, toward, theme.dir === "rtl"), behavior: "smooth" });
    };

    // زرُّ تمرير واحد يُرسم مرّتين: يميناً للعودة، ويساراً للمتابعة.
    const arrowButton = (toward: "before" | "after") => {
        const label = toward === "before" ? "الصفحات السابقة" : "الصفحات التالية";
        return (
            <ActionIcon
                variant="default"
                radius="xl"
                size={36}
                className={classes.arrow}
                disabled={toward === "before" ? !rail.before : !rail.after}
                onClick={() => nudge(toward)}
                aria-label={label}
                title={label}
            >
                {toward === "before" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </ActionIcon>
        );
    };

    return (
        <Box className={classes.navbar}>
            <Container size="xl" h="100%">
                {/* اتجاه الصفّ من السمة لا من الأنماط: مُحوِّل الأنماط يقلب كل
                    direction مكتوبٍ في CSS، فيقع سهم العودة في جهة النهاية. */}
                <Flex h="100%" align="center" gap={6} dir={theme.dir}>
                    {rail.overflows && arrowButton("before")}
                    <ScrollArea
                        type="never"
                        h="100%"
                        viewportRef={viewport}
                        onScrollPositionChange={readRail}
                        sx={{ flex: 1, minWidth: 0, '& > div': { height: '100%' } }}
                    >
                        <Flex className={classes.linksContainer} h="100%" align="center">
                            {visible.map((item) => {
                                // Make members active for any of its sub-pages if we keep them separate temporarily
                                const isMembersRelated = ['/members', '/technicalApparatus', '/players', '/assembly'].includes(router.pathname);
                                const isActive = item.path === '/members' ? isMembersRelated : router.pathname === item.path;

                                if (item.external) {
                                    return (
                                        <Box
                                            key={item.path}
                                            onClick={() => window.open(item.path, '_blank')}
                                            className={cx(classes.link, { [classes.linkActive]: isActive })}
                                            data-active={isActive || undefined}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {item.icon}
                                            </Box>
                                            <Text>{item.label}</Text>
                                            {(item.badge ?? 0) > 0 && <Badge color="red" variant="filled" size="sm">{item.badge}</Badge>}
                                        </Box>
                                    );
                                } else {
                                    return (
                                        <Link href={item.path} key={item.path} passHref legacyBehavior>
                                            <a
                                                className={cx(classes.link, { [classes.linkActive]: isActive })}
                                                data-active={isActive || undefined}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {item.icon}
                                                </Box>
                                                <Text>{item.label}</Text>
                                                {(item.badge ?? 0) > 0 && <Badge color="red" variant="filled" size="sm">{item.badge}</Badge>}
                                            </a>
                                        </Link>
                                    );
                                }
                            })}
                        </Flex>
                    </ScrollArea>
                    {rail.overflows && arrowButton("after")}
                </Flex>
            </Container>
        </Box>
    );
};

export default HorizontalNavbar;
