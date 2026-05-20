import { Box, Button, Group, SegmentedControl, Text, Stack, ThemeIcon, useMantineTheme } from "@mantine/core";
import { IconCheck, IconX, IconClock } from "@tabler/icons-react";
import { Notyf } from "notyf";
import { useEffect, useState } from "react";
import { AllLeagues, useUpdateMatchState } from "../../graphql";
import Modal, { Props as ModalProps } from "./Modal";

type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

const STATE_OPTIONS = [
    { value: "before-start", label: "قبل البداية" },
    { value: "playing", label: "جارية" },
    { value: "end", label: "منتهية" },
];

export const UpdateMatchStateModal = ({ data, ...props }: Props) => {
    const theme = useMantineTheme();
    const [state, setState] = useState<string>("before-start");

    useEffect(() => {
        if (props.opened) {
            setState(data?.matchState || "before-start");
        }
    }, [props.opened, data]);

    const [updateMatchState, { loading }] = useUpdateMatchState();

    const onSave = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        updateMatchState({
            variables: { id: data?.id, state },
            refetchQueries: [AllLeagues],
            awaitRefetchQueries: true,
            onCompleted: () => {
                props.onClose();
                notyf.success("تم تحديث حالة المباراة");
            },
            onError: (err) => {
                notyf.error(err?.message || "فشل تحديث الحالة");
            },
        });
    };

    return (
        <Modal
            {...props}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group justify={"left"} gap={"xs"}>
                        <Button variant="outline" rightSection={<IconX size={15} />} bg="white" onClick={props.onClose}>
                            إلغاء
                        </Button>
                        <Button rightSection={<IconCheck size={15} />} onClick={onSave} loading={loading}>
                            حفظ
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box style={{ padding: 20 }}>
                <Group gap={10} align="center" mb={16}>
                    <ThemeIcon size={36} radius="md" variant="light" color="cyan">
                        <IconClock size={20} />
                    </ThemeIcon>
                    <Stack gap={2}>
                        <Text fw={600} c={theme.colors.gray[8]}>حالة المباراة</Text>
                        <Text size="xs" c={theme.colors.gray[5]}>
                            {`${data?.firstTeam?.team?.name || ""} ضد ${data?.secondTeam?.team?.name || ""}`}
                        </Text>
                    </Stack>
                </Group>

                <SegmentedControl
                    fullWidth
                    color="cyan"
                    value={state}
                    onChange={setState}
                    data={STATE_OPTIONS}
                />
            </Box>
        </Modal>
    );
};
