import { Box, Button, Group, PasswordInput, Stack } from "@mantine/core";
import { Check, X, Lock } from "tabler-icons-react";
import React from "react";
import { useForm } from "@mantine/form";
import { Notyf } from "notyf";
import Modal, { Props as ModalProps } from "./Modal";
import { useUpdatePassword } from "../../graphql";

type Props = { opened: boolean; onClose: () => void } & ModalProps;

export const ChangeMyPasswordModal = ({ opened, onClose, ...props }: Props) => {
  const [updatePassword, { loading }] = useUpdatePassword();
  const form = useForm({
    initialValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
    validate: {
      oldPassword: (v) => (v ? null : "أدخل كلمة المرور الحالية"),
      newPassword: (v) => (v && v.length >= 6 ? null : "كلمة المرور الجديدة (6 أحرف على الأقل)"),
      confirmPassword: (v, values) => (v === values.newPassword ? null : "كلمتا المرور غير متطابقتين"),
    },
  });

  const close = () => { form.reset(); onClose(); };

  const submit = form.onSubmit(async ({ oldPassword, newPassword }) => {
    const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
    try {
      const { data } = await updatePassword({ variables: { oldPassword, newPassword } });
      if (data?.updatePassword?.status) {
        notyf.success("تم تغيير كلمة المرور بنجاح");
        close();
      } else {
        notyf.error("تعذّر تغيير كلمة المرور");
      }
    } catch (e: any) {
      notyf.error(e?.graphQLErrors?.[0]?.message || "تعذّر تغيير كلمة المرور");
    }
  });

  return (
    <Modal
      {...props}
      opened={opened}
      onClose={close}
      title="تغيير كلمة المرور"
      footer={
        <Box py={16} px={20} bg="slate.0">
          <Group position="right" spacing="xs">
            <Button variant="outline" color="gray" rightIcon={<X size={15} />} bg="white" onClick={close} disabled={loading}>إلغاء</Button>
            <Button rightIcon={<Check size={15} />} type="submit" form="change_pw_form" loading={loading}>حفظ</Button>
          </Group>
        </Box>
      }
    >
      <Box p={20}>
        <form onSubmit={submit} id="change_pw_form">
          <Stack spacing="sm">
            <PasswordInput label="كلمة المرور الحالية" icon={<Lock size={16} />} placeholder="كلمة المرور الحالية" {...form.getInputProps("oldPassword")} />
            <PasswordInput label="كلمة المرور الجديدة" icon={<Lock size={16} />} placeholder="كلمة المرور الجديدة" {...form.getInputProps("newPassword")} />
            <PasswordInput label="تأكيد كلمة المرور" icon={<Lock size={16} />} placeholder="أعد إدخال كلمة المرور الجديدة" {...form.getInputProps("confirmPassword")} />
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};
