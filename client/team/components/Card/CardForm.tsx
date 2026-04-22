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
    Stack, Image, Button
} from "@mantine/core";
import {DotsVertical, Edit, Lock, LockOpen, Plus, Trash, User,} from "tabler-icons-react";
import React, { useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

type Props = {
    data?: any;
} & BoxProps &
    React.AnchorHTMLAttributes<HTMLDivElement>;

const CardForm = ({ data, ...props }: Props) => {
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
                                <Text size={"md"} color={"gray.6"}>
                                    {data?.club?.name}
                                </Text>
                                <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow() }</Text>
                            </Flex>
                        </Flex>
                    </Flex>
                    <Stack mt={20} spacing={10}>
                        <Text size={"md"} fw={500} color={"gray.5"}>{data?.subject}</Text>

                        {data?.file
                            ? <Button
                                variant="light"

                                component="a"
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`${process.env.NEXT_PUBLIC_API_URL}/files/${data.file}`}
                            >
                                تحميل الاستمارة
                            </Button>
                            : null
                        }
                    </Stack>
                </Flex>
            </Box>
            {/* menu */}
        </>
    );
};

export default CardForm;
