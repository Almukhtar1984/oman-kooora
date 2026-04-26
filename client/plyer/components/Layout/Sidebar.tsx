import {createStyles, Navbar, ScrollArea, Image, Tooltip, Box, getStylesRef} from '@mantine/core';
import { useRouter } from 'next/router';
import {ClipboardList, Bulb, Icon, AlertCircle, Settings} from "tabler-icons-react";

interface _params {
    language: string;
}

const useStyles = createStyles((theme) => {
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
            height: "100%"
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

        lastLink: {
            marginTop: "auto",
            marginBottom: 20
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
    };
});

interface Props  {
    hidden: boolean
    toggleSideBar: () => void
    language?: string;
}

const linksSide: {link: string, label: string, icon: Icon | any}[] = [
    {link: "/", label: "شكاوي", icon: AlertCircle},
    {link: "/proposals", label: "مقترحات", icon: Bulb},
    {link: "/requests", label: "طلبات", icon: ClipboardList}
]

const Sidebar = ({hidden, toggleSideBar, language}: Props) => {
    const router = useRouter()
    const { classes, cx, theme } = useStyles();
    // const langSite:LangInterface = useStore((state: any) => state.langSite);

    const links = linksSide.map((item: any) => (
        <Tooltip key={item.label} label={item.label} position={"left"}>
            <a
                className={cx(classes.link, { [classes.linkActive]: item.link === router.pathname })}
                href={item.link}
                onClick={(event) => {
                    event.preventDefault()
                    router.push(item.link)
                    toggleSideBar()
                }}
            >
                {/*<span>{item.label}</span>*/}
                <item.icon color={theme.colors.cyan[5]} size={24} />
            </a>
        </Tooltip>
    ));

    return (
        <Navbar hiddenBreakpoint="md" hidden={hidden} width={{ xs: "100%", sm: "50%", md: 70, lg: 70, xl: 70  }} className={classes.navbar}>
            <span className={classes.closeNav} onClick={toggleSideBar} >+</span>
            <Box className={classes.header} p={5}>
                <Image
                    src={"/logo.jpg"}
                    alt="Tomoh"
                    fit={"contain"}
                    width={"50px"}
                    styles={(theme) => ({
                        image: {
                            width: "50px",
                            height: "50px"
                        }
                    })}
                />
            </Box>

            <Navbar.Section
                grow
                className={classes.main}
                p="15px"
                sx={{
                    "&.mantine-rtl-ScrollArea-root": {
                        overflow: "inherit"
                    }
                }}
            >
                {links}


                <Tooltip label={"إعدادات الحساب"} position={"left"}>
                    <a
                        className={cx(classes.link, classes.lastLink, { [classes.linkActive]: "/profile" === router.pathname })}
                        href={"/profile"}
                        onClick={(event) => {
                            event.preventDefault()
                            router.push("/profile")
                            toggleSideBar()
                        }}
                    >
                        <Settings color={theme.colors.cyan[5]} size={24} />
                    </a>
                </Tooltip>
            </Navbar.Section>
        </Navbar>
    );
};

export default Sidebar;
