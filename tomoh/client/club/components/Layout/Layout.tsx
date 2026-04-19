import {AppShell, Box, createStyles} from "@mantine/core";
import React, { ReactElement } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useDisclosure } from '@mantine/hooks';
import {useRouter} from "next/router";
import useStore from "../../store/useStore";

const useStyles = createStyles((theme) => ({
    navbar: {
        backgroundColor: theme.white,
        marginBottom: 20, height: 60
    },

    user: {
        display: 'block',
        color: theme.white,
    },

    burger: {
        [theme.fn.largerThan('xs')]: {
            display: 'none',
        },
    },

}));

type Props = {
    disabled?: boolean;
    children: ReactElement;
};

const Layout = (props: Props) => {
    const isLayoutDisabled = useStore((state: any) => state.isLayoutDisabled);
    const { classes, theme, cx } = useStyles();
    const router = useRouter()
    const [opened, { toggle }] = useDisclosure(false);
    const language = "ar"//useStore((state: any) => state.language);

    return (
        <AppShell
            navbarOffsetBreakpoint="sm"
            asideOffsetBreakpoint="sm"
            hidden={isLayoutDisabled}
            padding={0}
            navbar={<Sidebar hidden={!opened} toggleSideBar={toggle} />}
            header={<Header />}
            styles={(theme) => ({
                main: { backgroundColor: theme.colors.gray[0], paddingTop: 0 },
            })}
        >
            {["/print", "/login", "/login/changePassword/[token]", "/login/forGotPassword", "/login/verification/[token]"].includes(router.pathname)
                ? <Box dir={language === "ar" ? "rtl" : "ltr"}>{props.children}</Box>
                : <Box p={"xl"} dir={language === "ar" ? "rtl" : "ltr"}>{props.children}</Box>
            }
        </AppShell>
    );
};

export default Layout;
