import React, { useState } from 'react'
import useStore from '../../store/useStore';
import {Box, Button, Container, Flex, MantineTheme, Menu, Text, useMantineTheme, } from "@mantine/core";
import Avvvatars from "avvvatars-react";
import {useNavigate} from "react-router-dom";
import {IconChevronDown, IconLogout} from "@tabler/icons-react";
import {useLogout} from "../../graphql";

interface Props {
    opened: boolean
    toggle: () => void
}

export const MainHeader = ({opened, toggle}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme() as MantineTheme;
    const [openprofileOptionMenu, setopenprofileOptionMenu] = useState<boolean>(false);

    const navigate = useNavigate();
    const [logOut] = useLogout()

    const onLogout = () => {
        logOut({
            onCompleted: ({logOut}: any) => {
                navigate("/")
                useStore.setState({ token: undefined });
                useStore.setState({ isAuth: false });

                useStore.setState({ userData: {} });
            }
        })
    }

    return (
        <Container size={"xl"} w="100%" h={"100%"}>
            <Flex align={"center"} h="100%" w="100%" justify={"space-between"}>
                <Flex align={"center"} h="100%" w={"100%"} direction="row-reverse" gap={12}>
                    {/* profile */}

                    <Menu
                        shadow="md"
                        opened={openprofileOptionMenu}
                        onOpen={() => setopenprofileOptionMenu(true)}
                        onClose={() => setopenprofileOptionMenu(false)}
                        closeOnClickOutside
                        width={178}
                    >
                        <Menu.Target>
                            <Button variant="subtle" h="auto" px="0" color={"gray.0"} bg={"#FFF"}>
                                <Box
                                    style={({ colors }) => ({
                                        border: "1px solid " + colors.gray[3],
                                        borderRadius: "4px",
                                        height: 46,
                                        padding: "0   8px",
                                        minWidth: 176,
                                    })}
                                >
                                    <Flex align={"center"} gap="22px" w="100%" h="100%">
                                        <Flex gap="8px" h="100%" align={"center"}>
                                            <Box
                                                style={({ colors }) => ({
                                                    border: "1px solid " + colors.gray[3],
                                                    borderRadius: "50%",
                                                })}
                                            >
                                                <Avvvatars value="a" style="shape" size={34} border={true} borderColor="#FFFFFF" borderSize={2}/>
                                            </Box>
                                            <Flex direction={"column"} align={'flex-start'} gap="3px">
                                                <Text size={"15px"} c={theme.colors.gray[6]} fw="400">
                                                    {`${userData?.person?.first_name || ""} ${userData?.person?.second_name || ""}`}
                                                </Text>
                                                <Text size={"14px"} c={theme.colors.gray[4]} fw="400">{userData?.email}</Text>
                                            </Flex>
                                        </Flex>
                                        <IconChevronDown size="20px" strokeWidth={2} color={theme.colors.gray[5]} />
                                    </Flex>
                                </Box>
                            </Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={onLogout}>
                                تسجيل الخروج
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Flex>
            </Flex>
        </Container>
    )
}