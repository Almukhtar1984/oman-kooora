import {
  Alert, Box, Button, Group, Loader, Overlay, Stack, Text, List, ThemeIcon,
} from "@mantine/core";
import { Check, InfoCircle, X, Upload, FileSpreadsheet } from "tabler-icons-react";
import React, { useRef, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import { Dropzone, MS_EXCEL_MIME_TYPE } from "@mantine/dropzone";
import { Notyf } from "notyf";
import { useUploadAssemblySheet } from "../../graphql";

type Props = {
  opened: boolean;
  onClose: () => void;
  onImported?: () => void;
} & ModalProps;

export const UploadAssemblyBySheetModal = ({ opened, onClose, onImported, ...props }: Props) => {
  const userData = useStore((state: any) => state.userData);
  const idClub = userData?.person?.clubManagement?.club?.id;

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const openRef = useRef<() => void>(null);

  const [uploadAssemblySheet, { loading }] = useUploadAssemblySheet();

  const closeModal = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    onClose();
  };

  const onConfirm = async () => {
    setErrorMsg(null);
    setResult(null);
    if (!file) { setErrorMsg("يرجى اختيار ملف الإكسل أولاً"); return; }
    if (!idClub) { setErrorMsg("تعذّر تحديد النادي"); return; }
    const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
    try {
      const { data } = await uploadAssemblySheet({ variables: { idClub, file } });
      const res = data?.uploadAssemblySheet;
      setResult(res);
      notyf.success(res?.message || "تم الاستيراد بنجاح");
      onImported && onImported();
    } catch (e: any) {
      const msg = e?.graphQLErrors?.[0]?.message || "فشل استيراد الملف";
      setErrorMsg(msg);
      notyf.error(msg);
    }
  };

  return (
    <Modal
      {...props}
      opened={opened}
      onClose={closeModal}
      title="استيراد الجمعية العمومية من إكسل"
      footer={
        <Box py={16} px={20} bg="slate.0">
          <Group position="right" spacing="xs">
            <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal} disabled={loading}>
              إغلاق
            </Button>
            <Button rightIcon={<Check size={15} />} onClick={onConfirm} loading={loading} disabled={!file}>
              استيراد
            </Button>
          </Group>
        </Box>
      }
    >
      {loading ? (
        <Overlay opacity={0.9} color="#fff" zIndex={5}>
          <Stack align="center" justify="center" h="100%" w="100%">
            <Loader size="xl" variant="dots" />
            <Text size="lg" fw={500}>جارٍ استيراد الأعضاء… قد يستغرق دقيقة للملفات الكبيرة</Text>
          </Stack>
        </Overlay>
      ) : null}

      <Box p={20}>
        <Alert variant="light" color="cyan" icon={<InfoCircle />} mb="md">
          يقرأ الملف تلقائيًا حسب عناوين الأعمدة. الأعمدة المتعرَّف عليها:
          <Text size="sm" mt={6} weight={600}>
            الاسم · رقم العضوية · الرقم المدني · تاريخ الميلاد · رقم الهاتف · نوع العضوية · تاريخ الانتساب
          </Text>
          <Text size="xs" color="dimmed" mt={6}>
            يُحفظ «رقم العضوية» كما هو، ويُقسَّم الاسم تلقائيًا، وتُتخطّى الصفوف المكرّرة. لا يلزم اكتمال كل الحقول.
          </Text>
        </Alert>

        <Text size="sm" mb={10}>
          ملف الإكسل
          {file ? <Text color="green" span> — {file.name}</Text> : null}
        </Text>
        <Dropzone
          openRef={openRef}
          activateOnClick={false}
          multiple={false}
          onDrop={(files) => { setFile(files[0]); setResult(null); }}
          styles={{ inner: { pointerEvents: "all" } }}
          maxSize={30 * 1024 ** 2}
          accept={MS_EXCEL_MIME_TYPE}
          style={{
            borderColor: file ? "green" : "#9ca3af",
            background: file ? "#0080002e" : "#fff",
          }}
        >
          <Group position="center" py="md">
            <Button leftIcon={<Upload size={16} />} onClick={() => (openRef.current ? openRef.current() : undefined)}>
              اختر ملف / اسحب ملف إلى هنا
            </Button>
          </Group>
        </Dropzone>

        {errorMsg ? (
          <Alert variant="light" color="red" icon={<X />} mt="md">{errorMsg}</Alert>
        ) : null}

        {result ? (
          <Box mt="md" p="md" sx={({ colors, radius }) => ({ borderRadius: radius.md, border: "1px solid " + colors.green[2], background: colors.green[0] })}>
            <Group spacing={8} mb={8}>
              <ThemeIcon color="green" radius="xl" size={26}><Check size={16} /></ThemeIcon>
              <Text weight={700} color="green.8">تمّ الاستيراد</Text>
            </Group>
            <List spacing={4} size="sm" center>
              <List.Item icon={<ThemeIcon color="green" size={18} radius="xl"><FileSpreadsheet size={12} /></ThemeIcon>}>
                تمت الإضافة: <b>{result.created}</b> عضو
              </List.Item>
              <List.Item>تم تخطّي المكرّر: <b>{result.duplicates}</b></List.Item>
              {result.skipped ? <List.Item>تعذّر إدخال: <b>{result.skipped}</b></List.Item> : null}
              <List.Item>إجمالي الصفوف: <b>{result.totalRows}</b></List.Item>
            </List>
          </Box>
        ) : null}
      </Box>
    </Modal>
  );
};
