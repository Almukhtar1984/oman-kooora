import { Box, Col, Grid, Group, Loader, Paper, Skeleton, Stack, Text } from "@mantine/core";
import { IconDatabaseOff } from "@tabler/icons-react";
import React from "react";

// Every heavy list (players / board members / technical staff / membership …)
// used to render the "لا يوجد بيانات" empty state while its query was still in
// flight, so a slow page looked like a page with no data at all. These three
// states are now explicit: loading → skeleton, empty → empty state, otherwise
// the list itself.

type Variant = "cards" | "rows";

const shimmer = {
    // Mantine's Skeleton already animates; this just softens the card edges so a
    // loading grid reads as the same layout that is about to appear.
    borderRadius: 16,
};

/** One placeholder member/player card — mirrors the real card's proportions. */
const CardSkeleton = () => (
    <Paper radius={16} p={12} withBorder sx={{ overflow: "hidden" }}>
        <Skeleton height={168} sx={shimmer} mb={12} />
        <Skeleton height={14} width="70%" mb={8} mx="auto" />
        <Skeleton height={10} width="45%" mb={14} mx="auto" />
        <Group position="apart" spacing={8} noWrap>
            <Skeleton height={10} width="30%" />
            <Skeleton height={10} width="30%" />
            <Skeleton height={10} width="30%" />
        </Group>
    </Paper>
);

/** One placeholder table row. */
const RowSkeleton = () => (
    <Group position="apart" noWrap spacing={12} py={10} px={12}>
        <Skeleton height={34} circle />
        <Skeleton height={12} width="28%" />
        <Skeleton height={12} width="18%" />
        <Skeleton height={12} width="18%" />
        <Skeleton height={12} width="12%" />
    </Group>
);

export const DataLoading = ({
    variant = "cards",
    count,
    label = "جاري تحميل البيانات...",
}: {
    variant?: Variant;
    count?: number;
    label?: string;
}) => {
    const items = count ?? (variant === "cards" ? 8 : 6);

    return (
        <Box data-testid="data-loading" aria-busy="true" aria-live="polite" py={8}>
            <Group position="center" spacing={10} mb={18}>
                <Loader size="sm" variant="oval" />
                <Text size="sm" fw={500} c="gray.7">{label}</Text>
            </Group>

            {variant === "cards" ? (
                <Grid gutter="md">
                    {Array.from({ length: items }).map((_, i) => (
                        <Col key={i} xs={12} sm={6} md={4} lg={3}>
                            <CardSkeleton />
                        </Col>
                    ))}
                </Grid>
            ) : (
                <Paper radius={12} withBorder>
                    <Stack spacing={0}>
                        {Array.from({ length: items }).map((_, i) => (
                            <Box
                                key={i}
                                sx={(theme) => ({
                                    borderBottom: i === items - 1 ? "none" : `1px solid ${theme.colors.gray[2]}`,
                                })}
                            >
                                <RowSkeleton />
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Box>
    );
};

export const DataEmpty = ({ label = "لا يوجد بيانات" }: { label?: string }) => (
    <Stack data-testid="data-empty" mih={300} align="center" justify="center">
        <IconDatabaseOff size={"5rem"} strokeWidth={1} color={"#ADB5BD"} />
        <Text size={"md"} c={"gray.8"}>{label}</Text>
    </Stack>
);

/**
 * Renders children only once the data is in: skeleton while loading, the empty
 * state only after loading finished with nothing to show.
 */
export const DataState = ({
    loading,
    empty,
    variant = "cards",
    count,
    loadingLabel,
    emptyLabel,
    children,
}: {
    loading?: boolean;
    empty?: boolean;
    variant?: Variant;
    count?: number;
    loadingLabel?: string;
    emptyLabel?: string;
    children?: React.ReactNode;
}) => {
    if (loading) return <DataLoading variant={variant} count={count} label={loadingLabel} />;
    if (empty) return <DataEmpty label={emptyLabel} />;
    return <>{children}</>;
};

export default DataState;
