import { useTheme } from "@emotion/react";
import {
    ActionIcon,
    Avatar,
    Box,
    BoxProps,
    Button,
    Flex,
    MantineTheme,
    Menu,
    Divider,
    Text,
    Tooltip,
    Badge,
    Space
} from "@mantine/core";
import { DotsVertical, Edit, Eye, Lock, LockOpen, Phone, Plus, Trash, User, } from "tabler-icons-react";
import React, { ReactElement, useState } from "react";
import { Router, useRouter } from "next/router";
import dayjs from "dayjs";
import { getImageUrl } from "../../lib/helpers/image";

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    onChangeStatusModal: (callback?: () => any) => void;
    onChangeStatusAddPlayerModal: (callback?: () => any) => void;
    setOpenAddAdminModal: (callback?: () => any) => void;
    setOpenEditAdminModal: (callback?: () => any) => void;
    setOpenAddListPlayersModal: (callback?: () => any) => void;
    hasPermission: (permission: string) => boolean;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const category = ["الدرجة الاولى", "الدرجة الثاني", "الدرجة الثالثة"]

const CardTeam = ({ data, onEditModal, onDeleteModal, onChangeStatusModal, onChangeStatusAddPlayerModal, setOpenAddAdminModal, setOpenEditAdminModal, setOpenAddListPlayersModal, hasPermission, ...props }: Props) => {
    const [openCardOptionMenu, setopenCardOptionMenu] = useState<boolean>(false);

    const theme = useTheme() as MantineTheme;
    let route = useRouter();

    // console.log(data)


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
                            <Avatar src={getImageUrl(data?.logo as string)} alt={data?.logo as string} size={38} radius={20} />
                            <Flex direction={"column"} gap="0">
                                <Text size={"md"} color={"gray.6"}>
                                    {`${data?.name} (${data?.activities})`}
                                </Text>
                                <Text size={"sm"} color={"gray.5"}>{category?.[data?.category - 1]}</Text>
                                <Text size={"xs"} color={"gray.5"}>{data?.manager_name}</Text>
                                <Text size={"xs"} color={"gray.4"}>
                                    اضافة لاعبين:
                                    <Text span={true} size={"xs"} color={data?.enableAddPlayer ? "green" : "red"}>{data?.enableAddPlayer ? "مفعل" : "متوقف"}</Text>
                                </Text>
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
                                {hasPermission("3")
                                    ? <Menu.Item
                                        icon={<Edit size={14} />}
                                        color="gray.6"
                                        onClick={() => {
                                            onEditModal(() => data);
                                        }}
                                    >
                                        تعديل الفريق
                                    </Menu.Item>
                                    : null
                                }
                                {hasPermission("5")
                                    ? <Menu.Item
                                        icon={data.account_status ? <Lock size={14} /> : <LockOpen size={14} />}
                                        color="gray.6"
                                        onClick={() => {
                                            onChangeStatusModal(() => data);
                                        }}
                                    >
                                        {data.account_status ? "توقيف" : "تفعيل"}
                                    </Menu.Item>
                                    : null
                                }

                                <Menu.Divider />
                                {data?.admin
                                    ? hasPermission("7")
                                        ? <Menu.Item
                                            icon={<Edit size={14} />}
                                            color="gray.6"
                                            onClick={() => {
                                                setOpenEditAdminModal(() => data?.admin);
                                            }}
                                        >
                                            تعديل معلومات المدير
                                        </Menu.Item>
                                        : null
                                    : hasPermission("6")
                                        ? <Menu.Item
                                            icon={<Plus size={14} />}
                                            color="gray.6"
                                            onClick={() => {
                                                setOpenAddAdminModal(() => data);
                                            }}
                                        >
                                            اضافة مدير
                                        </Menu.Item>
                                        : null
                                }

                                <Menu.Item
                                    icon={<Plus size={14} />}
                                    color="gray.6"
                                    onClick={() => {
                                        setOpenAddListPlayersModal(() => data);
                                    }}
                                >
                                    اضافة لاعبين
                                </Menu.Item>

                                <Menu.Item
                                    icon={data.enableAddPlayer ? <Lock size={14} /> : <LockOpen size={14} />}
                                    color="gray.6"
                                    onClick={() => {
                                        onChangeStatusAddPlayerModal(() => data);
                                    }}
                                >
                                    {data?.enableAddPlayer ? "توقيف اضافة لاعبين" : "تفعيل اضافة لاعبين"}
                                </Menu.Item>

                                <Menu.Divider />


                                {hasPermission("4")
                                    ? <Menu.Item
                                        color="red"
                                        icon={<Trash size={14} />}
                                        onClick={() => {
                                            onDeleteModal(() => data);
                                        }}
                                    >
                                        حذف الفريق
                                    </Menu.Item>
                                    : null
                                }


                            </Menu.Dropdown>
                        </Menu>
                    </Flex>

                    {data?.admin
                        ? <>
                            <Divider size={1} orientation={"horizontal"} color={theme.colors.gray[3]} my={12} />

                            {/* center  */}
                            <Flex align={"center"} justify="center">
                                <Text size={"sm"} color={"gray.5"}>
                                    <User size={18} color={"gray"} />
                                </Text>
                                <Tooltip label={`المدير  (${data?.admin?.email})`} >
                                    <Text size={"sm"} color={"gray.5"}>
                                        {`${data?.admin?.person?.first_name} ${data?.admin?.person?.second_name} ${data?.admin?.person?.third_name} ${data?.admin?.person?.tribe}`}
                                    </Text>
                                </Tooltip>
                            </Flex>

                            <Divider size={1} orientation={"horizontal"} color={theme.colors.gray[3]} my={12} />
                        </>
                        : <Space h={72} />
                    }


                    {/* bottom  */}
                    <Flex align={"center"} justify="space-between">
                        <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow()}</Text>

                        {data?.account_status ?
                            <Badge radius="sm" color="green">مفعل</Badge>
                            : <Badge radius="sm" color="red">متوقف</Badge>
                        }
                    </Flex>

                    <Divider size={1} orientation={"horizontal"} color={theme.colors.gray[3]} my={12} />
                    <Button
                        variant="light"
                        color="blue"
                        fullWidth
                        leftIcon={<Eye size={16} />}
                        size="sm"
                        onClick={() => route.push(`/team/${data?.id}`)}
                    >
                        عرض تفاصيل الفريق
                    </Button>
                </Flex>
            </Box>
            {/* menu */}
        </>
    );
};

export default CardTeam;
