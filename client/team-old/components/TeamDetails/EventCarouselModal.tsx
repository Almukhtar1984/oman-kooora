import { Modal, Stack, Box, Group, Title, Badge, Text, Image } from "@mantine/core";
import { Carousel } from '@mantine/carousel';
import { CalendarEvent } from "tabler-icons-react";
import dayjs from "dayjs";
import React from "react";

interface EventCarouselModalProps {
    opened: boolean;
    onClose: () => void;
    event: any;
}

export const EventCarouselModal = ({ opened, onClose, event }: EventCarouselModalProps) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={event?.subject}
            size="lg"
            p="md"
            radius="md"
        >
                        <Stack spacing="xl">
                {event?.imageList?.length > 0 ? (
                    <Carousel withIndicators loop align="start">
                        {event.imageList.map((img: string) => (
                            <Carousel.Slide key={img}>
                                <Image 
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/images/events/${event.images}/${img}`} 
                                    height={350} 
                                    fit="contain" 
                                    radius="md"
                                    alt={event.name}
                                />
                            </Carousel.Slide>
                        ))}
                    </Carousel>
                ) : (
                    <Box h={200} sx={{ backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                        <CalendarEvent size={60} color="#dee2e6" />
                    </Box>
                )}
                
                <Box>
                    <Group position="apart" mb="xs">
                        <Title order={4} color="#1E3A8A">{event?.name}</Title>
                        <Badge size="lg" variant="dot">{dayjs(event?.date).format("YYYY-MM-DD")}</Badge>
                    </Group>
                    <Text color="dimmed" size="sm">{event?.description}</Text>
                </Box>
            </Stack>
        </Modal>
    );
};
