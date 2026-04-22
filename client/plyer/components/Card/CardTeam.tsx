import { useTheme } from "@emotion/react";
import {
    ActionIcon,
    Avatar,
    Box,
    BoxProps,
    Flex,
    MantineTheme,
    Menu,
    Divider,
    Text,
    Tooltip,
    Badge,
    Space
} from "@mantine/core";
import {DotsVertical, Edit, Lock, LockOpen, Phone, Plus, Trash, User,} from "tabler-icons-react";
import React, { ReactElement, useState } from "react";
import { Router, useRouter } from "next/router";
import dayjs from "dayjs";

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    onChangeStatusModal: (callback?: () => any) => void;
    setOpenAddAdminModal: (callback?: () => any) => void;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardTeam = ({ data, onEditModal, onDeleteModal, onChangeStatusModal, setOpenAddAdminModal, ...props }: Props) => {
    const [openCardOptionMenu, setopenCardOptionMenu] = useState<boolean>(false);

    const theme = useTheme() as MantineTheme;
    let route = useRouter();

    return (
        <>
            <Box
                {...props}
                p={16}
                bg="white"
                sx={({ colors, shadows }) => ({
                    borderRadius: 4,
                    outline: "1px solid " + colors.gray[3],
                    //   boxShadow: shadows.sm,
                })}
            >
                <Flex direction={"column"}>
                    {/* top  */}
                    <Flex justify={"space-between"} align="top" w="100%">
                        <Flex gap="10px" h="100%" align={"center"}>
                            <Avatar src={data?.logo as string} alt={data?.logo as string} size={38} radius={20}/>
                            <Flex direction={"column"} gap="0">
                                <Text size={"md"} color={"gray.6"}>
                                    {`${data?.name} (${data?.activities})`}
                                </Text>
                                <Text size={"xs"} color={"gray.5"}>{data?.manager_name}</Text>
                            </Flex>
                        </Flex>
                        <Menu
                            withArrow
                            shadow="md"
                            opened={openCardOptionMenu}
                            onOpen={() => setopenCardOptionMenu(true)}
                            onClose={() => setopenCardOptionMenu(false)}
                            closeOnClickOutside
                        >
                            <Menu.Target>
                                <ActionIcon>
                                    <DotsVertical size="16" color={theme.colors.gray[5]} />
                                </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Item
                                    icon={<Edit size={14} />}
                                    color="gray.6"
                                    onClick={() => {
                                        onEditModal(() => data);
                                    }}
                                >
                                    تعديل الفريق
                                </Menu.Item>
                                <Menu.Item
                                    icon={data.account_status ? <Lock size={14} /> : <LockOpen size={14} /> }
                                    color="gray.6"
                                    onClick={() => {
                                        onChangeStatusModal(() => data);
                                    }}
                                >
                                    {data.account_status ? "توقيف" : "تفعيل"}
                                </Menu.Item>

                                <Menu.Divider />
                                <Menu.Item
                                    icon={<Plus size={14} />}
                                    color="gray.6"
                                    onClick={() => {
                                        setOpenAddAdminModal(() => data);
                                    }}
                                >
                                    اضافة مدير
                                </Menu.Item>

                                <Menu.Divider />

                                <Menu.Item
                                    color="red"
                                    icon={<Trash size={14} />}
                                    onClick={() => {
                                        onDeleteModal(() => data);
                                    }}
                                >
                                    حذف الفريق
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Flex>

                    {data?.admin
                        ? <>
                            <Divider size={1} orientation={"horizontal"} color={theme.colors.gray[3]}  my={12} />

                            {/* center  */}
                            <Flex align={"center"} justify="center">
                                <Text size={"sm"} color={"gray.5"}>
                                    <User size={18} color={"gray"} />
                                </Text>
                                <Tooltip label={`المدير  (${data?.admin?.email})`} >
                                    <Text size={"sm"} color={"gray.5"}>
                                        { `${data?.admin?.person?.first_name} ${data?.admin?.person?.second_name} ${data?.admin?.person?.third_name} ${data?.admin?.person?.tribe}`}
                                    </Text>
                                </Tooltip>
                            </Flex>

                            <Divider size={1} orientation={"horizontal"} color={theme.colors.gray[3]} my={12}/>
                        </>
                        : <Space h={72} />
                    }


                    {/* bottom  */}
                    <Flex align={"center"} justify="space-between">
                        <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow() }</Text>

                        {data?.account_status ?
                            <Badge radius="sm" color="green">مفعل</Badge>
                            :<Badge radius="sm" color="red">متوقف</Badge>
                        }
                    </Flex>
                </Flex>
            </Box>
            {/* menu */}
        </>
    );
};

export default CardTeam;
