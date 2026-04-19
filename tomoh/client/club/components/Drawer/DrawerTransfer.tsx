import {Badge, Box, Drawer, DrawerProps, Group, Text, Timeline} from "@mantine/core";
import React, {useState} from "react";
import {CornerDownLeft} from "tabler-icons-react";

type Props = {
    data?: any;
} & DrawerProps;

export const DrawerTransfer = ({ data, ...props }: Props) => {

    return (
        <Drawer {...props} position={"right"} overlayProps={{ opacity: 0.5, blur: 2.5 }}>
            <Box py={50} px={20}>
                <Timeline
                    active={1} lineWidth={2} bulletSize={15} align="left"
                    styles={()=>({
                        itemBody: {
                            border: "1px solid #aaa",
                            padding: "8px 15px",
                            borderRadius: 4
                        }
                    })}
                >
                    {data?.map((item: any, index: number) => (
                        <Timeline.Item key={index} >
                            <Group position={"apart"}>
                                <Text color="dimmed" size="sm">
                                    من :
                                    <Text span={true} size="sm" fw={500}> {item?.team_from?.name} </Text>
                                </Text>

                                {item?.status == "accepted" ? <Badge fw={400} color="teal">مقبول</Badge>
                                    : item?.status == "rejected" ? <Badge fw={400} color="red">مرفوض</Badge>
                                        : item?.status == "waiting_club_1" ? <Badge fw={400} color="teal">مقبول من الفريق</Badge>
                                            : item?.status == "waiting_club_2" ? <Badge fw={400} color="teal">مقبول من النادي</Badge>
                                                : <Badge fw={400} color="yellow">قيد الانتظار</Badge>
                                }
                            </Group>

                            <Text color="dimmed" size="sm" >
                                <Text span={true} mt={3} mr={5}>
                                    <CornerDownLeft size={20} />
                                </Text>
                                إلى :
                                <Text span={true} size="sm" fw={500}> {item?.team_to?.name} </Text>
                            </Text>
                        </Timeline.Item>
                    ))}

                </Timeline>
            </Box>
        </Drawer>
    );
};