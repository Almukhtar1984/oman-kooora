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
    Stack, Image, Badge, Group, Divider
} from "@mantine/core";
import {Check, DotsVertical, Edit, ExternalLink, Lock, LockOpen, Plus, Trash, User, X,} from "tabler-icons-react";
import React, { useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    setOpenShowModal: (callback?: () => any) => void;
    onOpenChangeStatusModal: (callback?: () => any) => void;
    hasPermission: (permission: string) => boolean;
    setNewStatus: (status: string) => void;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardBlog = ({ data, onEditModal, onDeleteModal, setOpenShowModal, onOpenChangeStatusModal, setNewStatus, hasPermission, ...props }: Props) => {
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
                            {data?.team
                                ? <Avatar src={data?.team?.club?.logo as string} alt={data?.team?.club?.logo as string} size={38} radius={20}/>
                                : <Avatar src={data?.club?.logo as string} alt={data?.club?.logo as string} size={38} radius={20}/>
                            }
                            <Flex direction={"column"} gap="0">
                                {data?.team
                                    ? <Text size={"md"} color={"gray.6"}>{data?.team?.name}</Text>
                                    : <Text size={"md"} color={"gray.6"}>{data?.club?.name}</Text>
                                }
                                <Group position={"left"}>
                                    <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow() }</Text>

                                    {data?.status == "accepted"
                                        ? <Badge fw={400} color="teal">مقبول</Badge>
                                        : data?.status == "rejected"
                                            ? <Badge fw={400} color="red">مرفوض</Badge>
                                            : data?.status == "waiting"
                                                ? <Badge fw={400} color="yellow">قيد الانتظار</Badge>
                                                : null
                                    }
                                </Group>
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

                                {hasPermission("4")
                                    ? <Menu.Item color="red" icon={<Trash size={14} />} onClick={() => onDeleteModal(() => data)}>
                                        حذف
                                    </Menu.Item>
                                    : null
                                }

                                {data?.status == "waiting"
                                    ? <>
                                        <Divider />

                                        {hasPermission("4")
                                            ? <Menu.Item
                                                color="green"
                                                icon={<Check size={14} />}
                                                onClick={() => {
                                                    setNewStatus("accepted")
                                                    onOpenChangeStatusModal(() => data)
                                                }}
                                            >
                                                قبول
                                            </Menu.Item>
                                            : null
                                        }

                                        {hasPermission("4")
                                            ? <Menu.Item
                                                color="red"
                                                icon={<X size={14} />}
                                                onClick={() => {
                                                    setNewStatus("rejected")
                                                    onOpenChangeStatusModal(() => data)
                                                }}
                                            >
                                                رفض
                                            </Menu.Item>
                                            : null
                                        }
                                    </>
                                    : null
                                }
                            </Menu.Dropdown>
                        </Menu>
                    </Flex>
                    <Stack mt={20} spacing={10}>
                        <Text size={"md"} fw={500} color={"gray.5"}>{data?.subject}</Text>
                        <Text size={"sm"} color={"gray.5"}>{data?.short_description}</Text>

                        {data?.attachment && data?.attachment.length > 0
                            ? <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/images/${data?.attachment?.[0]?.content}`}
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
