import { AppShell,useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React from 'react';
import { Outlet } from 'react-router-dom';
import { MainHeader,SideBar } from './';

export const Layout = () => {
    const [opened, { toggle }] = useDisclosure();
    const theme = useMantineTheme();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: { base: 70, xs: "100%", sm: "50%", md: 70, lg: 70, xl: 70 },
                breakpoint: 'md',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header
                style={({ colors }) => ({
                    height: "60px",
                    borderBottom: "1px solid " + colors.gray[3],
                    width: "calc(100% - 70px)",
                    marginLeft: "0",
                    marginRight: "auto",
                })}
            >
                <MainHeader opened={opened} toggle={toggle} />
            </AppShell.Header>

            <AppShell.Navbar style={{
                position: "fixed",
                top: 0,
                bottom: 0,
                height: "100%"
            }}>
                <SideBar />
            </AppShell.Navbar>

            <AppShell.Main bg={theme.colors.gray[0]}>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    )
}
