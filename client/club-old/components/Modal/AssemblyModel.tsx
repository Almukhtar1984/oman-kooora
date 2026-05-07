import {
    Alert,
    Box,
    Button,
    Col,
    Grid,
    Group,
    Stack,
    Text,
    Badge,
  } from "@mantine/core";
  import React from "react";
  import Modal, { Props as ModalProps } from "./Modal";
  import dayjs from "dayjs";
  
  type Props = {
    item: any; // Replace 'any' with the appropriate type if available
  } & ModalProps;
  
  export const AssemblyModel = ({ item, opened, onClose }: Props) => {
    const fullName = [
      item?.first_name,
      item?.second_name,
      item?.third_name,
      item?.tribe,
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
                تفاصيل الجمعية
              </Alert>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>الاسم الكامل:</strong> {fullName || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ الميلاد:</strong>{" "}
                {dayjs(item?.date_birth).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الرقم المدني:</strong> {item?.card_number || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>رقم الهاتف:</strong> {item?.phone || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الجنس:</strong>{" "}
                {item?.gender === "male" ? "ذكر" : "أنثى"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>نوع العضوية:</strong> {item?.type || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ العضوية:</strong>{" "}
                {dayjs(item?.membership_date).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ الاشتراك:</strong>{" "}
                {dayjs(item?.subscription_date).format("YYYY-MM-DD") ||
                  "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>الهوية الوطنية:</strong>{" "}
                {item?.nationalID || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>تاريخ الإنشاء:</strong>{" "}
                {dayjs(item?.createdAt).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>تاريخ التحديث:</strong>{" "}
                {dayjs(item?.updatedAt).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
          </Grid>
        </Box>
      </Modal>
    );
  };
  