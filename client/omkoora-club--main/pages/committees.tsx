import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Col, Container, Grid, Group, Text, Title, Badge, Paper, Table,
  ActionIcon, Modal, TextInput, Select, Loader, Center, Stack, ThemeIcon, Menu,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import Head from "next/head";
import { Plus, Printer, Users, UserPlus, Trash, Edit, Scale, X, Check, Filter } from "tabler-icons-react";
import { Notyf } from "notyf";
import useStore from "../store/useStore";
import {
  useAllCommittees, useCreateCommittee, useUpdateCommittee, useDeleteCommittee,
  useCreateCommitteeMember, useUpdateCommitteeMember, useDeleteCommitteeMember,
} from "../graphql";

const notyf = () => new Notyf({ position: { x: "right", y: "bottom" }, duration: 3000 });

const Committees = () => {
  const userData = useStore((s: any) => s.userData);
  const idClub = userData?.person?.clubManagement?.club?.id;

  const [getAll, { data, loading }] = useAllCommittees();
  const committees: any[] = data?.allCommittees || [];

  const [filter, setFilter] = useState<string>("all");

  // committee add/edit
  const [committeeModal, setCommitteeModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  // member add/edit
  const [memberModal, setMemberModal] = useState<{ open: boolean; edit?: any; committeeId?: string }>({ open: false });

  const [createCommittee] = useCreateCommittee();
  const [updateCommittee] = useUpdateCommittee();
  const [deleteCommittee] = useDeleteCommittee();
  const [createMember] = useCreateCommitteeMember();
  const [updateMember] = useUpdateCommitteeMember();
  const [deleteMember] = useDeleteCommitteeMember();

  const refetch = () => { if (idClub) getAll({ variables: { idClub } }); };
  useEffect(() => { if (idClub) getAll({ variables: { idClub } }); }, [idClub]);

  const committeeForm = useForm({ initialValues: { name: "" }, validate: { name: (v) => (v?.trim() ? null : "اسم اللجنة مطلوب") } });
  const memberForm = useForm({
    initialValues: { name: "", phone: "", idCommittee: "" },
    validate: {
      name: (v) => (v?.trim() ? null : "اسم العضو مطلوب"),
      idCommittee: (v) => (v ? null : "اختر اللجنة"),
    },
  });

  // open committee modal (add or edit)
  const openCommittee = (edit?: any) => {
    committeeForm.setValues({ name: edit?.name || "" });
    setCommitteeModal({ open: true, edit });
  };
  const submitCommittee = committeeForm.onSubmit(async ({ name }) => {
    try {
      if (committeeModal.edit) {
        await updateCommittee({ variables: { id: committeeModal.edit.id, name } });
        notyf().success("تم تعديل اللجنة");
      } else {
        await createCommittee({ variables: { idClub, name } });
        notyf().success("تمت إضافة اللجنة");
      }
      setCommitteeModal({ open: false });
      committeeForm.reset();
      refetch();
    } catch { notyf().error("حدث خطأ"); }
  });

  const openMember = (committeeId?: string, edit?: any) => {
    memberForm.setValues({ name: edit?.name || "", phone: edit?.phone || "", idCommittee: edit?.idCommittee || committeeId || "" });
    setMemberModal({ open: true, edit, committeeId });
  };
  const submitMember = memberForm.onSubmit(async ({ name, phone, idCommittee }) => {
    try {
      if (memberModal.edit) {
        await updateMember({ variables: { id: memberModal.edit.id, name, phone, idCommittee } });
        notyf().success("تم تعديل العضو");
      } else {
        await createMember({ variables: { idCommittee, name, phone } });
        notyf().success("تمت إضافة العضو");
      }
      setMemberModal({ open: false });
      memberForm.reset();
      refetch();
    } catch { notyf().error("حدث خطأ"); }
  });

  const onDeleteCommittee = async (c: any) => {
    if (!window.confirm(`حذف لجنة «${c.name}» وكل أعضائها؟`)) return;
    try { await deleteCommittee({ variables: { id: c.id } }); notyf().success("تم الحذف"); if (filter === c.id) setFilter("all"); refetch(); }
    catch { notyf().error("تعذّر الحذف"); }
  };
  const onDeleteMember = async (m: any) => {
    if (!window.confirm(`حذف العضو «${m.name}»؟`)) return;
    try { await deleteMember({ variables: { id: m.id } }); notyf().success("تم الحذف"); refetch(); }
    catch { notyf().error("تعذّر الحذف"); }
  };

  const shown = useMemo(() => (filter === "all" ? committees : committees.filter((c) => c.id === filter)), [committees, filter]);
  const totalMembers = committees.reduce((s, c) => s + (c.membersCount || 0), 0);

  const printCommittees = () => {
    const list = filter === "all" ? committees : committees.filter((c) => c.id === filter);
    const rows = list.map((c) => `
      <h3 style="margin:18px 0 6px;border-bottom:2px solid #0b7285;padding-bottom:4px;color:#0b7285">${c.name} <span style="font-size:13px;color:#666">(${c.membersCount || 0} عضو)</span></h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#f1f3f5">
          <th style="border:1px solid #ccc;padding:6px;width:40px">م</th>
          <th style="border:1px solid #ccc;padding:6px">الاسم</th>
          <th style="border:1px solid #ccc;padding:6px;width:160px">رقم الهاتف</th>
        </tr></thead>
        <tbody>${(c.members || []).map((m: any, i: number) => `<tr>
          <td style="border:1px solid #ccc;padding:6px;text-align:center">${i + 1}</td>
          <td style="border:1px solid #ccc;padding:6px">${m.name || ""}</td>
          <td style="border:1px solid #ccc;padding:6px">${m.phone || ""}</td>
        </tr>`).join("") || `<tr><td colspan="3" style="border:1px solid #ccc;padding:8px;text-align:center;color:#999">لا يوجد أعضاء</td></tr>`}</tbody>
      </table>`).join("");
    const clubName = userData?.person?.clubManagement?.club?.name || "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>اللجان</title></head>
      <body style="font-family:Tahoma,Arial,sans-serif;padding:24px">
        <h2 style="text-align:center;margin:0 0 4px">اللجان — ${clubName}</h2>
        <p style="text-align:center;color:#666;margin:0 0 12px">عدد اللجان: ${list.length} · إجمالي الأعضاء: ${list.reduce((s, c) => s + (c.membersCount || 0), 0)}</p>
        ${rows || "<p style='text-align:center'>لا توجد لجان</p>"}
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <>
      <Head><title>اللجان</title></Head>
      <Box bg="gray.0" sx={{ minHeight: "100%" }}>
        <Container size="xl" py="xl">
          <Group position="apart" mb="lg" align="flex-end">
            <Box>
              <Group spacing={10}>
                <ThemeIcon size={40} radius="md" variant="light" color="cyan"><Scale size={24} /></ThemeIcon>
                <Title order={2} color="gray.8">اللجان</Title>
              </Group>
              <Text color="gray.6" size="sm" mt={6}>لجان النادي وأعضاؤها — {committees.length} لجنة · {totalMembers} عضو</Text>
            </Box>
            <Group spacing="xs">
              <Button variant="outline" color="gray" leftIcon={<Printer size={16} />} onClick={printCommittees}>طباعة</Button>
              <Button variant="light" color="cyan" leftIcon={<UserPlus size={16} />} onClick={() => openMember()} disabled={!committees.length}>إضافة عضو</Button>
              <Button color="cyan" leftIcon={<Plus size={16} />} onClick={() => openCommittee()}>إضافة لجنة</Button>
            </Group>
          </Group>

          {/* Filter chips */}
          {committees.length > 0 && (
            <Group spacing="xs" mb="lg">
              <Group spacing={6}><Filter size={16} /><Text size="sm" color="gray.6" weight={600}>تصفية:</Text></Group>
              <Button size="xs" radius="xl" variant={filter === "all" ? "filled" : "outline"} color="cyan" onClick={() => setFilter("all")}>الكل ({totalMembers})</Button>
              {committees.map((c) => (
                <Button key={c.id} size="xs" radius="xl" variant={filter === c.id ? "filled" : "outline"} color="cyan" onClick={() => setFilter(c.id)}>
                  {c.name} ({c.membersCount || 0})
                </Button>
              ))}
            </Group>
          )}

          {loading && !committees.length ? (
            <Center mih={300}><Loader color="cyan" /></Center>
          ) : !committees.length ? (
            <Paper p="xl" radius="md" withBorder>
              <Stack align="center" spacing="sm" py="xl">
                <ThemeIcon size={56} radius="xl" variant="light" color="gray"><Scale size={30} /></ThemeIcon>
                <Text color="gray.6">لا توجد لجان بعد</Text>
                <Button leftIcon={<Plus size={16} />} onClick={() => openCommittee()}>أضف أول لجنة</Button>
              </Stack>
            </Paper>
          ) : (
            <Grid gutter="lg">
              {shown.map((c) => (
                <Col key={c.id} span={12} md={6}>
                  <Paper radius="md" withBorder p="lg" sx={{ height: "100%" }}>
                    <Group position="apart" mb="sm" noWrap>
                      <Group spacing={8} noWrap>
                        <ThemeIcon size={34} radius="md" variant="light" color="cyan"><Users size={18} /></ThemeIcon>
                        <Box>
                          <Text weight={700} color="gray.8" lineClamp={1}>{c.name}</Text>
                          <Text size="xs" color="gray.5">{c.membersCount || 0} عضو</Text>
                        </Box>
                      </Group>
                      <Group spacing={4} noWrap>
                        <ActionIcon color="cyan" variant="light" title="إضافة عضو" onClick={() => openMember(c.id)}><UserPlus size={16} /></ActionIcon>
                        <ActionIcon color="blue" variant="light" title="تعديل اللجنة" onClick={() => openCommittee(c)}><Edit size={16} /></ActionIcon>
                        <ActionIcon color="red" variant="light" title="حذف اللجنة" onClick={() => onDeleteCommittee(c)}><Trash size={16} /></ActionIcon>
                      </Group>
                    </Group>
                    {c.members && c.members.length > 0 ? (
                      <Table highlightOnHover verticalSpacing="xs" fontSize="sm">
                        <thead>
                          <tr>
                            <th style={{ width: 34, textAlign: "center" }}>م</th>
                            <th style={{ textAlign: "right" }}>الاسم</th>
                            <th style={{ textAlign: "right", width: 130 }}>رقم الهاتف</th>
                            <th style={{ width: 70 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.members.map((m: any, i: number) => (
                            <tr key={m.id}>
                              <td style={{ textAlign: "center", color: "#adb5bd" }}>{i + 1}</td>
                              <td>{m.name}</td>
                              <td dir="ltr" style={{ textAlign: "right" }}>{m.phone || "—"}</td>
                              <td>
                                <Group spacing={2} noWrap position="left">
                                  <ActionIcon size="sm" color="blue" variant="subtle" onClick={() => openMember(c.id, { ...m, idCommittee: c.id })}><Edit size={14} /></ActionIcon>
                                  <ActionIcon size="sm" color="red" variant="subtle" onClick={() => onDeleteMember(m)}><Trash size={14} /></ActionIcon>
                                </Group>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Text size="sm" color="gray.5" ta="center" py="md">لا يوجد أعضاء — أضف عضوًا للجنة</Text>
                    )}
                  </Paper>
                </Col>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Committee add/edit modal */}
      <Modal opened={committeeModal.open} onClose={() => setCommitteeModal({ open: false })} title={committeeModal.edit ? "تعديل اللجنة" : "إضافة لجنة"} centered>
        <form onSubmit={submitCommittee}>
          <TextInput label="اسم اللجنة" placeholder="مثال: لجنة التحكيم" data-autofocus {...committeeForm.getInputProps("name")} />
          <Group position="right" mt="lg">
            <Button variant="outline" color="gray" rightIcon={<X size={15} />} onClick={() => setCommitteeModal({ open: false })}>إلغاء</Button>
            <Button type="submit" rightIcon={<Check size={15} />}>حفظ</Button>
          </Group>
        </form>
      </Modal>

      {/* Member add/edit modal */}
      <Modal opened={memberModal.open} onClose={() => setMemberModal({ open: false })} title={memberModal.edit ? "تعديل عضو" : "إضافة عضو للجنة"} centered>
        <form onSubmit={submitMember}>
          <Stack spacing="sm">
            <Select
              label="اللجنة"
              placeholder="اختر اللجنة"
              data={committees.map((c) => ({ value: c.id, label: c.name }))}
              searchable
              {...memberForm.getInputProps("idCommittee")}
            />
            <TextInput label="الاسم" placeholder="اسم العضو" {...memberForm.getInputProps("name")} />
            <TextInput label="رقم الهاتف" placeholder="اختياري" {...memberForm.getInputProps("phone")} />
          </Stack>
          <Group position="right" mt="lg">
            <Button variant="outline" color="gray" rightIcon={<X size={15} />} onClick={() => setMemberModal({ open: false })}>إلغاء</Button>
            <Button type="submit" rightIcon={<Check size={15} />}>حفظ</Button>
          </Group>
        </form>
      </Modal>
    </>
  );
};

export default Committees;
