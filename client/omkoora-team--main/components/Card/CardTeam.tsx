import { useTheme } from "@emotion/react";
import {ActionIcon, Avatar, Badge, Box, BoxProps, Flex, MantineTheme, Menu, Space, Text} from "@mantine/core";
import {DotsVertical, Edit, Phone, Trash,} from "tabler-icons-react";
import React, { ReactElement, useState } from "react";
import { Router, useRouter } from "next/router";
import dayjs from "dayjs";

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    onChangeStatusModal: (callback?: () => any) => void;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardTeam = ({ data, onEditModal, onDeleteModal, onChangeStatusModal, ...props }: Props) => {
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
                                    icon={<Edit size={14} />}
                                    color="gray.6"
                                    onClick={() => {
                                        onChangeStatusModal(() => data);
                                    }}
                                >
                                    {data.account_status ? "توقيف" : "تفعيل"}
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
                    <Space h={34} />
                    {/* bottom  */}
                    <Flex align={"center"} justify="space-between">
                        <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow() }</Text>

                        {data?.account_status ?
                            <Badge fw={500} radius="sm" color="green">مفعل</Badge>
                            :<Badge fw={500} radius="sm" color="red">متوقف</Badge>
                        }
                    </Flex>
                </Flex>
            </Box>
            {/* menu */}
        </>
    );
};

export default CardTeam;
