import { ActionIcon, Badge, createStyles, Container, Flex, Box, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/router";
import {
    Home,
    Users,
    Inbox,
    CalendarEvent,
    Article,
    FileText,
    ShieldLock,
    BuildingCommunity,
    Trophy,
    Moneybag,
    Route,
    ChevronRight,
    ChevronLeft,
} from "tabler-icons-react";
import { GiAbstract042, GiTrophyCup } from "react-icons/gi";
import useStore from "../../store/useStore";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    hasRailAfter, hasRailBefore, railDelta, railOverflows,
} from "../../lib/helpers/navRail";
import { activeSection, isItemActive, NavItem, resolveNav } from "../../lib/helpers/navSections";
import { useMyRequestFlows } from "../../graphql";

const useStyles = createStyles((theme) => ({
    navbar: {
        backgroundColor: theme.white,
        borderBottom: `1px solid ${theme.colors.gray[3]}`,
        boxShadow: theme.shadows.sm,
        position: 'sticky',
        top: 70, // Matches Header height
        // الصفّ الأوّل 90، ويطول بالصفّ الثاني حين يُفتح قسم.
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
    // الصفّ الثاني: صفحات القسم المفتوح. أخفض صوتاً من الصفّ الأوّل كي يُقرأ تابعاً
    // له، والصفحة المفتوحة منه بلون الشريط نفسه.
    subRow: {
        borderTop: `1px solid ${theme.colors.gray[2]}`,
        backgroundColor: theme.colors.gray[0],
    },
    subLinks: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 48,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
    },
    subLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: theme.radius.xl,
        fontSize: theme.fontSizes.sm,
        fontWeight: 600,
        color: theme.colors.gray[7],
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        border: '1px solid transparent',
        '&:hover': { backgroundColor: theme.white, borderColor: theme.colors.gray[3] },
        '&:focus-visible': { outline: `2px solid ${theme.colors.blue[5]}`, outlineOffset: 2 },
    },
    subLinkActive: {
        backgroundColor: theme.white,
        borderColor: '#F59E0B',
        color: '#B45309',
        '&:hover': { borderColor: '#F59E0B' },
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

    // ما ينتظر الفريق نفسه على مسار طلباته — رقمٌ على «الطلبات» كي لا يُضطرّ أن
    // يفتح التتبّع ليعرف أن عليه شيئاً: «لازم يروح يتتبّع حتى يشوف الطلب» (العميل).
    const [getFlows, { data: flowsData }] = useMyRequestFlows();
    useEffect(() => { getFlows({ fetchPolicy: "cache-and-network" }); }, [getFlows, router.pathname]);
    const myTurn = (flowsData?.myRequestFlows || [])
        .filter((flow: any) => !flow.done && flow.actor === "team" && flow.side === "team").length;

    const navItems: NavItem[] = [
        { path: '/', label: 'الرئيسية', icon: <Home size={20} />, show: true },
        // كل ما يخصّ الطلب في بندٍ واحد، كما في لوحة النادي.
        {
            path: '/tracking', label: 'الطلبات', icon: <Route size={20} />, show: true, badge: myTurn,
            children: [
                { path: '/tracking', label: 'طلباتي', badge: myTurn },
                { path: '/players_loan', label: 'الإعارات', show: hasPermission("players", "1") },
                { path: '/players_transfer', label: 'الانتقالات', show: hasPermission("players", "1") },
                { path: '/payments', label: 'المدفوعات' },
                { path: '/requests', label: 'طلبات اللاعبين' },
            ],
        },
        { path: '/messages', label: 'الرسائل', icon: <Inbox size={20} />, show: hasPermission("inbox", "1") || hasPermission("outbox", "1"), also: ['/inbox', '/outbox'] },
        { path: '/expenses', label: 'المصروفات', icon: <Moneybag size={18} />, show: true },
        { path: '/meetings', label: 'الاجتماعات', icon: <CalendarEvent size={20} />, show: hasPermission("meeting", "1") },
        { path: '/blog', label: 'الأخبار', icon: <Article size={20} />, show: hasPermission("blogs", "1") },
        { path: '/forms', label: 'الاستمارات', icon: <FileText size={20} />, show: hasPermission("forms", "1") },
        // الملاعب انتقلت إلى لوحة مستقلّة (stadium.omkooora.com) — أُزيلت من قائمة الفريق
        { path: '/leagues', label: 'المسابقات', icon: <GiTrophyCup size={20} />, show: true },
        { path: '/powers', label: 'الصلاحيات', icon: <ShieldLock size={20} />, show: hasPermission("permissions", "1") },
    ];

    const visible = resolveNav(navItems);
    const section = activeSection(visible, router.pathname);

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
            <Container size="xl" h={90}>
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
                                const isActive = isItemActive(item, router.pathname);

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
                                            {(item.badge ?? 0) > 0 && <Badge color="orange" variant="filled" size="sm">{item.badge}</Badge>}
                                        </a>
                                    </Link>
                                );
                            })}
                        </Flex>
                    </ScrollArea>
                    {rail.overflows && arrowButton("after")}
                </Flex>
            </Container>

            {section && (
                <Box className={classes.subRow}>
                    <Container size="xl">
                        <nav aria-label={section.label} className={classes.subLinks} dir={theme.dir}>
                            {section.children!.map((child) => {
                                const current = router.pathname === child.path;
                                return (
                                    <Link href={child.path} key={child.path} passHref legacyBehavior>
                                        <a
                                            className={cx(classes.subLink, { [classes.subLinkActive]: current })}
                                            aria-current={current ? "page" : undefined}
                                        >
                                            {child.label}
                                            {(child.badge ?? 0) > 0 && (
                                                <Badge color="orange" variant="filled" size="xs">{child.badge}</Badge>
                                            )}
                                        </a>
                                    </Link>
                                );
                            })}
                        </nav>
                    </Container>
                </Box>
            )}
        </Box>
    );
};

export default HorizontalNavbar;
