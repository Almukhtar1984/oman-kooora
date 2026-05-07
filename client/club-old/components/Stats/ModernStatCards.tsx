import { Box, Group, Stack, Text, useMantineTheme } from "@mantine/core";
import React from "react";

interface GradientStatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    gradientFrom: string;
    gradientTo: string;
    accentColor: string;
}

export function GradientStatCard({ label, value, icon, gradientFrom, gradientTo, accentColor }: GradientStatCardProps) {
    return (
        <Box
            sx={{
                background: `linear-gradient(145deg, ${gradientFrom}, ${gradientTo})`,
                borderRadius: 16,
                padding: "20px 24px",
                height: 140,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: `0 4px 24px ${gradientFrom}55`,
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: `0 8px 32px ${gradientFrom}77`,
                },
            }}
        >
            {/* Decorative circle */}
            <Box
                sx={{
                    position: "absolute",
                    top: -28,
                    right: -28,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    pointerEvents: "none",
                }}
            />
            <Group position="apart" align="flex-start" noWrap>
                <Text size="sm" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, lineHeight: 1.4 }}>
                    {label}
                </Text>
                <Box
                    sx={{
                        backgroundColor: "rgba(255,255,255,0.18)",
                        borderRadius: 12,
                        padding: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
            </Group>
            <Text
                sx={{
                    color: "white",
                    fontSize: 36,
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: "-1px",
                }}
            >
                {value}
            </Text>
        </Box>
    );
}

interface OutlineStatCardProps {
    label: string;
    value: number | string;
    subLabel: string;
    icon: React.ReactNode;
    accentColor: string;
    borderColor: string;
    iconBg: string;
}

export function OutlineStatCard({ label, value, subLabel, icon, accentColor, borderColor, iconBg }: OutlineStatCardProps) {
    return (
        <Box
            sx={(theme: any) => ({
                backgroundColor: theme.white,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 16,
                padding: "20px 24px",
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: `0 6px 24px ${borderColor}88`,
                },
            })}
        >
            <Stack spacing={2}>
                <Text size="sm" color="dimmed" sx={{ fontWeight: 500 }}>
                    {label}
                </Text>
                <Text
                    sx={{
                        color: accentColor,
                        fontSize: 36,
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: "-1px",
                    }}
                >
                    {value}
                </Text>
                <Text size="xs" color="dimmed" mt={2}>
                    {subLabel}
                </Text>
            </Stack>
            <Box
                sx={{
                    backgroundColor: iconBg,
                    borderRadius: 14,
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
        </Box>
    );
}
