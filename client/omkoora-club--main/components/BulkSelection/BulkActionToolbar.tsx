import React from "react";
import { Box, Button, Checkbox, Group, Text, Tooltip } from "@mantine/core";
import { Check, X, ListCheck } from "tabler-icons-react";

interface Props {
    totalOnPage:        number;
    selectedCount:      number;
    waitingCount:       number;
    allOnPageSelected:  boolean;
    onToggleSelectPage: (checked: boolean) => void;
    onSelectAllPending: () => void;
    onAcceptSelected:   () => void;
    onRejectSelected:   () => void;
    onClearSelection:   () => void;
    loading?:           boolean;
    canChangeStatus:    boolean;
}

export const BulkActionToolbar = ({
    totalOnPage,
    selectedCount,
    waitingCount,
    allOnPageSelected,
    onToggleSelectPage,
    onSelectAllPending,
    onAcceptSelected,
    onRejectSelected,
    onClearSelection,
    loading,
    canChangeStatus,
}: Props) => {
    if (!canChangeStatus) return null;

    const hasSelection = selectedCount > 0;
    const indeterminate = selectedCount > 0 && !allOnPageSelected;

    return (
        <Box
            mb={12}
            p={10}
            sx={(theme) => ({
                border: `1px solid ${theme.colors.gray[3]}`,
                borderRadius: 12,
                backgroundColor: hasSelection ? "#FFF7E6" : theme.colors.gray[0],
                transition: "background-color 0.2s",
            })}
        >
            <Group position="apart" align="center" noWrap sx={{ flexWrap: "wrap", rowGap: 8 }}>
                <Group spacing="md" noWrap sx={{ flexWrap: "wrap", rowGap: 8 }}>
                    <Tooltip
                        label={
                            totalOnPage === 0
                                ? "لا يوجد عناصر في الصفحة"
                                : allOnPageSelected
                                    ? "إلغاء تحديد الكل في الصفحة"
                                    : "تحديد الكل في الصفحة"
                        }
                        withArrow
                    >
                        <Checkbox
                            checked={allOnPageSelected && totalOnPage > 0}
                            indeterminate={indeterminate}
                            disabled={totalOnPage === 0}
                            onChange={(e) => onToggleSelectPage(e.currentTarget.checked)}
                            label={
                                <Text size="sm" weight={600}>
                                    {hasSelection ? `محدّد: ${selectedCount}` : "تحديد الكل في الصفحة"}
                                </Text>
                            }
                        />
                    </Tooltip>

                    {waitingCount > 0 && (
                        <Button
                            size="xs"
                            variant="light"
                            color="yellow"
                            leftIcon={<ListCheck size={16} />}
                            onClick={onSelectAllPending}
                            disabled={loading}
                        >
                            تحديد كل قيد الانتظار ({waitingCount})
                        </Button>
                    )}
                </Group>

                <Group spacing="xs" noWrap>
                    {hasSelection && (
                        <Button
                            size="xs"
                            variant="subtle"
                            color="gray"
                            onClick={onClearSelection}
                            disabled={loading}
                        >
                            إلغاء التحديد
                        </Button>
                    )}
                    <Button
                        size="xs"
                        color="teal"
                        leftIcon={<Check size={16} />}
                        onClick={onAcceptSelected}
                        disabled={!hasSelection || loading}
                        loading={loading}
                    >
                        قبول المحدّد {hasSelection ? `(${selectedCount})` : ""}
                    </Button>
                    <Button
                        size="xs"
                        color="red"
                        leftIcon={<X size={16} />}
                        onClick={onRejectSelected}
                        disabled={!hasSelection || loading}
                        loading={loading}
                    >
                        رفض المحدّد {hasSelection ? `(${selectedCount})` : ""}
                    </Button>
                </Group>
            </Group>
        </Box>
    );
};
