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
  } from "@mantine/core";
  import React from "react";
  import Modal, { Props as ModalProps } from "./Modal";
  import dayjs from "dayjs";
  import { FileCertificate } from "tabler-icons-react";
  
  type Props = {
    item: any; // Replace 'any' with the appropriate type if available
  } & ModalProps;
  
  export const TechnicalItemModel = ({ item, opened, onClose }: Props) => {
    console.log("item",item)
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
                تفاصيل العنصر
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
                <strong>الخيارات:</strong>{" "}
                {item.status === "accepted" ? "مقبول" : "قيد الانتظار"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الحالة:</strong> {item.status || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>إسم الفريق:</strong> {item.team?.name || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الاسم الكامل:</strong> {fullName || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>رقم الهاتف:</strong> {item.person?.phone || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الرقم المدني:</strong> {item.person?.card_number || "غير متوفر"}
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
                <strong>الوظيفه:</strong> {item.occupation || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>التصنيف:</strong> {item.classification || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ العقد:</strong>{" "}
                {dayjs(item.membership_date).format("YYYY-MM-DD") || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تنزيل الملف:</strong>{" "}
                {item.testimony_experience ? (
                  <ActionIcon
                    color="green"
                    variant="light"
                    component="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${item.testimony_experience}`}
                  >
                    <FileCertificate size={18} />
                  </ActionIcon>
                ) : (
                  "غير متوفر"
                )}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>الملاحظة / سبب الرفض:</strong> {item.note || "غير متوفر"}
              </Text>
            </Col>
          </Grid>
        </Box>
      </Modal>
    );
  };
  