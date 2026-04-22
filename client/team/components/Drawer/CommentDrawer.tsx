import { useDisclosure } from '@mantine/hooks';
import {Drawer, Button, Group, DrawerProps, Text, Col, Box, Grid, Stack, Avatar} from '@mantine/core';
import {RichTextEditor} from "@mantine/tiptap";
import React, {useEffect, useState} from "react";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {useMessage} from "../../graphql";
import {RichTextBox} from "../RichTextEditor";

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
                                    <Group>
                                        <Stack spacing={5}>
                                            {item?.club
                                                ? <Group align={"flex-start"}>
                                                    <Avatar src={item?.club?.logo as string} alt={item?.club?.logo as string} size={38} radius={20}/>
                                                    <Text>{item?.club?.name}</Text>
                                                </Group>
                                                : item?.team
                                                    ? <Group align={"flex-start"}>
                                                        <Avatar src={item?.team?.logo as string} alt={item?.team?.logo as string} size={38} radius={20}/>
                                                        <Text>{item?.team?.name}</Text>
                                                    </Group>
                                                    : null
                                            }

                                            <Stack spacing={0}>
                                                <Text size={"sm"}>{item?.content}</Text>
                                                <Text size={"xs"}>{item?.note}</Text>
                                            </Stack>
                                        </Stack>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    </Col>
                </Grid>
            </Box>
        </Drawer>
    );
}