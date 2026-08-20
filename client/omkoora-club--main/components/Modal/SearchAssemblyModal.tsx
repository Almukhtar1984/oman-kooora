import { Box, Button, Group, Stack, Text, Badge, ScrollArea, Loader, Center } from "@mantine/core";
import { Check, X, Search } from "tabler-icons-react";
import React, { useState } from "react";
import { useForm } from "@mantine/form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import { useSearchPersons } from "../../graphql";

type Props = {
  setSelectedData?: (data: any) => void;
  setOpenAddModal?: (open: boolean) => void;
} & ModalProps;

// Determine a person's category (player / staff / board / team member) for display.
const categoryOf = (p: any) => {
  if (p?.player) return { label: "لاعب", color: "blue", team: p.player?.team?.name };
  if (p?.technicalApparatus) return { label: "جهاز فني", color: "grape", team: p.technicalApparatus?.team?.name };
  if (p?.member) return { label: "عضو فريق", color: "teal", team: p.member?.team?.name };
  if (p?.clubManagement) return { label: "مجلس الإدارة", color: "violet", team: null };
  return { label: "غير مصنّف", color: "gray", team: null };
};

export const SearchAssemblyModal = (props: Props) => {
  const form = useForm({ initialValues: { query: "" } });
  const [searchPersons, { data, loading }] = useSearchPersons();
  const [selected, setSelected] = useState<any | null>(null);

  const results: any[] = data?.searchPersons || [];

  const onFormSubmit = ({ query }: any) => {
    setSelected(null);
    if (query && query.trim() !== "") {
      searchPersons({ variables: { query: query.trim() } });
    }
  };

  const closeModal = () => {
    props.onClose();
    form.reset();
    setSelected(null);
  };

  const openNext = () => {
    if (selected) {
      props.setSelectedData?.({ person: selected });
      props.setOpenAddModal?.(true);
      closeModal();
    }
  };

  return (
    <Modal
      {...props}
      onClose={closeModal}
      footer={
        <Box py={16} px={20} bg="slate.0">
          <Group position="right" spacing="xs">
            <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
            <Button loading={loading} rightIcon={<Search size={15} />} type="submit" form="search_person_form">بحث</Button>
            <Button disabled={!selected} rightIcon={<Check size={15} />} onClick={openNext}>التالي</Button>
          </Group>
        </Box>
      }
    >
      <Box p={20}>
        <form onSubmit={form.onSubmit(onFormSubmit)} id="search_person_form">
          <TextInput
            label="الاسم أو الرقم المدني"
            placeholder="اكتب اسم العضو أو رقمه المدني ثم اضغط بحث"
            withAsterisk
            {...form.getInputProps("query")}
          />
        </form>

        <Text size="xs" color="dimmed" mt={8}>
          يبحث في اللاعبين والجهاز الفني ومجلس الإدارة وأعضاء الفرق. اختر الشخص ثم اضغط «التالي» لإضافته للجمعية العمومية.
        </Text>

        <Box mt={16}>
          {loading ? (
            <Center py="lg"><Loader size="sm" color="cyan" /></Center>
          ) : data && results.length === 0 ? (
            <Text size="sm" color="gray.5" ta="center" py="lg">لا توجد نتائج مطابقة</Text>
          ) : results.length > 0 ? (
            <>
              <Text size="xs" color="gray.6" mb={6}>{results.length} نتيجة — اختر الشخص:</Text>
              <ScrollArea.Autosize mah={280}>
                <Stack spacing={8}>
                  {results.map((p) => {
                    const cat = categoryOf(p);
                    const isSel = selected?.id === p.id;
                    const fullName = [p.first_name, p.second_name, p.third_name, p.tribe].filter(Boolean).join(" ");
                    return (
                      <Box
                        key={p.id}
                        onClick={() => setSelected(p)}
                        sx={({ colors, radius }) => ({
                          borderRadius: radius.md,
                          cursor: "pointer",
                          padding: "10px 12px",
                          border: "1px solid " + (isSel ? colors.cyan[5] : colors.gray[2]),
                          background: isSel ? colors.cyan[0] : colors.white,
                          "&:hover": { borderColor: colors.cyan[4] },
                        })}
                      >
                        <Group position="apart" noWrap>
                          <Box>
                            <Text size="sm" weight={600} color="gray.8" lineClamp={1}>{fullName}</Text>
                            <Group spacing={8} mt={2}>
                              {p.card_number ? <Text size="xs" color="gray.5">الرقم المدني: {p.card_number}</Text> : null}
                              {cat.team ? <Text size="xs" color="gray.5">· {cat.team}</Text> : null}
                            </Group>
                          </Box>
                          <Group spacing={6} noWrap>
                            <Badge color={cat.color} variant="light" radius="sm">{cat.label}</Badge>
                            {isSel ? <Check size={16} color="#0b7285" /> : null}
                          </Group>
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            </>
          ) : null}
        </Box>
      </Box>
    </Modal>
  );
};
