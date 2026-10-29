import { ActionIcon, createStyles, Container, Flex, Box, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/router";
import {
    Home,
    BallFootball,
    Users,
    Inbox,
    CalendarEvent,
    Article,
    FileText,
    ShieldLock,
    BuildingCommunity,
    Trophy,
    Moneybag,
    InfoCircle,
    Coin,
    Route,
    ChevronRight,
    ChevronLeft,
} from "tabler-icons-react";
import { GiAbstract042, GiTrophyCup, GiPlayerNext } from "react-icons/gi";
import useStore from "../../store/useStore";
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
        top: 70, // Matches Header height
        height: 90,
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
        // The strip takes its content's own width, so the tabs that do not fit
        // are reached by scrolling the viewport around it — not by a second
        // scrolling box inside it, which the arrows could not steer.
        width: 'max-content',
    },
    link: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 24px',
        height: 90,
        textDecoration: 'none',
        fontSize: theme.fontSizes.sm,
        color: theme.colors.gray[6],
        fontWeight: 600,
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: 80,
        cursor: 'pointer',

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

type Pages = "members" | "technicals" | "players" | "assembly" | "inbox" | "outbox" | "meeting" | "forms" | "permissions" | "expenses" | "complaints" | "blogs";

const HorizontalNavbar = () => {
    const { classes, cx, theme } = useStyles();
    const router = useRouter();
    const userData = useStore((state: any) => state.userData);
    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState<any>({});

    useEffect(() => {
        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
            setPermissions({
                members: permission?.members?.split(",") || [],
                technicals: permission?.technicals?.split(",") || [],
                players: permission?.players?.split(",") || [],
                assembly: permission?.assembly?.split(",") || [],
                complaints: permission?.complaints?.split(",") || [],
                inbox: permission?.inbox?.split(",") || [],
                outbox: permission?.outbox?.split(",") || [],
                expenses: permission?.expenses?.split(",") || [],
                meeting: permission?.meeting?.split(",") || [],
                forms: permission?.forms?.split(",") || [],
                permissions: permission?.permissions?.split(",") || [],
                blogs: permission?.blogs?.split(",") || [],
            })
        }
    }, [userData])

    const hasPermission = (page: Pages, permissionVal: string) => {
        if (role && role === "1") return true;
        const permissionPage = permissions[page];
        if (permissionPage && permissionPage.length > 0) {
            return permissionPage.includes(permissionVal);
        }
        return false;
    };

    const navItems = [
        { path: '/', label: 'الرئيسية', icon: <Home size={20} />, show: true },
        { path: '/players_loan', label: 'إعارة اللاعبين', icon: <GiPlayerNext size={20} />, show: hasPermission("players", "1") },
        { path: '/players_transfer', label: 'انتقالات اللاعبين', icon: <GiPlayerNext size={20} />, show: hasPermission("players", "1") },
        { path: '/requests' , label: 'الطلبات', icon: <InfoCircle size={18} /> , show: true  },
        { path: '/tracking', label: 'تتبّع الطلبات', icon: <Route size={20} />, show: true },
        { path: '/payments', label: 'المدفوعات', icon: <Coin size={20} />, show: true },
        { path: '/messages', label: 'الرسائل', icon: <Inbox size={20} />, show: hasPermission("inbox", "1") || hasPermission("outbox", "1") },
        { path: 'expenses' , label: 'المصروفات', icon: <Moneybag size={18} /> , show : true},
        { path: '/meetings', label: 'الاجتماعات', icon: <CalendarEvent size={20} />, show: hasPermission("meeting", "1") },
        { path: '/blog', label: 'الأخبار', icon: <Article size={20} />, show: hasPermission("blogs", "1") },
        { path: '/forms', label: 'الاستثمارات', icon: <FileText size={20} />, show: hasPermission("forms", "1") },
        // الملاعب انتقلت إلى لوحة مستقلّة (stadium.omkooora.com) — أُزيلت من قائمة الفريق
        { path: '/leagues', label: 'المسابقات', icon: <GiTrophyCup size={20} />, show: true },
        { path: '/powers', label: 'الصلاحيات', icon: <ShieldLock size={20} />, show: hasPermission("permissions", "1") },
        { path: 'https://cheeryourteam.com/', label: 'شجع فريقك', icon: <BallFootball size={20} />, external: true, show: true },
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
                                const isMembersRelated = ['/members', '/technicalApparatus', '/players', '/assembly'].includes(router.pathname);
                                const isMessagesRelated = ['/messages', '/inbox', '/outbox'].includes(router.pathname);
                            
                                let isActive = router.pathname === item.path;
                                if (item.path === '/members') isActive = isMembersRelated;
                                if (item.path === '/messages') isActive = isMessagesRelated;

                                if (item.external) {
                                    return (
                                        <Box
                                            key={item.path}
                                            onClick={() => window.open(item.path, '_blank')}
                                            className={cx(classes.link, { [classes.linkActive]: isActive })}
                                            data-active={isActive || undefined}
                                            sx={(theme) => ({
                                                ...(item.path === 'https://cheeryourteam.com/' && {
                                                    backgroundColor: '#2563eb', 
                                                    color: 'white !important',
                                                    borderRadius: '12px',
                                                    height: '56px',
                                                    alignSelf: 'center',
                                                    padding: '0 20px',
                                                    boxShadow: theme.shadows.md,
                                                    '&:hover': {
                                                        backgroundColor: '#1d4ed8',
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
                                                data-active={isActive || undefined}
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
                    {rail.overflows && arrowButton("after")}
                </Flex>
            </Container>
        </Box>
    );
};

export default HorizontalNavbar;
