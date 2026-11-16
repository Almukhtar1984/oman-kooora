import {Box, Button, Col, FileInput, Grid, Group, Select, Textarea,} from "@mantine/core";
import {Check, ChevronDown, Paperclip, X} from "tabler-icons-react";
import React, {useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {useAddComment, Message, AllMessageReceiver, AllMessagesSender} from "../../graphql";
import useStore from "../../store/useStore";
import { useForm } from '@mantine/form';
import {Notyf} from "notyf";

type Props = {
    data?: any;
} & ModalProps;

export const AddCommentModal = ({ data, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: { content: "", note: "" },
        validate: { content: (v: string) => (v ? null : "اختر التعليق") },
    });
    const [createComment, {loading}] = useAddComment();
    // «أريد أرفق مستندات في التعليق» (اجتماع العميل، 2026-11-16).
    const [files, setFiles] = useState<File[]>([]);

    const onSubmit = ({content, note }: any) => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        createComment({
            variables: {
                content: {
                    content,
                    note,
                    attachment: files,
                    id_message: data,
                    id_club: idClub
                }
            },
            // والقائمة تعدّ التعليقات، فتُحدَّث معها.
            refetchQueries: [Message, AllMessageReceiver, AllMessagesSender],
            onCompleted: () => {
                closeModal();
                notyf.success("تم اضافة التعليق بنجاح")
            },
            onError: ({graphQLErrors}) => {
                notyf.error(graphQLErrors?.[0]?.message || "تعذّر حفظ التعليق")
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setFiles([]);
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form" loading={loading}>تأكيد</Button>
                    </Group>
                </Box>
            }
            zIndex={205}
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Select
                                label="التعليق"
                                placeholder="اختر تعليق"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                withinPortal
                                data={['الرجاء الاعتماد', 'الرجاء التحقيق', 'الرجاء اتخاذ الإجراء اللازم', 'الرجاء المراجعة', 'للعلم', 'تم الاعتماد', 'تم التحقيق', 'تم المراجعة']}

                                {...form.getInputProps("content")}
                            />
                        </Col>

                        <Col span={12}>
                            <Textarea
                                label="الملاحظة"
                                placeholder="اكتب ملاحظة ( اختيار )"
                                {...form.getInputProps("note")}
                                minRows={5}
                            />
                        </Col>

                        <Col span={12}>
                            <FileInput
                                label="مستندات مرفقة (اختياري)"
                                description="PDF، Word، Excel، صور — تظهر مع التعليق للطرف الآخر، ويصله إشعار بأن فيه مستنداً"
                                multiple
                                clearable
                                icon={<Paperclip size={16} />}
                                value={files}
                                onChange={setFiles}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
                            />
                        </Col>

                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};