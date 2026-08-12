import { Box, Flex, Group, Text, RingProgress, Progress, Center, ThemeIcon } from "@mantine/core";
import React from "react";

/** A single headline metric tile. */
export const StatCard = ({
    label, value, icon, color = "cyan",
}: {
    label: string; value: number | string; icon: React.ReactNode; color?: string;
}) => (
    <Box
        p="lg"
        bg="white"
        sx={({ colors, radius, fn }) => ({
            borderRadius: radius.md,
            border: "1px solid " + colors.gray[2],
            transition: "transform .15s ease, box-shadow .15s ease",
            "&:hover": { transform: "translateY(-3px)", boxShadow: "0 10px 24px -12px " + fn.rgba(colors[color][6], 0.55) },
        })}
    >
        <Group position="apart" noWrap align="flex-start">
            <Box>
                <Text size="sm" color="gray.6" weight={500} mb={6}>{label}</Text>
                <Text sx={{ fontSize: 30, lineHeight: 1.1 }} weight={800} color="gray.8">
                    {typeof value === "number" ? value.toLocaleString("en-US") : value}
                </Text>
            </Box>
            <ThemeIcon size={52} radius="md" variant="light" color={color} sx={{ flexShrink: 0 }}>
                {icon}
            </ThemeIcon>
        </Group>
    </Box>
);

/** A titled panel wrapper. */
export const Panel = ({
    title, icon, children, right,
}: {
    title: string; icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode;
}) => (
    <Box
        p="lg"
        bg="white"
        sx={({ colors, radius }) => ({ borderRadius: radius.md, border: "1px solid " + colors.gray[2], height: "100%" })}
    >
        <Group position="apart" mb="md" noWrap>
            <Group spacing={8} noWrap>
                {icon ? <Box sx={({ colors }) => ({ color: colors.cyan[6], display: "flex" })}>{icon}</Box> : null}
                <Text weight={700} color="gray.8">{title}</Text>
            </Group>
            {right}
        </Group>
        {children}
    </Box>
);

const PALETTE = ["cyan", "teal", "blue", "grape", "orange", "green", "indigo", "pink", "red", "violet"];

/** Horizontal ranked bar list (name + count + proportional bar). */
export const BarList = ({
    data, emptyText = "لا توجد بيانات",
}: {
    data: { name: string; count: number }[]; emptyText?: string;
}) => {
    const items = (data || []).filter(Boolean);
    const max = Math.max(1, ...items.map((d) => d.count));
    if (!items.length) return <Text size="sm" color="gray.5">{emptyText}</Text>;
    return (
        <Flex direction="column" gap={14}>
            {items.map((d, i) => (
                <Box key={d.name + i}>
                    <Group position="apart" mb={4} noWrap>
                        <Text size="sm" color="gray.7" weight={500} lineClamp={1}>{d.name}</Text>
                        <Text size="sm" color="gray.8" weight={700}>{d.count.toLocaleString("en-US")}</Text>
                    </Group>
                    <Progress value={(d.count / max) * 100} color={PALETTE[i % PALETTE.length]} radius="xl" size="md" />
                </Box>
            ))}
        </Flex>
    );
};

/** A donut summarising a small set of categories. */
export const DonutSummary = ({
    data,
}: {
    data: { name: string; count: number }[];
}) => {
    const items = (data || []).filter((d) => d.count > 0);
    const total = items.reduce((s, d) => s + d.count, 0);
    if (!total) return <Text size="sm" color="gray.5">لا توجد بيانات</Text>;
    return (
        <Group align="center" spacing="xl" noWrap>
            <RingProgress
                size={150}
                thickness={16}
                roundCaps
                sections={items.map((d, i) => ({ value: (d.count / total) * 100, color: PALETTE[i % PALETTE.length] }))}
                label={
                    <Center>
                        <Box ta="center">
                            <Text size="xl" weight={800} color="gray.8">{total.toLocaleString("en-US")}</Text>
                            <Text size="xs" color="gray.5">الإجمالي</Text>
                        </Box>
                    </Center>
                }
            />
            <Flex direction="column" gap={8} sx={{ flex: 1 }}>
                {items.map((d, i) => (
                    <Group key={d.name} position="apart" noWrap>
                        <Group spacing={8} noWrap>
                            <Box w={10} h={10} sx={({ colors }) => ({ borderRadius: "50%", background: colors[PALETTE[i % PALETTE.length]][6] })} />
                            <Text size="sm" color="gray.7" lineClamp={1}>{d.name}</Text>
                        </Group>
                        <Text size="sm" weight={700} color="gray.8">{d.count.toLocaleString("en-US")}</Text>
                    </Group>
                ))}
            </Flex>
        </Group>
    );
};
