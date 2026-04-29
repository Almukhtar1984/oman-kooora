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
    Tooltip,
    Badge,
  } from "@mantine/core";
  import React from "react";
  import Modal, { Props as ModalProps } from "./Modal";
  import dayjs from "dayjs";
  import { FileCertificate } from "tabler-icons-react";
  import { GiPlayerPrevious, GiPlayerNext } from "react-icons/gi";
  
  type Props = {
    item: any; // Replace 'any' with the appropriate type if available
  } & ModalProps;
  
  export const TransfertemModel = ({ item, opened, onClose }: Props) => {
    console.log("item,",item)
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
                        height={220} // Set the height to 200px
                        fit="contain" // Ensures the image fits proportionally inside the height
                        />
              </Col>
            )}
  
            <Col span={12}>
              <Text>
                <strong>الخيارات:</strong>{" "}
                {item.status === "accepted" ? "مقبول" : "قيد الانتظار"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>حالة الانتقال:</strong>{" "}
                {item?.lastTransfer?.status === "accepted" ? (
                  <Badge color="teal">مقبول</Badge>
                ) : item?.lastTransfer?.status === "rejected" ? (
                  <Badge color="red">مرفوض</Badge>
                ) : item?.lastTransfer?.status === "waiting" &&
                  item?.lastTransfer?.club_to?.id === item?.team?.id ? (
                  <Badge color="yellow">بانتظار تاكيدك</Badge>
                ) : (
                  <Badge color="yellow">بانتظار الرد</Badge>
                )}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>إسم الفريق القديم:</strong>{" "}
                {item?.lastTransfer?.team_from?.name || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>إسم الفريق الجديد:</strong>{" "}
                {item?.lastTransfer?.team_to?.name || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Group>
                {item?.lastTransfer?.team_from?.club?.id !== item?.team?.id ? (
                  <Tooltip label={"لاعب ذاهب"}>
                    <GiPlayerPrevious size={22} color={"red"} />
                  </Tooltip>
                ) : item?.lastTransfer?.team_to?.club?.id !== item?.team?.id ? (
                  <Tooltip label={"لاعب قادم"}>
                    <GiPlayerNext size={22} color={"green"} />
                  </Tooltip>
                ) : null}
              </Group>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>الاسم الكامل:</strong> {fullName || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>رقم الهاتف:</strong> {item?.person?.phone || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الرقم المدني:</strong>{" "}
                {item?.person?.card_number || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>الفئة العمرية:</strong>{" "}
                {item?.class === "firstDegree" ? (
                  <Badge color="lime">الدرجة الاولى</Badge>
                ) : item?.class === "young" ? (
                  <Badge color="grape">الشباب</Badge>
                ) : item?.class === "rookies" ? (
                  <Badge color="indigo">الناشئين</Badge>
                ) : (
                  "غير متوفر"
                )}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>تاريخ الميلاد:</strong>{" "}
                {dayjs(item?.person?.date_birth).format("YYYY-MM-DD") ||
                  "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>النشاط:</strong> {item?.activity || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>مركز لاعب:</strong> {item?.player_center || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={6}>
              <Text>
                <strong>العمل:</strong> {item?.job || "غير متوفر"}
              </Text>
            </Col>
  
            <Col span={12}>
              <Text>
                <strong>الملاحظة / سبب الرفض:</strong> {item?.note || "غير متوفر"}
              </Text>
            </Col>
          </Grid>
        </Box>
      </Modal>
    );
  };
  