import { useLocation,useNavigate } from 'react-router-dom';
// import { useAllStore } from '../../graphql';
import { AppShell,Box,Image,Tooltip,useMantineTheme } from '@mantine/core';
import { IconHome } from "@tabler/icons-react";
import classes from "../../styles/Dashboard/SideBar.module.css";

export const SideBar = () => {
    const theme = useMantineTheme();

    const location = useLocation();
    const navigate = useNavigate();

    return (
        <Box className={classes.navbar}  >
            <Box className={classes.header} p={5}>
                <Image src={"/logo.jpg"} fit={"contain"} width={"50px"} height={"50px"}/>
            </Box>

            <AppShell.Section grow className={classes.main} p="15px">
                <Tooltip label={"الرئيسية"} position={"left"}>
                    <a
                        className={location.pathname === "/dashboard" ? classes.linkActive : classes.link}
                        href={"/dashboard"}
                        onClick={(event) => {
                            event.preventDefault()
                            navigate("/dashboard")
                            // toggleSideBar()
                        }}
                    >
                        <IconHome color={theme.colors.cyan[5]} size={24} />
                    </a>
                </Tooltip>
            </AppShell.Section>
        </Box>
    )
}