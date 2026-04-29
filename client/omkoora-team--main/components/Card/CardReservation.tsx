import { useTheme } from "@emotion/react";
import { ActionIcon, Avatar, Box, BoxProps, Flex, MantineTheme, Menu, Text, Stack, Group, Badge } from "@mantine/core";
import { DotsVertical, Edit, Trash, Check } from "tabler-icons-react";
import React, { useState } from "react";
import dayjs from "dayjs";
import { useUpdateReservationStatus, useDeleteReservation ,reservationsByTeam} from "../../graphql/index";

type Props = {
    data?: any;
   
    onDeleteModal: (callback?: () => any) => void;
    hasPermission: (permission: string) => boolean;
    refetchReservations: () => any;
} & BoxProps & React.AnchorHTMLAttributes<HTMLDivElement>;

const CardReservation = ({ data, onDeleteModal, hasPermission,refetchReservations, ...props }: Props) => {
    const [openCardOptionMenu, setopenCardOptionMenu] = useState<boolean>(false);
    const theme = useTheme() as MantineTheme;
 
    // Initialize the GraphQL hooks
    const [updateReservationStatus] = useUpdateReservationStatus();
    const [deleteReservation] = useDeleteReservation();

    // Handlers for menu actions
    const handleConfirm = async () => {
        try {
            await updateReservationStatus({
                variables: { id: data?.id, status: "accepted" }, // Assuming 'accepted' is the confirmed status
            });
            console.log('Reservation confirmed:', data?.id);
            await refetchReservations();
        } catch (error) {
            console.error('Error confirming reservation:', error);
        }
        updateReservationStatus({
            variables: {
                 id: data?.id, 
                 status: "accepted"
            },
            refetchQueries: [reservationsByTeam],
            onCompleted: () => {
                
            },
            onError: ({graphQLErrors}) => {
                //setLoade(false)
                //notyf.open({message: "فشل اضافة المرفقات", type:"error", duration: 10000});
            }
        })
         
    };

    const handleDisable = async () => {
        /*try {
            await updateReservationStatus({
                variables: { id: data?.id, status: "cancel" }, // Assuming 'cancel' is the disabled status
            });
            console.log('Reservation canceled:', data?.id);
            await refetchReservations();
        } catch (error) {
            console.error('Error canceling reservation:', error);
        }*/
        updateReservationStatus({
            variables: {
                 id: data?.id, 
                 status: "cancel"
            },
            refetchQueries: [reservationsByTeam],
            onCompleted: () => {
                
            },
            onError: ({graphQLErrors}) => {
                //setLoade(false)
                //notyf.open({message: "فشل اضافة المرفقات", type:"error", duration: 10000});
            }
        })
       
    };

    const handleDelete = async () => {
        onDeleteModal(() => data);
        
    };

    return (
        <>
            <Box
                {...props}
                p={16}
                bg="white"
                sx={({ colors, shadows }) => ({
                    borderRadius: 4,
                    outline: "1px solid " + colors.gray[3],
                    maxWidth: 350,
                })}
            >
                <Flex direction={"column"}>
                    {/* Top Section */}
                    <Flex justify={"space-between"} align="top" w="100%">
                        <Flex gap="10px" h="100%" align={"center"}>
                            <Flex direction={"column"} gap="0">
                                <Text size={"md"} color={"gray.6"}>
                                    {` يوم ${dayjs(data?.date).format("YYYY-MM-DD")}`}
                                </Text>
                                <Text size={"sm"} color={"gray.5"}>
                                    {dayjs(data?.createdAt).locale("ar").fromNow()}
                                </Text>
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
                                {/* Confirm Reservation */}
                                <Menu.Item icon={<Check size={14} />} onClick={handleConfirm}>
                                    تأكيد
                                </Menu.Item>

                                {/* Cancel Reservation */}
                                <Menu.Item icon={<Edit size={14} />} onClick={handleDisable}>
                                    الغاء الحجز
                                </Menu.Item>

                                {/* Delete Reservation */}
                                <Menu.Item color="red" icon={<Trash size={14} />} onClick={handleDelete}>
                                    حذف
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Flex>

                    {/* Reservation Details */}
                    <Stack mt={20} spacing={10}>
                        <Text size={"sm"} color={"gray.5"}>
                            {`رقم الهاتف: ${data?.phone}`}
                        </Text>
                        <Text size={"sm"} color={"gray.5"}>
                            {`الوقت: ${data?.booking_start} - ${data?.booking_end}`}
                        </Text>
                        <Text size={"sm"} color={"gray.5"}>
                            {`السعر: ${data?.stadium?.rent} ريال`}
                        </Text>
                        <Text size={"sm"} color={"gray.5"}>
                            {`اسم الملعب: ${data?.stadium?.name}`}
                        </Text>

                        {/* Badge for reservation status */}
                        <Group position={"left"} spacing={5} mb={10}>
                            {data?.status === "cancel" ? (
                                <Badge color="red" size="sm">
                                    ملغي
                                </Badge>
                            ) : data?.status === "waiting" ? (
                                <Badge color="orange" size="sm">
                                    بانتظار التأكيد
                                </Badge>
                            ) : (
                                <Badge color="green" size="sm">
                                    { "مؤكد"}
                                </Badge>
                            )}
                        </Group>
                    </Stack>
                </Flex>
            </Box>
        </>
    );
};

export default CardReservation;
