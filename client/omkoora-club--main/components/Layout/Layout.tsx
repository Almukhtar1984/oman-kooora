import { Box, createStyles } from "@mantine/core";
import React, { ReactElement } from "react";
import Header from "./Header";
import HorizontalNavbar from "./HorizontalNavbar";
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
    
    // Auth routes where layout is simplified
    const isAuthRoute = ["/print", "/login", "/login/changePassword/[token]", "/login/forGotPassword", "/login/verification/[token]"].includes(router.pathname);

    return (
        <Box sx={(theme) => ({ backgroundColor: theme.colors.gray[0], minHeight: '100vh' })}>
            {!isAuthRoute && (
                <Box style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                    <Header />
                    <HorizontalNavbar />
                </Box>
            )}
            {isAuthRoute
                ? <Box dir="rtl">{props.children}</Box>
                : <Box px={"xl"} pb={"xl"} pt={"md"} dir="rtl">{props.children}</Box>
            }
        </Box>
    );
};

export default Layout;
