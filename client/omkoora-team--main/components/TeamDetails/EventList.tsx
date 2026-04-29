import { SimpleGrid, Loader, Box, Flex, Text } from "@mantine/core";
import { UserOff } from "tabler-icons-react";
import React from "react";
import { EventCard } from "./EventCard";

interface EventListProps {
    events: any[];
    loading: boolean;
    idTeam: string;
    onEdit: (event: any) => void;
    onDelete: (id: string) => void;
    onView: (event: any) => void;
}

const NoData = ({ message = "لا توجد بيانات متاحة" }: { message?: string }) => (
    <Flex direction="column" align="center" py={40} gap="sm">
        <UserOff size={40} color="#adb5bd" strokeWidth={1.5} />
        <Text color="dimmed" size="sm">{message}</Text>
    </Flex>
);

export const EventList = ({ events, loading, idTeam, onEdit, onDelete, onView }: EventListProps) => {
    if (loading) return <Loader variant="dots" />;
    if (!events || events.length === 0) return <NoData message="لا توجد فعاليات مسجلة لهذا الفريق" />;

    return (
        <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'xs', cols: 1 }]}>
            {events.map((ev: any) => (
                <EventCard 
                    key={ev.id} 
                    event={ev} 
                    onView={() => onView(ev)}
                    onEdit={() => onEdit(ev)}
                    onDelete={() => onDelete(ev.id)}
                />
            ))}
        </SimpleGrid>
    );
};
