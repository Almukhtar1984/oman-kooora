import { Card, Box, Group, Text, Badge, Button } from "@mantine/core";
import { CalendarEvent, Edit, Trash } from "tabler-icons-react";
import dayjs from "dayjs";
import React from "react";

interface EventCardProps {
    event: any;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const EventCard = ({ event, onView, onEdit, onDelete }: EventCardProps) => {
    const uploadUrl = process.env.NEXT_PUBLIC_API_URL || "https://apiv2.smsoma.com";
    const firstImage = (event.imageList && event.imageList.length > 0)
        ? `${uploadUrl}/images/events/${event.images}/${event.imageList[0]}`
        : null;
    return (
        <Card shadow="sm" p="lg" radius="md" withBorder h="100%" sx={{ cursor: 'pointer', transition: 'transform 0.2s ease', '&:hover': { transform: 'translateY(-5px)' } }} onClick={onView}>
            <Card.Section>
                <Box h={160} sx={{ backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {firstImage ? (
                        <img src={firstImage}
                             alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <CalendarEvent size={48} color="#dee2e6" />}
                </Box>
            </Card.Section>
            <Group position="apart" mt="md" mb="xs">
                <Text weight={700} color="gray.8" lineClamp={1}>{event.name}</Text>
                <Badge color="blue" variant="light">{dayjs(event.date).format("YYYY-MM-DD")}</Badge>
            </Group>
            <Text size="sm" color="dimmed" lineClamp={2} mb="md" h={40}>{event.description}</Text>
            <Group grow spacing="xs" onClick={(e) => e.stopPropagation()}>
                <Button variant="light" color="blue" compact leftIcon={<Edit size={14} />} onClick={onEdit}>تعديل</Button>
                <Button variant="light" color="red" compact leftIcon={<Trash size={14} />} onClick={onDelete}>حذف</Button>
            </Group>
        </Card>
    );
};
