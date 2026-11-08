import {Alert, Box, Button, Group, Text} from "@mantine/core";
import { AlertTriangle, Check, X } from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTeams, useChangeStatusTeam} from "../../graphql";
import { Notyf } from "notyf";
import RegistrationPeriodInputs from "../Input/RegistrationPeriodInputs";
import {dayOf, isRegistrationOver, omanToday, periodError, toApiDay} from "../../lib/helpers/teamRegistration";

type Props = {
    data?: any;
} & ModalProps;

// توقيف الفريق يمنع كل حساباته من الدخول. وتفعيل فريق انتهت مدة تسجيله يلزمه
// تاريخ نهاية جديد، وإلا أوقفه الخادم من جديد في الليلة نفسها.
export const ChangeStatusTeamModal = ({ data, ...props }: Props) => {
    const [changeStatusTeam, {loading}] = useChangeStatusTeam();
    const stopping = Boolean(data?.account_status) && !isRegistrationOver(data?.registration_end);
    const needsNewEnd = !stopping && isRegistrationOver(data?.registration_end);
    const [newEnd, setNewEnd] = useState<Date | null>(null);
    const [endError, setEndError] = useState<string | null>(null);

    useEffect(() => {
        if (props.opened) { setNewEnd(null); setEndError(null); }
    }, [props.opened]);

    const onSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const content: any = { account_status: !stopping };
        if (needsNewEnd) {
            const problem = periodError(null, newEnd);
            setEndError(problem);
            if (problem) return;
            // A renewal is a new period: it starts the day the club renews it.
            content.registration_start = omanToday();
            content.registration_end = toApiDay(newEnd);
        }
        changeStatusTeam({
            variables: { id: data?.id, content },
            refetchQueries: [AllTeams]
        })
        .then(() => {
            closeModal();
            notyf.success(stopping ? "تم توقيف الفريق بنجاح" : "تم تفعيل الفريق بنجاح")
        })
        .catch(reason => {
            console.log(reason)
            const error = reason?.graphQLErrors?.[0];
            const code = error?.extensions?.code;
            notyf.error(
                code === "TEAM_REGISTRATION_ENDED" || code === "BAD_REGISTRATION_PERIOD" || code === "TEAM_NOT_IN_CLUB"
                    ? error.message
                    : "حدث خطأ أثناء تغيير حالة الفريق"
            )
        })
    };

    const closeModal = () => {
        props.onClose();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} bg={"primary"} loading={loading} onClick={onSubmit}>
                            {stopping ? "توقيف" : needsNewEnd ? "تجديد وتفعيل" : "تفعيل"}
                        </Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={() => ({padding: 20})}>
                {stopping ? (
                    <>
                        <Text size={"lg"} ta={"center"} mt={20} mb={8}>هل انت متأكد من توقيف هذا الفريق ؟</Text>
                        <Text size={"sm"} color={"dimmed"} ta={"center"} mb={20}>
                            لن يستطيع أي حساب في الفريق الدخول حتى تفعّله من جديد.
                        </Text>
                    </>
                ) : needsNewEnd ? (
                    <>
                        <Alert color="orange" icon={<AlertTriangle size={16} />} mb="md">
                            انتهت مدة تسجيل هذا الفريق في <bdi dir="ltr">{dayOf(data?.registration_end)}</bdi> — حدّد نهاية المدة الجديدة لتفعيله.
                        </Alert>
                        <RegistrationPeriodInputs
                            withStart={false}
                            start={null}
                            end={newEnd}
                            onStartChange={() => {}}
                            onEndChange={(v) => { setNewEnd(v); setEndError(null); }}
                            endError={endError}
                            endLabel="نهاية مدة التسجيل الجديدة"
                        />
                    </>
                ) : (
                    <Text size={"lg"} ta={"center"} my={20} >هل انت متأكد من تفعيل هذا الفريق ؟</Text>
                )}
            </Box>
        </Modal>
    );
};
