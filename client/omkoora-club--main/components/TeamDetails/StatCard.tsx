import { Card, Flex, Box, Text, MantineTheme } from "@mantine/core";
import { useTheme } from "@emotion/react";
import React from "react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon: any;
    color: string;
}

export const StatCard = ({ label, value, icon: Icon, color }: StatCardProps) => {
    const theme = useTheme() as MantineTheme;
    return (
        <Card shadow="none" p="lg" radius="md" withBorder sx={{ borderColor: theme.colors.gray[2], backgroundColor: 'white' }}>
            <Flex align="center" gap="md">
                <Flex align="center" justify="center" w={48} h={48} sx={{ backgroundColor: `${color}15`, borderRadius: 12 }}>
                    <Icon size={24} color={color} strokeWidth={1.8} />
                </Flex>
                <Box>
                    <Text size="xs" color="gray.5" weight={600} transform="uppercase">{label}</Text>
                    <Text size="xl" weight={800} color="gray.9" sx={{ lineHeight: 1 }}>{value ?? 0}</Text>
                </Box>
            </Flex>
        </Card>
    );
};
