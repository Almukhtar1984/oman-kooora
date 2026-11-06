import { Button, Group, Paper, Text } from "@mantine/core";
import React from "react";

interface Props {
    count: number;
    onClear: () => void;
}

// يقول لماذا القائمة قصيرة، ويعيدها كاملة بضغطة.
export function PendingFocusBar({ count, onClear }: Props) {
    return (
        <Paper withBorder radius="md" p="xs" px="md" mb="md" sx={(theme) => ({ background: theme.colors.yellow[0] })}>
            <Group position="apart" spacing="xs">
                <Text size="sm" weight={600} color="gray.8">
                    {count > 0
                        ? `تعرض الطلبات التي تنتظر قرارك فقط (${count})`
                        : "لم يبقَ هنا طلب ينتظر قرارك"}
                </Text>
                <Button size="xs" variant="subtle" onClick={onClear}>عرض الكل</Button>
            </Group>
        </Paper>
    );
}
