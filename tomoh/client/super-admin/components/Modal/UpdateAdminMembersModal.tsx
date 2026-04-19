import {Box, Button, Col, Grid, Group, Select, Divider, PasswordInput} from "@mantine/core";
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

export const UpdateAdminMembersModal = ({ id, opened, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [idPerson, setIdPerson] = useState("");
    const [updateMember] = useUpdateClubManagement();

    const [getClubManagement, { data: dataClubManagement }] = useClubManagement();

    useEffect(() => {
        if (id && id !== "") {
            getClubManagement({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened])

    useEffect(() => {
        if (dataClubManagement && "clubManagement" in dataClubManagement && dataClubManagement.clubManagement !== null) {
            const data = dataClubManagement?.clubManagement

            form.setValues({
                membership_date: new Date(data?.membership_date) || null,
                membership_date_end: new Date(data?.membership_date_end) || null,

                person: {
                    first_name: data?.person?.first_name,
                    second_name: data?.person?.second_name,
                    third_name: data?.person?.third_name,
                    tribe: data?.person?.tribe,
                    card_number: data?.person?.card_number,
                    date_birth: new Date(data?.person?.date_birth) || null,
                    phone: data?.person?.phone
                },
                user: {
                    email: data?.person?.user?.email,
                    password: ""
                }
            })
            setIdPerson(data?.person?.id)
        }
    }, [dataClubManagement])

    const onSubmit = (data: any) => {
        const {person, user, membership_date, membership_date_end, } = data

        updateMember({
            variables: {
                id,
                idPerson,
                content: {
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: dayjs(membership_date_end).format("YYYY-MM-DD"),
                    user: {
                        email:      user.email,
                        password:   user.password,
                        role:       "AdminClub",

                        person: {
                            ...person,
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
        .catch(reason => {
            console.log(reason)
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
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
                        <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
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
                                inputFormat="MM/DD/YYYY"
                                icon={<IconCalendar size={16} />}
                                {...form.getInputProps("person.date_birth")}
                            />
                        </Col>
                        <Col span={6}>
                            <DatePicker
                                label="تاريخ العضويه"
                                placeholder="تاريخ العضويه"
                                withAsterisk
                                inputFormat="MM/DD/YYYY"
                                icon={<IconCalendar size={16} />}
                                {...form.getInputProps("membership_date")}
                            />
                        </Col>

                        <Col span={6}>
                            <DatePicker
                                label="تاريخ  نهاية العضويه"
                                placeholder="تاريخ نهاية العضويه"
                                withAsterisk
                                inputFormat="MM/DD/YYYY"
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
                                placeholder="كلمة المرور"
                                withAsterisk
                                {...form.getInputProps("user.password")}
                            />
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};