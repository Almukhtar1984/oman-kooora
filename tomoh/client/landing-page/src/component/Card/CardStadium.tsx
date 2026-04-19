import { useTheme } from "@emotion/react";
import {ActionIcon, Avatar, Box, BoxProps, Flex, MantineTheme, Menu, Text, Stack, Image, Group, Badge} from "@mantine/core";
import {DotsVertical, Edit, Trash} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { Carousel } from '@mantine/carousel';
import {open} from "fs";

type Props = {
    data?: any;
    setOpenAddModal: (open: boolean) => void;
    setSelectedData: (data: string) => void;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardStadium = ({ data, setOpenAddModal, setSelectedData, ...props }: Props) => {
    const [openCardOptionMenu, setopenCardOptionMenu] = useState<boolean>(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);

    const theme = useTheme() as MantineTheme;
    let route = useRouter();

    useEffect(() => {
        if (data) {
            setAttachments([...data?.attachments?.split(",")])
            setImages([...data?.images?.split(",")])
        }
    }, [data])

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
                                <Text size={"md"} color={"gray.6"}>
                                    {data?.name} ({data?.type === "natural" ? "طبيعي" : "اصطناعي"})
                                </Text>
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
                                <Menu.Item icon={<Edit size={14} />} color="gray.6" onClick={() => {
                                    setSelectedData(data?.id)
                                    setOpenAddModal(true)
                                }}>
                                    حجز
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Flex>
                    <Stack mt={20} spacing={10}>
                        <Text size={"sm"} color={"gray.5"}>{data?.about}</Text>
                        {attachments && attachments.length > 0
                            ? <Group position={"left"} spacing={5} mb={10}>
                                {attachments.map((item: string, index) => (
                                    <Badge key={index} size={"sm"} >{item}</Badge>
                                ))}
                            </Group>
                            : null
                        }


                        {images && images.length > 0
                            ? <Carousel maw={"100%"} mah={200} w={"100%"} height={200} mx="auto" withIndicators  loop={true}>
                                {images.map((item: string, index) => (
                                    <Carousel.Slide key={index}>
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/images/${item}`}
                                            width={"100%"} height={200}
                                            styles={{
                                                root: {border: "2px solid #eee", borderRadius: 8},
                                                image: {borderRadius: 8}
                                            }}
                                        />
                                    </Carousel.Slide>
                                ))}
                            </Carousel>
                            : null
                        }
                    </Stack>
                </Flex>
            </Box>
            {/* menu */}
        </>
    );
};

export default CardStadium;
