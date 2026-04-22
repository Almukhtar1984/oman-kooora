import {apiUrl} from "../../lib/config";
import { useTheme } from "@emotion/react";
import {
    ActionIcon,
    Avatar,
    Box,
    BoxProps,
    Flex,
    MantineTheme,
    Menu,
    Text,
    Stack, Image
} from "@mantine/core";
import {DotsVertical, Edit, ExternalLink, Lock, LockOpen, Plus, Trash, User,} from "tabler-icons-react";
import React, { useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    setOpenShowModal: (callback?: () => any) => void;
    hasPermission: (permission: string) => boolean;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardBlog = ({ data, onEditModal, onDeleteModal, setOpenShowModal, hasPermission, ...props }: Props) => {
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
                    outline: "1px solid " + colors.gray[3]
                })}
            >
                <Flex direction={"column"}>
                    {/* top  */}
                    <Flex justify={"space-between"} align="top" w="100%">
                        <Flex gap="10px" h="100%" align={"center"}>
                            <Avatar src={data?.club?.logo as string} alt={data?.club?.logo as string} size={38} radius={20}/>
                            <Flex direction={"column"} gap="0">
                                <Text size={"md"} fw={500} color={"gray.5"}>{data?.subject}</Text>
                                <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow() }</Text>
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
                                {hasPermission("1")
                                    ? <Menu.Item icon={<Edit size={14} />} color="gray.6" onClick={() => setOpenShowModal(() => data)}>
                                        عرض
                                    </Menu.Item>
                                    : null
                                }

                                {hasPermission("3")
                                    ? <Menu.Item icon={<Edit size={14} />} color="gray.6" onClick={() => onEditModal(() => data)}>
                                        تعديل
                                    </Menu.Item>
                                    : null
                                }

                                {hasPermission("4")
                                    ? <Menu.Item color="red" icon={<Trash size={14} />} onClick={() => onDeleteModal(() => data)}>
                                        حذف
                                    </Menu.Item>
                                    : null
                                }
                            </Menu.Dropdown>
                        </Menu>
                    </Flex>
                    <Stack mt={20} spacing={10}>

                        <Text size={"sm"} color={"gray.5"}>{data?.short_description}</Text>

                        {data?.attachment && data?.attachment.length > 0
                            ? <Image
                                src={`${apiUrl}/images/${data?.attachment?.[0]?.content}`}
                                width={"100%"} height={200}
                                styles={{
                                    root: {border: "2px solid #eee", borderRadius: 8},
                                    image: {borderRadius: 8}
                                }}
                            />
                            : null
                        }
                    </Stack>
                </Flex>
            </Box>
            {/* menu */}
        </>
    );
};

export default CardBlog;
