import {Box, Grid, Group, useMantineTheme, Stack, Text, Menu, ActionIcon, Image} from "@mantine/core";
import {IconDotsVertical, IconEdit} from "@tabler/icons-react";
import { Printer} from "tabler-icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import dayjs from "dayjs";
import {useAllParticipatingTechnicalStaff} from "../../graphql";
import React, {useEffect, useState} from "react";

const {Col} = Grid

type Props = {
    data?: any;
    setSelectedData: (id: any) => void;
} & ModalProps;

export const ShowParticipatingTechnicalStaff = ({data, setSelectedData, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const theme = useMantineTheme();
    const [getAllParticipatingTechnicalStaff, {data: dataAllParticipatingTechnicalStaff}] = useAllParticipatingTechnicalStaff()

    const [allParticipatingTechnicalStaff, setAllParticipatingTechnicalStaff] = useState<object[]>([]);

    useEffect(() => {
        if (data && props.opened) {
            getAllParticipatingTechnicalStaff({
                variables: {
                    idParticipatingTeams: data
                },
                fetchPolicy: "network-only",
                onCompleted: ({allParticipatingTechnicalStaff}) => {
                    setAllParticipatingTechnicalStaff([...allParticipatingTechnicalStaff])
                }
            })
        }
    }, [data, props.opened]);

    const closeModal = () => {
        props.onClose();
        setAllParticipatingTechnicalStaff([])
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<></>}

            styles={{
                body: {
                    backgroundColor: theme.colors.gray[1]
                }
            }}
        >
            <Box style={{padding: 20}}>
                {allParticipatingTechnicalStaff?.length >= 0
                    ? <Grid gutter={20}>
                        {allParticipatingTechnicalStaff?.map((item: any, index: number) => (
                            <Col key={index} span={6} >
                                <Box bg={theme.white} style={{padding: 10}}>
                                    <Group   align="flex-start">
                                        <Group   align={"center"}>
                                            <Stack justify={"center"} h={"100%"}>
                                                <Image src={`http://localhost:7000/images/${item?.technicalApparatus?.person?.personal_picture}`} w={50} h={50} />
                                            </Stack>

                                            <Stack spacing={5} justify={"center"} align="flex-start">
                                                <Text size={"14px"} c={theme.colors.gray[6]}>
                                                    {`${item?.technicalApparatus?.person?.first_name} ${item?.technicalApparatus?.person?.second_name} ${item?.technicalApparatus?.person?.third_name} ${item?.technicalApparatus?.person?.tribe} (${item?.technicalApparatus?.person?.card_number})`}
                                                </Text>
                                                <Text size={"14px"} c={theme.colors.gray[6]}>
                                                    {`${item?.technicalApparatus?.person?.date_birth}`}
                                                </Text>
                                            </Stack>
                                        </Group>

                                        <Stack justify={"flex-start"} h={"100%"}>
                                    <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <ActionIcon variant={"transparent"} color={"gray"} size={"sm"}>
                                                <IconDotsVertical size="0.9rem" />
                                            </ActionIcon>
                                        </Menu.Target>

                                        <Menu.Dropdown>
                                            
                                                <Menu.Item
                                            component={"a"} icon={<Printer size={18} />}
                                            href={`https://print.omkooora.com/#/participating-staff/${item?.id}`}
                                            target={"_blank"}
                                        >طباعة البطاقة</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Stack>
                                    </Group>
                                </Box>
                            </Col>
                        ))}
                    </Grid>
                    : null
                }
            </Box>
        </Modal>
    );
};