import {Alert, Box, Button, Col, Grid, Group, Select, Divider, PasswordInput} from "@mantine/core";
import {IconCalendar, IconCheck, IconChevronDown, IconX} from "@tabler/icons";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllClubs, useAddClubManagement, useClubManagement, useUpdateClubManagement} from "../../graphql";
import useStore from "../../store/useStore";
import {DatePicker} from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";

type Props = {
    id: any;
} & ModalProps;

const init = {
    membership_date: new Date(),
    membership_date_end: new Date(),
    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: new Date(),
    },

    user: {
        email:      "",
        password:   "",
    }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toDateOrUndefined = (value?: string | Date | null) => {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

export const UpdateAdminMembersModal = ({ id, opened, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init,
        validateInputOnBlur: true,
        validate: {
            membership_date: (value) => value ? null : "تاريخ العضوية مطلوب",
            membership_date_end: (value, values) => {
                if (!value) return "تاريخ نهاية العضوية مطلوب";
                if (values.membership_date && dayjs(value).isBefore(dayjs(values.membership_date), "day")) {
                    return "تاريخ نهاية العضوية يجب أن يكون بعد تاريخ البداية";
                }
                return null;
            },
            person: {
                first_name: (value) => value?.trim() ? null : "الاسم الأول مطلوب",
                second_name: (value) => value?.trim() ? null : "الاسم الثاني مطلوب",
                third_name: (value) => value?.trim() ? null : "الاسم الثالث مطلوب",
                tribe: (value) => value?.trim() ? null : "القبيلة مطلوبة",
                phone: (value) => /^\d{8,15}$/.test(`${value || ""}`) ? null : "رقم الهاتف يجب أن يحتوي 8 إلى 15 رقم",
                card_number: (value) => value?.trim() ? null : "رقم البطاقة مطلوب",
                date_birth: (value) => value ? null : "تاريخ الميلاد مطلوب"
            },
            user: {
                email: (value) => {
                    const email = `${value || ""}`.trim();
                    if (!email) return "البريد الإلكتروني مطلوب";
                    if (!EMAIL_PATTERN.test(email)) return "صيغة البريد الإلكتروني غير صحيحة";
                    return null;
                },
                password: (value) => !value || value.length >= 8 ? null : "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            }
        }
    });
    const [idPerson, setIdPerson] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [updateMember, {loading: updateLoading}] = useUpdateClubManagement();

    const [getClubManagement, { data: dataClubManagement }] = useClubManagement();

    useEffect(() => {
        if (id && id !== "") {
            getClubManagement({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [getClubManagement, id, opened])

    useEffect(() => {
        if (opened && dataClubManagement && "clubManagement" in dataClubManagement && dataClubManagement.clubManagement !== null) {
            const data = dataClubManagement?.clubManagement

            form.setValues({
                membership_date: toDateOrUndefined(data?.membership_date),
                membership_date_end: toDateOrUndefined(data?.membership_date_end),

                person: {
                    first_name: data?.person?.first_name,
                    second_name: data?.person?.second_name,
                    third_name: data?.person?.third_name,
                    tribe: data?.person?.tribe,
                    card_number: data?.person?.card_number,
                    date_birth: toDateOrUndefined(data?.person?.date_birth) || init.person.date_birth,
                    phone: data?.person?.phone
                },
                user: {
                    email: data?.person?.user?.email,
                    password: ""
                }
            })
            setIdPerson(data?.person?.id)
        }
        // form.setValues must not depend on the form object here; that causes
        // repeated resets while the user is editing modal fields.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataClubManagement, opened])

    const onSubmit = (data: any) => {
        const {person, user, membership_date, membership_date_end, } = data
        const normalizedPassword = user.password?.trim();

        setErrorMessage("");

        updateMember({
            variables: {
                id,
                idPerson,
                content: {
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: dayjs(membership_date_end).format("YYYY-MM-DD"),
                    user: {
                        email:      user.email.trim().toLowerCase(),
                        password:   normalizedPassword,
                        role:       "2",

                        person: {
                            ...person,
                            first_name: person.first_name.trim(),
                            second_name: person.second_name.trim(),
                            third_name: person.third_name.trim(),
                            tribe: person.tribe.trim(),
                            phone: `${person.phone}`.trim(),
                            card_number: person.card_number.trim(),
                            date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                        }
                    }
                }
            },
            refetchQueries: [AllClubs]
        })
        .then(() => {
            closeModal();
        })
        .catch((error) => {
            setErrorMessage(error?.message || "تعذر تعديل معلومات المدير. تأكد من الحقول وحاول مرة أخرى.");
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setErrorMessage("");
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<IconX size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form" loading={updateLoading}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        {errorMessage && (
                            <Col span={12}>
                                <Alert color="red" variant="filled" onClose={() => setErrorMessage("")}>
                                    {errorMessage}
                                </Alert>
                            </Col>
                        )}
                        <Col span={6}>
                            <TextInput
                                label="الاسم الاول"
                                placeholder="الاسم الاول"
                                withAsterisk
                                {...form.getInputProps("person.first_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثاني"
                                placeholder="الاسم الثاني"
                                withAsterisk
                                {...form.getInputProps("person.second_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="الاسم الثالث"
                                placeholder="الاسم الثالث"
                                withAsterisk
                                {...form.getInputProps("person.third_name")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="القبيلة"
                                placeholder="القبيلة"
                                withAsterisk
                                {...form.getInputProps("person.tribe")}
                            />
                        </Col>

                        <Col span={6}>
                            <TextInput
                                label="رقم الهاتف"
                                placeholder="رقم الهاتف"
                                withAsterisk
                                {...form.getInputProps("person.phone")}
                            />
                        </Col>
                        <Col span={6}>
                            <TextInput
                                label="رقم البطاقه"
                                placeholder="رقم البطاقه"
                                withAsterisk
                                {...form.getInputProps("person.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <DatePicker
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                inputFormat="YYYY-MM-DD"
                                icon={<IconCalendar size={16} />}
                                {...form.getInputProps("person.date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <DatePicker
                                label="تاريخ العضويه"
                                placeholder="تاريخ العضويه"
                                withAsterisk
                                inputFormat="YYYY-MM-DD"
                                icon={<IconCalendar size={16} />}
                                {...form.getInputProps("membership_date")}
                            />
                        </Col>

                        <Col span={6}>
                            <DatePicker
                                label="تاريخ  نهاية العضويه"
                                placeholder="تاريخ نهاية العضويه"
                                withAsterisk
                                inputFormat="YYYY-MM-DD"
                                icon={<IconCalendar size={16} />}
                                {...form.getInputProps("membership_date_end")}
                            />
                        </Col>

                        <Col span={12} >
                            <Divider size={2} orientation={"horizontal"} label={"معلومات الحساب"} />
                        </Col>

                        <Col span={6}>
                            <TextInput
                                label="البريد الالكتروني"
                                placeholder="البريد الالكتروني"
                                withAsterisk
                                {...form.getInputProps("user.email")}
                            />
                        </Col>
                        <Col span={6}>
                            <PasswordInput
                                label="كلمة المرور"
                                placeholder="اتركها فارغة إذا لا تريد تغييرها"
                                {...form.getInputProps("user.password")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};
