import { useDisclosure } from '@mantine/hooks';
import {Drawer, Button, Group, DrawerProps, Text, Col, Box, Grid, Stack, Avatar} from '@mantine/core';
import {RichTextEditor} from "@mantine/tiptap";
import React, {useEffect, useState} from "react";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import dayjs from "dayjs";
import {useMessage} from "../../graphql";
import {RichTextBox} from "../RichTextEditor";
import { getImageUrl } from '../../lib/helpers/image';

type Props = {
    data?: any;
    setOpenCommentModal?: (open: boolean) => void;
} & DrawerProps;

export function CommentDrawer({ data, setOpenCommentModal, ...props }: Props) {
    const [content, setContent] = useState("");
    const [comments, setComments] = useState<any>([]);

    const [getMessage, {data: dataMessage}] = useMessage();

    useEffect(() => {
        if (data && data !== "") {
            getMessage({
                variables: {id: data },
                fetchPolicy: "network-only",
                onCompleted: ({message}) => {
                    console.log(message)
                    setContent(message?.content)
                }
            })
        }
    }, [data, props.opened]);


    useEffect(() => {
        if (dataMessage && "message" in dataMessage && "comment" in dataMessage?.message) {
            setComments([...dataMessage?.message?.comment])
        }
    }, [dataMessage]);

    const closeDrawer = () => {
        props.onClose();
    };

    const openModelComment = () => {
        typeof setOpenCommentModal === "function" && setOpenCommentModal(true)
    }

    return (
        <Drawer
            {...props}
            onClose={closeDrawer}
            title="التعليقات"
            position={"right"}
            size={"xl"}
            styles={(theme) => ({
                header: {
                    direction: "rtl"
                },
                root: {
                    marginRight: 140
                }
            })}
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <Grid gutter={20}>
                    <Col span={12} >
                        <Text size={"md"} fw={"bold"} mb={20}>
                            الموضوع :
                            <Text ml={5} span={true} size={"lg"} fw={400}>
                                {dataMessage?.message?.subject}
                            </Text>
                        </Text>
                    </Col>

                    <Col span={12}>
                        <Text component={"label"} >المحتوى :</Text>
                        <RichTextBox content={content} />
                    </Col>

                    <Col span={12}>
                        <Group position={"apart"}>
                            <Text component={"label"} >التعليقات :</Text>
                            <Button size={"sm"} onClick={openModelComment}>
                                اضافة تعليق
                            </Button>
                        </Group>
                        <Stack mt={20}>
                            {comments.map((item: any) => (
                                <Box key={item?.id} bg={"#eee"} p={20}>
                                    <Stack spacing={6}>
                                        <Group position={"apart"} align={"center"}>
                                            {item?.club
                                                ? <Group align={"center"} spacing={8}>
                                                    <Avatar src={getImageUrl(item?.club?.logo as string)} alt={item?.club?.logo as string} size={32} radius={16}/>
                                                    <Text fw={600}>{item?.club?.name}</Text>
                                                </Group>
                                                : item?.team
                                                    ? <Group align={"center"} spacing={8}>
                                                        <Avatar src={getImageUrl(item?.team?.logo as string)} alt={item?.team?.logo as string} size={32} radius={16}/>
                                                        <Text fw={600}>{item?.team?.name}</Text>
                                                    </Group>
                                                    : null
                                            }
                                            <Text size={"xs"} c={"gray.6"}>
                                                {item?.createdAt ? dayjs(item.createdAt).format("YYYY-MM-DD HH:mm") : ""}
                                            </Text>
                                        </Group>

                                        <Stack spacing={0}>
                                            <Text size={"sm"}>{item?.content}</Text>
                                            {item?.note ? <Text size={"xs"} c={"gray.6"}>{item.note}</Text> : null}
                                        </Stack>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Col>
                </Grid>
            </Box>
        </Drawer>
    );
}