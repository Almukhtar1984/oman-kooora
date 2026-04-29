import {createStyles, Navbar, ScrollArea, Image, Tooltip, Box, getStylesRef, Overlay, Burger} from '@mantine/core';
import { useRouter } from 'next/router';
import {Home, Icon, Users, BallFootball, AlertCircle, Inbox, Send, CurrencyDollar, CalendarTime, Article, Key} from "tabler-icons-react";
import {GiAbstract042, GiPlayerNext, GiPlayerPrevious,GiTrophyCup } from "react-icons/gi";
import useStore from '../../store/useStore';
import {useEffect, useState} from "react";
import '../../styles/Home.module.css';
interface _params {
    language: string;
}

const useStyles = createStyles((theme, { language }: _params) => {
    const icon = getStylesRef('icon');
    return {
        navbar: {
            backgroundColor: theme.white,
            border: "none",
            paddingBottom: "5px",
            zIndex: 101,
            left: "0px !important",
            right: "auto !important",
            borderRight: "1px solid #ddd"
        },
        closeNav: {
            [theme.fn.largerThan('md')]: {
                display: 'none',
            },
            color: theme.white,
            zIndex: 102,
            top: "1%",
            right: 20,
            position: "absolute",
            fontWeight: 600,
            transform: "rotate(45deg)",
            fontSize: 30,
            cursor: "pointer"
        },

        header: {
            zIndex: 2,
            marginBottom: theme.spacing.md,
            display: "flex",
            justifyContent: "center",
            height: "60px",
            width: "100%",
            borderBottom: "1px solid #ddd"
        },

        main: {
            zIndex: 2,
        },

        link: {
            ...theme.fn.focusStyles(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: "center",
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            color: theme.white,
            // padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            borderRadius: theme.radius.sm,
            fontWeight: 500,
            height: "38px",
            width: "calc(70px - 32px)",

            '&:hover': {
                backgroundColor: theme.fn.variant({ variant: "light", color: theme.primaryColor }).background,
            },
        },

        linkIcon: {
            ref: icon,
            color: theme.white,
            opacity: 0.75,
            marginRight: theme.spacing.sm
        },

        linkActive: {
            '&, &:hover': {
                backgroundColor: theme.fn.variant({ variant: "light", color: theme.primaryColor }).background,
                [`& .${icon}`]: {
                    opacity: 0.9,
                },
            },
        },
        overlay: {
            [theme.fn.largerThan('md')]: {
                display: 'none',
            },
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
        },
        burger: {
            [theme.fn.largerThan('md')]: {
                display: 'none',
            },
            position: 'absolute',
            top: theme.spacing.sm,
            left: theme.spacing.sm,
            zIndex: 103,
        },
    };
});


interface Props  {
    hidden: boolean
    toggleSideBar: () => void
    language?: string;
}

const linksSide: {link: string, label: string, icon: Icon}[] = [
    {link: "/members", label: "مجلس الأدارة", icon: Users},
    {link: "/technicalApparatus", label: "الجهاز الفني", icon: Users},
    {link: "/players", label: "اللاعبين", icon: BallFootball},
    {link: "/assembly", label: "الجمعية العمومية", icon: Users},
    {link: "/requests", label: "شكاوى وطلبات واقتراحات اللاعبين", icon: AlertCircle},
    {link: "/inbox", label: "صندوق الوارد", icon: Inbox},
    {link: "/outbox", label: "صندوق الصادر", icon: Send},
    {link: "/expenses", label: "المصاريف", icon: CurrencyDollar},
    {link: "/meetings", label: "محضر الاجتماعات", icon: CalendarTime},
    {link: "/forms", label: "الاستمارات", icon: Article},
    {link: "/powers", label: "الصلاحيات", icon: Key}
]


type Pages = "members" | "technicals" | "players" | "assembly" | "inbox" | "outbox" | "meeting" | "forms" | "permissions" | "expenses" | "complaints" | "blogs";

const Sidebar = ({hidden, toggleSideBar, language}: Props) => {
    const router = useRouter()
    const { classes, cx, theme } = useStyles({language: language || "ar"});
    const userData = useStore((state: any) => state.userData);
    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState({
        members: [],
        technicals: [],
        players: [],
        assembly: [],
        complaints: [],
        inbox: [],
        outbox: [],
        expenses: [],
        meeting: [],
        forms: [],
        permissions: [],
        blogs: [],
        leagues: [],
     
    });

    useEffect(() => {
        if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
            setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2")
        }

        if (userData && "permission" in userData && userData.permission !== null) {
            const permission = userData?.permission
          
            setPermissions({
                members: permission?.members?.split(","),
                technicals: permission?.technicals?.split(","),
                players: permission?.players?.split(","),
                assembly: permission?.assembly?.split(","),
                complaints: permission?.complaints?.split(","),
                inbox: permission?.inbox?.split(","),
                outbox: permission?.outbox?.split(","),
                expenses: permission?.expenses?.split(","),
                meeting: permission?.meeting?.split(","),
                forms: permission?.forms?.split(","),
                permissions: permission?.permissions?.split(","),
                blogs: permission?.blogs?.split(","),
                leagues:permission?.members?.split(","),
            })
        }
    }, [userData])

    const hasPermission = (page: Pages, permission: string) => {
        if (role && role === "1") {
            return true
        } else {
            const permissionPage = permissions[page]
            if (permissionPage && permissionPage.length > 0) {
                const permissionChacked = permissionPage.filter((item: string) => item === permission)
                return permissionChacked.length > 0
            } else return false
        }
    }

    return (
        <>
        <Burger opened={!hidden} onClick={toggleSideBar} className={classes.burger} />
        {hidden && (
            <Overlay className={classes.overlay + " overlay-mobile"} onClick={toggleSideBar} sx={{display:"none"}} />
        )}
        <Navbar hiddenBreakpoint="md" hidden={hidden} width={{ xs: 70, sm: 70, md: 70, lg: 70, xl: 70  }} className={classes.navbar+ " navBar-mobile"} style={{zIndex:"9999999999"}}>
         
            <Box className={classes.header} p={5} sx={{ minHeight:"60px !important"}}>
            <Burger opened={!hidden} onClick={toggleSideBar} className={classes.burger} />
                <Image
                className='logo-side-bar'
                    src={`${userData?.person?.clubManagement?.club?.logo}`}
                    fit={"contain"}
                    width={"50px"}
                    height={"50px"}
                    styles={(theme) => ({
                        image: {
                            width: "50px",
                            height: "50px",
                           
                        }
                    })}
                />
            </Box>
            <Navbar.Section
                grow
                component={ScrollArea}
                className={classes.main}
                p="15px"
                styles={(theme) => ({
                    scrollbar: {
                        '&, &:hover': {
                            background: "transparent",
                        },
                    },
                })}

                sx={{
                    "&.mantine-rtl-ScrollArea-root": {
                        overflow: "inherit"
                    }
                }}
            >
                <Tooltip label={"الرئيسية"} position={"left"}>
                    <a
                        className={cx(classes.link, { [classes.linkActive]: "/" === router.pathname })}
                        href={"/"}
                        onClick={(event) => {
                            event.preventDefault()
                            router.push("/")
                            toggleSideBar()
                        }}
                    >
                        <Home color={theme.colors.blue[6]} size={24} />
                    </a>
                </Tooltip>

                {hasPermission("members", "1")
                    ? <Tooltip label={"مجلس الأدارة"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/members" === router.pathname })}
                            href={"/members"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/members")
                                toggleSideBar()
                            }}
                        >
                            <Users color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }

                {hasPermission("technicals", "1")
                    ? <Tooltip label={"الجهاز الفني"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/technicalApparatus" === router.pathname })}
                            href={"/technicalApparatus"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/technicalApparatus")
                                toggleSideBar()
                            }}
                        >
                            <Users color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("players", "1")
                    ? <Tooltip label={"اللاعبين"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/players" === router.pathname })}
                            href={"/players"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/players")
                                toggleSideBar()
                            }}
                        >
                            <BallFootball color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("assembly", "1")
                    ? <Tooltip label={"الجمعية العمومية"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/assembly" === router.pathname })}
                            href={"/assembly"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/assembly")
                                toggleSideBar()
                            }}
                        >
                            <Users color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("complaints", "1")
                    ? <Tooltip label={"شكاوى وطلبات واقتراحات اللاعبين"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/requests" === router.pathname })}
                            href={"/requests"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/requests")
                                toggleSideBar()
                            }}
                        >
                            <AlertCircle color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("inbox", "1")
                    ?  <Tooltip label={"صندوق الوارد"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/inbox" === router.pathname })}
                            href={"/inbox"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/inbox")
                                toggleSideBar()
                            }}
                        >
                            <Inbox color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("outbox", "1")
                    ?  <Tooltip label={"صندوق الصادر"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/outbox" === router.pathname })}
                            href={"/outbox"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/outbox")
                                toggleSideBar()
                            }}
                        >
                            <Send color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("expenses", "1")
                    ?  <Tooltip label={"المصاريف"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/expenses" === router.pathname })}
                            href={"/expenses"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/expenses")
                                toggleSideBar()
                            }}
                        >
                            <CurrencyDollar color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("meeting", "1")
                    ?  <Tooltip label={"محضر الاجتماعات"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/meetings" === router.pathname })}
                            href={"/meetings"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/meetings")
                                toggleSideBar()
                            }}
                        >
                            <CalendarTime color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("blogs", "1")
                    ? <Tooltip label={"الاخبار"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/blog" === router.pathname })}
                            href={"/blog"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/blog")
                                toggleSideBar()
                            }}
                        >
                            <Article color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("forms", "1")
                    ? <Tooltip label={"الاستمارات"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/forms" === router.pathname })}
                            href={"/forms"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/forms")
                                toggleSideBar()
                            }}
                        >
                            <Article color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {hasPermission("permissions", "1")
                    ? <Tooltip label={"الصلاحيات"} position={"left"}>
                        <a
                            className={cx(classes.link, { [classes.linkActive]: "/powers" === router.pathname })}
                            href={"/powers"}
                            onClick={(event) => {
                                event.preventDefault()
                                router.push("/powers")
                                toggleSideBar()
                            }}
                        >
                            <Key color={theme.colors.blue[6]} size={24} />
                        </a>
                    </Tooltip>
                    : null
                }
                {/*{hasPermission("permissions", "1")*/}
                {/*    ? */}
                <Tooltip label={"الملاعب"} position={"left"}>
                    <a
                        className={cx(classes.link, { [classes.linkActive]: "/stadiums" === router.pathname })}
                        href={"/stadiums"}
                        onClick={(event) => {
                            event.preventDefault()
                            router.push("/stadiums")
                            toggleSideBar()
                        }}
                    >
                        <GiAbstract042 color={theme.colors.blue[6]} size={24} />
                    </a>
                </Tooltip>
                <Tooltip label={"المسابقات"} position={"left"}>
                    <a
                        className={cx(classes.link, { [classes.linkActive]: "/leagues" === router.pathname })}
                        href={"/leagues"}
                        onClick={(event) => {
                            event.preventDefault()
                            router.push("/leagues")
                            toggleSideBar()
                        }}
                    >
                        <GiTrophyCup  color={theme.colors.blue[6]} size={24} />
                    </a>
                </Tooltip>
                {/*    : null*/}
                {/*}*/}
            </Navbar.Section>
        </Navbar>
        </>
    );
};

// @ts-ignore
export default Sidebar