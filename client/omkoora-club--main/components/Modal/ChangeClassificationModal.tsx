import React, { useState } from 'react';
import { Modal, Select, Button, Group, Stack, Text, Badge, Divider, Box } from '@mantine/core';
import { useChangeMemberClassification } from '../../graphql/hooks/members';
import { Notyf } from 'notyf';
import { AllPlayers, AllMembers, AllTechnicals } from '../../graphql/queries';
import {
    BOARD_POSITIONS, ClassificationDetails, PLAYER_CENTERS, PLAYER_CLASSES, TECHNICAL_CLASSIFICATIONS,
    detailsFor, detailsMissing,
} from '../../lib/helpers/classificationDetails';

interface ChangeClassificationModalProps {
    opened: boolean;
    onClose: () => void;
    data: any;
    fromType: 'player' | 'technical' | 'member';
    onSuccess: () => void;
    idClub: string;
}

export const ChangeClassificationModal = ({ opened, onClose, data, fromType, onSuccess, idClub }: ChangeClassificationModalProps) => {
    const [toType, setToType] = useState<string | null>(null);
    // ما بعد النوع: المركز والفئة العمرية، أو الصفة، أو المنصب.
    const [details, setDetails] = useState<ClassificationDetails>({});
    const [changeClassification, { loading }] = useChangeMemberClassification();
    const missing = detailsMissing(toType, details);

    const chooseType = (value: string | null) => {
        setToType(value);
        setDetails({});
    };
    const setDetail = (key: keyof ClassificationDetails) => (value: string | null) =>
        setDetails((current) => ({ ...current, [key]: value }));

    const handleSubmit = async () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!toType) {
            notyf.error("اختر التصنيف الجديد");
            return;
        }
        if (missing.length > 0) {
            notyf.error(`اختر ${missing.join(' و')}`);
            return;
        }
        if (!data?.id) {
            notyf.error("لم يتم تحديد العضو");
            return;
        }

        try {
            await changeClassification({
                variables: {
                    id: data.id,
                    fromType,
                    toType,
                    ...detailsFor(toType, details),
                },
                refetchQueries: [
                    { query: AllPlayers, variables: { idClub } },
                    { query: AllMembers, variables: { idClub } },
                    { query: AllTechnicals, variables: { idClub } },
                ],
                awaitRefetchQueries: true,
            });
            notyf.success("تم تغيير التصنيف بنجاح");
            chooseType(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            notyf.error(error?.graphQLErrors?.[0]?.message || error?.message || "فشل تغيير التصنيف");
        }
    };

    const handleClose = () => {
        chooseType(null);
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="تغيير تصنيف العضو"
            centered
            dir="rtl"
            size="sm"
        >
            <Stack spacing="lg">
                <Box>
                    <Text size="sm" color="dimmed" mb={4}>العضو الحالي:</Text>
                    <Text weight={600} size="md">
                        {data?.person?.first_name} {data?.person?.second_name} {data?.person?.third_name} {data?.person?.tribe}
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
                        { value: 'member', label: 'مجلس إدارة', disabled: fromType === 'member' },
                    ]}
                    value={toType}
                    onChange={chooseType}
                />

                {toType === 'player' ? (
                    <>
                        <Select
                            label="الفئة العمرية"
                            placeholder="اختر الفئة العمرية"
                            withAsterisk
                            withinPortal
                            data={PLAYER_CLASSES}
                            value={details.class ?? null}
                            onChange={setDetail('class')}
                        />
                        <Select
                            label="مركز اللاعب"
                            placeholder="اختر المركز الذي يلعب فيه"
                            withAsterisk
                            withinPortal
                            data={PLAYER_CENTERS}
                            value={details.player_center ?? null}
                            onChange={setDetail('player_center')}
                        />
                    </>
                ) : null}
                {toType === 'technical' ? (
                    <Select
                        label="الصفة في الجهاز الفني"
                        placeholder="مدرب، مساعد مدرب…"
                        withAsterisk
                        withinPortal
                        data={TECHNICAL_CLASSIFICATIONS}
                        value={details.classification ?? null}
                        onChange={setDetail('classification')}
                    />
                ) : null}
                {toType === 'member' ? (
                    <Select
                        label="المنصب في مجلس الإدارة"
                        placeholder="رئيس، نائب رئيس، أمين الصندوق…"
                        withAsterisk
                        withinPortal
                        data={BOARD_POSITIONS}
                        value={details.classification ?? null}
                        onChange={setDetail('classification')}
                    />
                ) : null}

                <Group position="right" mt="xl">
                    <Button variant="subtle" onClick={handleClose} color="gray">إلغاء</Button>
                    <Button onClick={handleSubmit} loading={loading} disabled={!toType || missing.length > 0} color="blue">تأكيد التغيير</Button>
                </Group>
            </Stack>
        </Modal>
    );
};
