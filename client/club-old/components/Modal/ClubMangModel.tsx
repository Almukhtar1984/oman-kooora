import {
    Alert,
    Box,
    Button,
    Col,
    Grid,
    Group,
    Text,
    Image,
    ActionIcon,
  } from "@mantine/core";
  import React from "react";
  import Modal, { Props as ModalProps } from "./Modal";
  import dayjs from "dayjs";
  
  type Props = {
    item: any; // Replace 'any' with the appropriate type if available
  } & ModalProps;
  
  export const ClubMangModel = ({ item, opened, onClose }: Props) => {
    const personalPictureUrl =
      item?.person?.personal_picture &&
      `${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${item.person.personal_picture}`;
  
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
                تفاصيل العضو
              </Alert>
            </Col>
  
            {personalPictureUrl && (
              <Col span={12}>
                <Image
                  src={personalPictureUrl}
                  alt="الصورة الشخصية"
                  caption="الصورة الشخصية"
                  radius="md"
                  withPlaceholder
                />
              </Col>
            )}
  
            <Col span={6}>
              <Text>
                <strong>الاسم الكامل:</strong> {fullName || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>البريد الإلكتروني:</strong>{" "}
                {item.person?.user?.email || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>رقم الهاتف:</strong> {item.person?.phone || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الرقم المدني:</strong>{" "}
                {item.person?.card_number || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ الميلاد:</strong>{" "}
                {dayjs(item.person?.date_birth).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>دور العضو:</strong>{" "}
                {item.role === "1"
                  ? "مدير"
                  : item.role === "2"
                  ? "مشرف"
                  : "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ العضوية:</strong>{" "}
                {dayjs(item.membership_date).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ نهاية العضوية:</strong>{" "}
                {dayjs(item.membership_date_end).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>ملاحظات إضافية:</strong> {item.note || "غير متوفر"}
              </Text>
            </Col>
          </Grid>
        </Box>
      </Modal>
    );
  };
  