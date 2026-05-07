import {
    Alert,
    Box,
    Button,
    Col,
    Grid,
    Group,
    Stack,
    Text,
    Image,
    ActionIcon,
    Badge,
  } from "@mantine/core";
  import React from "react";
  import Modal, { Props as ModalProps } from "./Modal";
  import { FileCertificate } from "tabler-icons-react";
  import dayjs from "dayjs";
  
  type Props = {
    item: any; // Replace 'any' with the appropriate type if available
  } & ModalProps;
  
  export const PlayerModel = ({ item, opened, onClose }: Props) => {
    const personalPictureUrl =
      item?.person?.personal_picture &&
      `${process.env.NEXT_PUBLIC_API_URL}/images/${item.person.personal_picture}`;
    const nationalIDFrontUrl =
      item?.nationalID &&
      `${process.env.NEXT_PUBLIC_API_URL}/images/${item.nationalID}`;
    const nationalIDBackUrl =
      item?.nationalIDBack &&
      `${process.env.NEXT_PUBLIC_API_URL}/images/${item.nationalIDBack}`;
    const parentApprovalUrl =
      item?.parentApproval &&
      `${process.env.NEXT_PUBLIC_API_URL}/images/${item.parentApproval}`;
  
    const fullName = [
      item?.person?.first_name,
      item?.person?.second_name,
      item?.person?.third_name,
      item?.person?.tribe,
    ]
      .filter((namePart) => namePart)
      .join(" ");
  
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        footer={
          <Box py={16} px={20} bg="slate.0">
            <Group position={"right"} spacing={"xs"}>
              <Button type="button" onClick={onClose}>
                تأكيد
              </Button>
            </Group>
          </Box>
        }
      >
        <Box sx={{ padding: 20 }}>
          <Grid gutter={20}>
            <Col span={12}>
              <Alert variant="light" color="blue">
                تفاصيل اللاعب
              </Alert>
            </Col>
  
            {/* Personal Picture */}
            {personalPictureUrl && (
              <Col span={12}>
                <Image
                  src={personalPictureUrl}
                  alt="الصورة الشخصية"
                  caption="الصورة الشخصية"
                  radius="md"
                  withPlaceholder
                  height={220}
                  fit="contain"
                />
              </Col>
            )}
  
            {/* Full Name */}
            <Col span={12}>
              <Text>
                <strong>الاسم الكامل:</strong> {fullName || "غير متوفر"}
              </Text>
            </Col>
  
            {/* Phone Number */}
            <Col span={6}>
              <Text>
                <strong>رقم الهاتف:</strong> {item?.person?.phone || "غير متوفر"}
              </Text>
            </Col>
  
            {/* Card Number */}
            <Col span={6}>
              <Text>
                <strong>الرقم المدني:</strong>{" "}
                {item?.person?.card_number || "غير متوفر"}
              </Text>
            </Col>
  
            {/* Date of Birth */}
            <Col span={6}>
              <Text>
                <strong>تاريخ الميلاد:</strong>{" "}
                {dayjs(item?.person?.date_birth).format("YYYY-MM-DD") ||
                  "غير متوفر"}
              </Text>
            </Col>
  
            {/* Team Name */}
            <Col span={6}>
              <Text>
                <strong>إسم الفريق:</strong> {item?.team?.name || "غير متوفر"}
              </Text>
            </Col>
  
            {/* Activity */}
            <Col span={6}>
              <Text>
                <strong>النشاط:</strong> {item?.activity || "غير متوفر"}
              </Text>
            </Col>
  
            {/* Player Center */}
            <Col span={6}>
              <Text>
                <strong>مركز لاعب:</strong> {item?.player_center || "غير متوفر"}
              </Text>
            </Col>
  
            {/* Class */}
            <Col span={6}>
              <Text>
                <strong>الفئة العمرية:</strong>{" "}
                {item?.class === "firstDegree" ? (
                  <Badge color="lime">الفريق الاول</Badge>
                ) : item?.class === "young" ? (
                  <Badge color="grape">تحت 18 سنة</Badge>
                ) : item?.class === "rookies" ? (
                  <Badge color="indigo">تحت 16 سنة</Badge>
                ) : (
                  "غير متوفر"
                )}
              </Text>
            </Col>
  
            {/* National ID Front and Back */}
            {(nationalIDFrontUrl || nationalIDBackUrl) && (
              <Col span={12}>
                <Stack spacing="md" align="center">
                  {nationalIDFrontUrl && (
                    <Stack spacing="xs" align="center">
                      <Text>
                        <strong>صورة البطاقة المدنية (الواجهة الامامية):</strong>
                      </Text>
                      <Image
                        src={nationalIDFrontUrl}
                        alt="صورة البطاقة المدنية (الواجهة الامامية)"
                        radius="md"
                        withPlaceholder
                        height={200}
                        fit="contain"
                      />
                      <ActionIcon
                        color="green"
                        variant="light"
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={nationalIDFrontUrl}
                      >
                        <FileCertificate size={18} />
                      </ActionIcon>
                    </Stack>
                  )}
  
                  {nationalIDBackUrl && (
                    <Stack spacing="xs" align="center" sx={{marginTop:"20px"}}>
                      <Text>
                        <strong>صورة البطاقة المدنية (الواجهة الخلفية):</strong>
                      </Text>
                      <Image
                        src={nationalIDBackUrl}
                        alt="صورة البطاقة المدنية (الواجهة الخلفية)"
                        radius="md"
                        withPlaceholder
                        height={200}
                        fit="contain"
                      />
                      <ActionIcon
                        color="green"
                        variant="light"
                        component="a"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={nationalIDBackUrl}
                      >
                        <FileCertificate size={18} />
                      </ActionIcon>
                    </Stack>
                  )}
                </Stack>
              </Col>
            )}
  
            {/* Parent Approval */}
            {parentApprovalUrl && (
              <Col span={12}>
                <Text>
                  <strong>إستمارة موافقة ولي الأمر:</strong>{" "}
                </Text>
                <ActionIcon
                  color="green"
                  variant="light"
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={parentApprovalUrl}
                >
                  <FileCertificate size={18} />
                </ActionIcon>
              </Col>
            )}
  
            {/* Notes */}
            <Col span={12}>
              <Text>
                <strong>الملاحظة / سبب الرفض:</strong>{" "}
                {item?.note || "غير متوفر"}
              </Text>
            </Col>
          </Grid>
        </Box>
      </Modal>
    );
  };
  