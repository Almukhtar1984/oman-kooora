import { useTheme } from "@emotion/react";
import { ActionIcon, Avatar, Box, BoxProps, Flex, MantineTheme, Menu, Text, Stack, Image, Group, Badge } from "@mantine/core";
import { DotsVertical, Edit, Trash } from "tabler-icons-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { Carousel } from '@mantine/carousel';

type Props = {
    data?: any;
    onEditModal: (callback?: () => any) => void;
    onDeleteModal: (callback?: () => any) => void;
    setOpenShowModal: (callback?: () => any) => void;
    hasPermission: (permission: string) => boolean;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardStadium = ({ data, onEditModal, onDeleteModal, setOpenShowModal, hasPermission, ...props }: Props) => {
    const [openCardOptionMenu, setopenCardOptionMenu] = useState<boolean>(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);

    const theme = useTheme() as MantineTheme;
    let route = useRouter();

    useEffect(() => {
        if (data) {
            console.log("data:",data)
            setAttachments([...(data?.attachments?.split(",") || [])]);
            setImages([...(data?.images?.split(",") || [])]);

        }
    }, [data]);

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
                            <Avatar src={data?.team?.logo as string} alt={data?.team?.name as string} size={38} radius={20} />
                            <Flex direction={"column"} gap="0">
                                <Text size={"md"} color={"gray.6"}>
                                    {data?.name}
                                </Text>
                                <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow()}</Text>
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
                                {hasPermission("1") && <Menu.Item icon={<Edit size={14} />} color="gray.6" onClick={() => setOpenShowModal(() => data)}>
                                    الحجوزات
                                </Menu.Item>}
                                {hasPermission("3") && <Menu.Item icon={<Edit size={14} />} color="gray.6" onClick={() => onEditModal(() => data)}>
                                    تعديل
                                </Menu.Item>}
                                {hasPermission("4") && <Menu.Item color="red" icon={<Trash size={14} />} onClick={() => onDeleteModal(() => data)}>
                                    حذف
                                </Menu.Item>}
                            </Menu.Dropdown>
                        </Menu>
                    </Flex>
                    <Stack mt={20} spacing={10}>
                        <Text size={"sm"} color={"gray.5"}>{data?.about}</Text>
                        {attachments && attachments.length > 0 && (
                            <Group position={"left"} spacing={5} mb={10}>
                                {attachments.map((item: string, index) => (
                                    <Badge key={index} size={"sm"}>{item}</Badge>
                                ))}
                            </Group>
                        )}
                        {images && images.length > 0 ? (
                            <Carousel maw={"100%"} mah={200} w={"100%"} height={200} mx="auto" withIndicators loop={true}>
                                {images.map((item: string, index) => (
                                    <Carousel.Slide key={index}>
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/images/${item}`}
                                            width={"100%"} height={200}
                                            styles={{
                                                root: { border: "2px solid #eee", borderRadius: 8 },
                                                image: { borderRadius: 8 }
                                            }}
                                        />
                                    </Carousel.Slide>
                                ))}
                            </Carousel>
                                ) : (
                                    <Carousel maw={"100%"} mah={200} w={"100%"} height={200} mx="auto" withIndicators loop={true}>
                                    <Carousel.Slide key={1}>
                                    <Image
                                        src="/stadium.jpeg" // <- path to your default image
                                        width={"100%"} height={200}
                                        styles={{
                                            root: { border: "2px solid #eee", borderRadius: 8 },
                                            image: { borderRadius: 8 }
                                        }}

                                    />
                                    </Carousel.Slide></Carousel>
                                    
                                )}

                        <Text size={"sm"} color={"gray.6"}>وقت البداية: {dayjs(data?.start_time, "HH:mm:ss").format("HH:mm")}</Text>
                        <Text size={"sm"} color={"gray.6"}>وقت النهاية: {dayjs(data?.end_time, "HH:mm:ss").format("HH:mm")}</Text>
                        <Text size={"sm"} color={"gray.6"}>المحافظة: {data?.mohafada}</Text>
                        <Text size={"sm"} color={"gray.6"}>الولاية: {data?.wiliya}</Text>
                    </Stack>
                </Flex>
            </Box>
        </>
    );
};

export default CardStadium;

