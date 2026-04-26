import { useTheme } from "@emotion/react";
import {Box, Button, Col, Container, Grid, Group, MantineTheme, Select, Text, Textarea, TextInput} from "@mantine/core";
import {Calendar, ChevronDown, Plus, Search,} from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect } from "react";
import { useState } from "react";
import useStore from "../store/useStore";
import {useForm} from "@mantine/form";
import {AllRequests, useAddRequest} from "../graphql";
import useSettingsUser from "../graphql/hooks/users/useSettingsUser";
import {DateInput} from "@mantine/dates";
import dayjs from "dayjs";

export default function Profile () {
    const userData = useStore((state: any) => state.userData);
    const theme = useTheme() as MantineTheme;
    const form = useForm();
    const [age, setAge] = useState<Date | null>(new Date());
    const [settingsUser] = useSettingsUser();

    useEffect(() => {
        if (userData?.person) {
            form.setValues({
                first_name:     userData?.person?.first_name,
                second_name:    userData?.person?.second_name,
                third_name:     userData?.person?.third_name,
                phone:          userData?.person?.phone,
                card_number:    userData?.person?.card_number,
                tribe:          userData?.person?.tribe,
                email:          userData?.email,
            })
            // @ts-ignore
            setAge(dayjs(userData?.person?.date_birth, "YYYY-MM-DD"))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData]);

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: false });
    }, []);

    const onSubmit = ({email, password, first_name, second_name, third_name, tribe, phone, card_number  }: any) => {
        const idPlayer = userData?.id;

        settingsUser({
            variables: {
                id: idPlayer,
                content: {
                    email,
                    password,
                    person: {
                        first_name,
                        second_name,
                        third_name,
                        date_birth: dayjs(age).format("YYYY-MM-DD"),
                        phone,
                        card_number,
                        tribe
                    }
                }
            }
        })
    };

    return (
        <Box>
            <Head><title>طموح</title></Head>
            <Container size={"sm"}>
                <Box sx={({ colors }) => ({padding: 20})}>
                    <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                        <Grid gutter={20}>
                            <Col span={12}>
                                <Text fw={500} size={"lg"}>المعلومات الشخصية</Text>
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="الاسم الاول"
                                    placeholder="الاسم الاول"
                                    withAsterisk
                                    {...form.getInputProps("first_name")}
                                />
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="الاسم الثاني"
                                    placeholder="الاسم الثاني"
                                    withAsterisk
                                    {...form.getInputProps("second_name")}
                                />
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="الاسم الثالث"
                                    placeholder="الاسم الثالث"
                                    withAsterisk
                                    {...form.getInputProps("third_name")}
                                />
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="القبيلة"
                                    placeholder="القبيلة"
                                    withAsterisk
                                    {...form.getInputProps("tribe")}
                                />
                            </Col>

                            <Col span={6}>
                                <TextInput
                                    label="رقم الهاتف"
                                    placeholder="رقم الهاتف"
                                    withAsterisk
                                    {...form.getInputProps("phone")}
                                />
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="رقم البطاقه"
                                    placeholder="رقم البطاقه"
                                    withAsterisk
                                    {...form.getInputProps("card_number")}
                                />
                            </Col>
                            <Col span={6}>
                                <DateInput
                                    label="تاريخ الميلاد"
                                    placeholder="تاريخ الميلاد"
                                    withAsterisk
                                    valueFormat="MM/DD/YYYY"
                                    value={age}
                                    onChange={(value) => setAge(value)}
                                    icon={<Calendar size={16} />}
                                />
                            </Col>

                            <Col span={12}>
                                <Text fw={500} size={"lg"}>معلومات الحساب</Text>
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="البريد الالكتروني"
                                    placeholder="البريد الالكتروني"
                                    withAsterisk
                                    {...form.getInputProps("email")}
                                />
                            </Col>
                            <Col span={6}>
                                <TextInput
                                    label="كلمة المرور"
                                    placeholder="كلمة المرور"
                                    withAsterisk
                                    {...form.getInputProps("password")}
                                />
                            </Col>

                            <Col span={12}>
                                <Group position={"right"} spacing={"xs"} mt={20}>
                                    <Button type="submit" form="submit_form">تعديل</Button>
                                </Group>
                            </Col>
                        </Grid>
                    </form>
                </Box>
            </Container>
        </Box>
    );
}
