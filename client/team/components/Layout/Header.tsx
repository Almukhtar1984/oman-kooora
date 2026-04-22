import {ActionIcon, Box, Button, Container, Flex, MantineTheme, Menu, Text, Tooltip} from "@mantine/core";
import React from "react";
import { ChevronDown, Logout, Search } from "tabler-icons-react";
import { useTheme } from "@emotion/react";
import Avvvatars from "avvvatars-react";
import { useState } from "react";
import useStore from "../../store/useStore";
import {useRouter} from "next/router";
import {useLogout} from "../../graphql";
import { SearchPerson } from "../Modal";

type Props = {};

const Header = (props: Props) => {
    const theme = useTheme() as MantineTheme;
    const userData = useStore((state: any) => state.userData);
    const [openprofileOptionMenu, setopenprofileOptionMenu] = useState<boolean>(false);
    const router = useRouter()
    const [logOut, { data }] = useLogout()
    const [openShowModal, setOpenShowModal] = useState<boolean>(false);

    const onLogout = () => {
        logOut({
            onCompleted: ({logOut}: any) => {
                router.push("/login/")
                useStore.setState({ token: undefined });
                useStore.setState({ isAuth: false });

                useStore.setState({ userData: {} });
            }
        })
    }

    return (
        <Box
            sx={({ colors }) => ({
                height: "60px",
                width: "100%",
                borderBottom: "1px solid " + colors.gray[3],
                [theme.fn.largerThan("md")]: {
                    width: "calc(100% - 70px)",
                    marginRight: "0",
                    marginLeft: "auto",
                }
            })}
        >
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
                                        sx={({ colors }) => ({
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
                                                    sx={({ colors }) => ({
                                                        border: "1px solid " + colors.gray[3],
                                                        borderRadius: "50%",
                                                    })}
                                                >
                                                    <Avvvatars value="a" style="shape" size={34} border={true} borderColor="#FFFFFF" borderSize={2}/>
                                                </Box>
                                                <Flex direction={"column"} gap="0">
                                                    <Text size={"xs"} color={"gray.6"} fw="400">
                                                        {`${userData?.person?.first_name} ${userData?.person?.second_name} ${userData?.person?.third_name} ${userData?.person?.tribe}`}
                                                    </Text>
                                                    <Text size={"2xs" as any} color={"gray.4"} fw="400">{userData?.email}</Text>
                                                </Flex>
                                            </Flex>
                                            <ChevronDown size="20px" strokeWidth={2} color={theme.colors.gray[5]} />
                                        </Flex>
                                    </Box>
                                </Button>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Item color="red" icon={<Logout size={16} />} onClick={onLogout}>
                                    تسجيل الخروج
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                        
                        <Tooltip label={"البحث بالرفم المدني"} position={"left"}>
                            <ActionIcon variant="light" color="cyan" onClick={() => setOpenShowModal(true)}>
                                <Search size={20} />
                            </ActionIcon>
                        </Tooltip>
                    </Flex>
                </Flex>
            </Container>

            <SearchPerson  title="بحث بالرقم المدني" opened={openShowModal} data={null} onClose={() => setOpenShowModal(false)} />
        </Box>
    );
};

export default Header;
