import { useTheme } from "@emotion/react";
import {Avatar, Box, BoxProps, Flex, MantineTheme, Text, Stack, Image} from "@mantine/core";

import React, { useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

type Props = {
    data?: any;
} & BoxProps & React.AnchorHTMLAttributes<HTMLDivElement>;

const CardBlog = ({ data, ...props }: Props) => {
    const [openCardOptionMenu, setopenCardOptionMenu] = useState<boolean>(false);

    const theme = useTheme() as MantineTheme;
    let route = useRouter();

    return (
        <Box
            {...props}
            p={16}
            bg="white"
            sx={({ colors, shadows }) => ({
                borderRadius: 4,
                outline: "1px solid " + colors.gray[3],
                cursor: "pointer"
            })}
            onClick={(event) => {
                event.preventDefault();
                route.push(`/blog/${data?.id}`)
            }}
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
                                ? <Text size={"md"} color={"gray.6"}>{data?.team?.club?.name}</Text>
                                : <Text size={"md"} color={"gray.6"}>{data?.club?.name}</Text>
                            }
                            <Text size={"sm"} color={"gray.5"}>{dayjs(data?.createdAt).locale("ar").fromNow() }</Text>
                        </Flex>
                    </Flex>
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
    );
};

export default CardBlog;
