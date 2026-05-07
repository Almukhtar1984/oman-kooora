import React, { useState } from 'react';
import { Modal, Select, Button, Group, Stack, Text, Badge, Divider, Box } from '@mantine/core';
import { useChangeMemberClassification } from '../../graphql/hooks/members';
import { showNotification } from '@mantine/notifications';
import { AllPlayers, AllMembers, AllTechnicals } from '../../graphql/queries';

interface ChangeClassificationModalProps {
    opened: boolean;
    onClose: () => void;
    data: any;
    fromType: 'player' | 'technical' | 'member';
    onSuccess: () => void;
    idTeam: string;
}

export const ChangeClassificationModal = ({ opened, onClose, data, fromType, onSuccess, idTeam }: ChangeClassificationModalProps) => {
    const [toType, setToType] = useState<string | null>(null);
    const [changeClassification, { loading }] = useChangeMemberClassification();

    const handleSubmit = async () => {
        if (!toType) return;

        try {
            await changeClassification({
                variables: {
                    id: data.id,
                    fromType,
                    toType,
                },
                refetchQueries: [
                    { query: AllPlayers, variables: { idTeam } },
                    { query: AllMembers, variables: { idTeam } },
                    { query: AllTechnicals, variables: { idTeam } },
                ]
            });
            showNotification({
                title: 'نجاح',
                message: 'تم تغيير التصنيف بنجاح',
                color: 'green',
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showNotification({
                title: 'خطأ',
                message: 'فشل تغيير التصنيف',
                color: 'red',
            });
        }
    };

    const person = data?.person || data;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="تغيير تصنيف العضو"
            centered
            dir="rtl"
            size="sm"
        >
            <Stack spacing="lg">
                <Box>
                    <Text size="sm" color="dimmed" mb={4}>العضو الحالي:</Text>
                    <Text weight={600} size="md">
                        {person?.first_name} {person?.second_name} {person?.third_name} {person?.tribe}
                    </Text>
                </Box>

                <Group position="apart" grow>
                    <Box>
                        <Text size="xs" color="dimmed" mb={4}>التصنيف الحالي:</Text>
                        <Badge size="lg" radius="sm" color="blue" variant="filled">
                            {fromType === 'player' ? 'لاعب' : fromType === 'technical' ? 'جهاز فني' : 'مجلس إدارة'}
                        </Badge>
                    </Box>
                </Group>

                <Divider size="xs" label="التغيير إلى" labelPosition="center" />

                <Select
                    label="التصنيف الجديد"
                    placeholder="اختر التصنيف الجديد"
                    withinPortal
                    data={[
                        { value: 'player', label: 'لاعب', disabled: fromType === 'player' },
                        { value: 'technical', label: 'جهاز فني', disabled: fromType === 'technical' },
                        { value: 'member', label: 'مجلس الإدارة', disabled: fromType === 'member' },
                    ]}
                    value={toType}
                    onChange={setToType}
                />

                <Group position="right" mt="xl">
                    <Button variant="subtle" onClick={onClose} color="gray">إلغاء</Button>
                    <Button onClick={handleSubmit} loading={loading} disabled={!toType} color="blue">تأكيد التغيير</Button>
                </Group>
            </Stack>
        </Modal>
    );
};
