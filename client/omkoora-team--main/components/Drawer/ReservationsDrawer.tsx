import { useDisclosure } from '@mantine/hooks';
import {Drawer, Button, Group, DrawerProps, Text, Col, Box, Grid, Stack, Avatar} from '@mantine/core';
import {RichTextEditor} from "@mantine/tiptap";
import React, {useEffect, useState} from "react";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {useAllReservations, useMessage} from "../../graphql";
import {RichTextBox} from "../RichTextEditor";

type Props = {
    data?: any;
    setOpenCommentModal?: (open: boolean) => void;
} & DrawerProps;

export function ReservationsDrawer({ data, setOpenCommentModal, ...props }: Props) {
    const [allReservations, setAllReservations] = useState<any>([]);

    const [getReservations, {data: dataReservations}] = useAllReservations();

    useEffect(() => {
        if (data && data !== "") {
            getReservations({
                variables: {idStadium: data },
                fetchPolicy: "network-only"
            })
        }
    }, [data, props.opened]);

    useEffect(() => {
        if (dataReservations && "allReservations" in dataReservations && dataReservations?.allReservations.length >= 0) {
            setAllReservations([...dataReservations?.allReservations])
        }
    }, [dataReservations]);

    const closeDrawer = () => {
        props.onClose();
    };

    return (
        <Drawer
            {...props}
            onClose={closeDrawer}
            title="الحجوزات"
            position={"right"}
            size={"xl"}
            styles={(theme) => ({
                inner: {
                    right: 5
                },
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

                    <Col span={12}>
                        <Stack mt={20}>
                            {allReservations.map((item: any) => (
                                <Box key={item?.id} bg={"#eee"} p={20}>
                                    <Group>
                                        <Stack spacing={5}>
                                            <Text>{item?.phone}</Text>

                                            <Group align={"flex-start"}>
                                                <Text size={"sm"} ta={"right"}> {item?.booking_date}</Text>
                                                <Text size={"sm"} ta={"right"}>من {item?.booking_start}</Text>
                                                <Text size={"sm"} ta={"right"}>الى {item?.booking_end}</Text>
                                            </Group>
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