import {
  Alert, Box, Button, Col, Grid, Group, Loader, Overlay, Select, Stack, Text,
} from "@mantine/core";
import { Check, ChevronDown, Upload, X } from "tabler-icons-react";
import React, { useEffect, useRef, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import { useAllTeams, useUploadPlayersSheet } from "../../graphql";
import { useForm } from "@mantine/form";
import { Dropzone } from "@mantine/dropzone";
import useStore from "../../store/useStore";

type Props = {
  opened: boolean;
  onClose: () => void;
} & ModalProps;

export const UploadPlayerBySheetModal = ({
  title,
  opened,
  onClose,
  ...props
}: Props) => {
  const userData = useStore((state: any) => state.userData);

  // State for team list
  const [allTeams, setAllTeams] = useState<{ value: string; label: string }[]>([]);
  const [getAllTeam, { data: dataAllTeams, loading: loadingTeams, error: errorTeams }] = useAllTeams();

  // Upload mutation
  const [uploadPlayersSheet, { data: uploadData, loading: uploading, error: mutationError }] = useUploadPlayersSheet();

  const [uploadError, setUploadError] = useState<string | null>(null);

  // For opening Dropzone by button click
  const openRef = useRef<() => void>(null);

  // Fetch teams for user's club when modal opens
  useEffect(() => {
    if (
      opened &&
      userData?.person?.clubManagement?.club?.id
    ) {
      const idClub = userData?.person?.clubManagement?.club?.id;
      getAllTeam({ variables: { idClub } });
    }
    // eslint-disable-next-line
  }, [opened, userData]);

  // Build dropdown data after fetching
  useEffect(() => {
    if (dataAllTeams && "allTeam" in dataAllTeams) {
      let newAllTeams: { value: string; label: string }[] = [];
      for (let index = 0; index < dataAllTeams.allTeam.length; index++) {
        const element = dataAllTeams.allTeam[index];
        newAllTeams.push({ value: element?.id, label: element?.name });
      }
      setAllTeams([...newAllTeams]);
    }
  }, [dataAllTeams]);

  // Mantine form setup
  const form = useForm({
    initialValues: {
      teamId: "",
      file: null as File | null,
    },
    validate: {
      teamId: (value) => value ? null : "يجب اختيار الفريق",
      file: (value) => value ? null : "يرجى رفع ملف",
    }
  });

  // Upload handler (calls mutation directly)
  const onSubmit = async (values: typeof form.values) => {
    setUploadError(null);
    try {
      await uploadPlayersSheet({
        variables: {
          file: values.file,
          teamId: values.teamId,
        },
      });
      // Do not close modal! Instead, let user see the result below
      // closeModal();
    } catch (err: any) {
      setUploadError("حدث خطأ أثناء رفع الملف. حاول مرة أخرى.");
    }
  };

  // Modal close & reset
  const closeModal = () => {
    onClose();
    form.reset();
    setUploadError(null);
  };

  return (
    <Modal
      {...props}
      opened={opened}
      onClose={closeModal}
      title="رفع ملف لاعبين"
      footer={
        <Box py={16} px={20} bg="slate.0">
          <Group position={"right"} spacing={"xs"}>
            <Button
              variant="outline"
              rightIcon={<X size={15} />}
              bg="white"
              onClick={closeModal}
              disabled={uploading}
            >
              إلغاء
            </Button>
            <Button
              rightIcon={<Check size={15} />}
              type="submit"
              form="upload_sheet_form"
              loading={uploading}
            >
              تأكيد
            </Button>
          </Group>
        </Box>
      }
    >
      {uploading ? (
        <Overlay opacity={0.9} color="#fff" zIndex={5}>
          <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
            <Loader size="xl" variant="dots" />
            <Text size={"lg"} fw={500}>يتم رفع الملف يرجى الانتظار...</Text>
          </Stack>
        </Overlay>
      ) : null}

      <Box sx={{ padding: 20 }}>
        <form onSubmit={form.onSubmit(onSubmit)} id="upload_sheet_form">
          <Grid gutter={20}>
            <Col span={12}>
              <Alert variant="light" color="yellow">الرجاء اختيار الفريق ورفع ملف الإكسل أو CSV.</Alert>
            </Col>
            <Col span={12}>
              <Select
                label="اختر الفريق"
                placeholder={loadingTeams ? "يتم التحميل..." : "اختر الفريق"}
                data={allTeams}
                searchable
                nothingFound="لا يوجد فرق"
                rightSection={<ChevronDown size={16} />}
                {...form.getInputProps("teamId")}
                disabled={loadingTeams || uploading}
                required
              />
            </Col>
            <Col span={12}>
              <Text size="sm" mb={10}>
                ملف الإكسل أو CSV للاعبين
                {form.values.file ? <Text color="green" span>تم الرفع</Text> : null}
              </Text>
              <Dropzone
                openRef={openRef}
                onDrop={(files) => form.setFieldValue("file", files[0])}
                multiple={false}
                accept={[".xlsx", ".xls", ".csv"]}
                maxSize={6 * 1024 ** 2}
                disabled={uploading}
                styles={{ inner: { pointerEvents: 'all' } }}
              >
                <Group position="center" spacing="sm">
                  <Button
                    onClick={() => openRef.current?.()}
                    leftIcon={<Upload size={18} />}
                    variant="light"
                  >
                    اختر ملف / اسحب ملف إلى هنا
                  </Button>
                  {form.values.file && <Text size="xs" color="dimmed">{form.values.file.name}</Text>}
                </Group>
              </Dropzone>
            </Col>
            {uploadError && (
              <Col span={12}>
                <Alert color="red">{uploadError}</Alert>
              </Col>
            )}
            {mutationError && (
              <Col span={12}>
                <Alert color="red">{mutationError.message}</Alert>
              </Col>
            )}
            {errorTeams && (
              <Col span={12}>
                <Alert color="red">حدث خطأ في تحميل الفرق</Alert>
              </Col>
            )}
          </Grid>
        </form>

        {/* --- Result Output Section --- */}
        {uploadData?.uploadPlayersSheet && (
          <Box mt={32}>
            <Alert color="green" variant="light" mb={8}>
              {`عدد الأشخاص المضافين: ${uploadData.uploadPlayersSheet.numberOfPersonCreated} | عدد الأشخاص المرفوضين (موجودين): ${uploadData.uploadPlayersSheet.numberOfPersonRefused}`}
            </Alert>
          </Box>
        )}
      </Box>
    </Modal>
  );
};
