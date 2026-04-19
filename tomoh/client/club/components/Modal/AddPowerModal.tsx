import {Box, Button, Col, Grid, Group, Select, Divider, Accordion, Checkbox, PasswordInput} from "@mantine/core";
import {Calendar, Check, ChevronDown, Plus, X} from "tabler-icons-react";
import React, { useState } from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllClubManagement, useAddClubManagement, useAddMember, useAddPermission} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import {Notyf} from "notyf";

type Props = {
    id: any;
} & ModalProps;

const init = {
    membership_date: "",
    membership_date_end: "",

    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: ""
    },

    user: {
        email:      "",
        password:   "",
    }
}

export const AddPowerModal = ({ id, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [createMember] = useAddClubManagement();
    const [createPermission] = useAddPermission();

    const [teams, setTeams] = useState<string[]>([]);
    const [members, setMembers] = useState<string[]>([]);
    const [technicals, setTechnicals] = useState<string[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [transferPlayers, setTransferPlayers] = useState<string[]>([]);
    const [loanPlayers, setLoanPlayers] = useState<string[]>([]);
    const [assembly, setAssembly] = useState<string[]>([]);
    const [inbox, setInbox] = useState<string[]>([]);
    const [outbox, setOutbox] = useState<string[]>([]);
    const [meeting, setMeeting] = useState<string[]>([]);
    const [blogs, setBlogs] = useState<string[]>([]);
    const [forms, setForms] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    
    const onSubmit = (data: any) => {
        const {membership_date, membership_date_end, person, user } = data
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        const idClub = userData?.person?.clubManagement?.club?.id;

        createMember({
            variables: {
                content: {
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: dayjs(membership_date_end).format("YYYY-MM-DD"),
                    role:       "2",

                    user: {
                        email:      user.email,
                        password:   user.password,
                        role:       "2",

                        person: {
                            ...person,
                            date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                        },
                    },
                    id_club: idClub
                }
            },
            onCompleted: ({createClubManagement}) => {
                const id_user = createClubManagement?.person?.user?.id
                createPermission({
                    variables: {
                        content: {
                            teams:      teams,
                            members:      members,
                            technicals:      technicals,
                            players:      players,
                            transfer_players:      transferPlayers,
                            loan_players:      loanPlayers,
                            assembly:      assembly,
                            inbox:      inbox,
                            outbox:      outbox,
                            meeting:      meeting,
                            blogs:      blogs,
                            forms:      forms,
                            permissions:      permissions,

                            id_user:   id_user
                        }
                    },
                    onCompleted: ({createPermission}) => {
                        notyf.open({message: "تمت الاضافة بنجاح", type:"error", duration: 10000});
                        closeModal();
                    },
                    refetchQueries: [AllClubManagement],
                })
            },
            onError: ({graphQLErrors}) => {
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                }

                if (graphQLErrors?.[0]?.extensions?.code == "PHONE_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهاتف موجود مسبقا", type:"error", duration: 10000});
                }
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
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
                                label="الرقم المدني"
                                placeholder="الرقم المدني"
                                withAsterisk
                                {...form.getInputProps("person.card_number")}
                            />
                        </Col>
                        <Col span={6}>
                            <DateInput
                                label="تاريخ الميلاد"
                                placeholder="تاريخ الميلاد"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("person.date_birth")}
                            />
                        </Col>

                        <Col span={6}>
                            <DateInput
                                label="تاريخ العضويه"
                                placeholder="تاريخ العضويه"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
                                {...form.getInputProps("membership_date")}
                            />
                        </Col>

                        <Col span={6}>
                            <DateInput
                                label="تاريخ  نهاية العضويه"
                                placeholder="تاريخ نهاية العضويه"
                                withAsterisk
                                valueFormat="MM/DD/YYYY"
                                icon={<Calendar size={16} />}
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

                        <Col span={12} >
                            <Divider my={10} size={2} orientation={"horizontal"} label={"الصلاحيات"} />
                        </Col>
                    </Grid>
                    
                    <Accordion mt={20} variant="contained" defaultValue="power" chevron={<Plus size="1rem" />}>
                        <Accordion.Item value="power">
                            <Accordion.Control>صلاحيات الحساب</Accordion.Control>
                            <Accordion.Panel>
                                <Grid gutter={20}>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات الافرقة"
                                            value={teams} onChange={setTeams}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="تعديل" />
                                                <Checkbox value="4" label="حذف" />
                                                <Checkbox value="5" label="حظر / فك الحظر" />
                                                <Checkbox value="6" label="اضافة مدير" />
                                                <Checkbox value="7" label="تعديل مدير" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات مجلس الأدارة"
                                            value={members} onChange={setMembers}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                {/* <Checkbox value="2" label="اضافة" /> */}
                                                <Checkbox value="3" label="تعديل" />
                                                {/* <Checkbox value="4" label="حذف" /> */}
                                                <Checkbox value="5" label="قبول / رفض" />
                                                <Checkbox value="6" label="طباعة" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات الجهاز الفني"
                                            value={technicals} onChange={setTechnicals}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                {/* <Checkbox value="2" label="اضافة" /> */}
                                                <Checkbox value="3" label="تعديل" />
                                                {/* <Checkbox value="4" label="حذف" /> */}
                                                <Checkbox value="5" label="قبول / رفض" />
                                                <Checkbox value="6" label="طباعة" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات اللاعبين"
                                            value={players} onChange={setPlayers}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                {/* <Checkbox value="2" label="اضافة" /> */}
                                                <Checkbox value="3" label="تعديل" />
                                                {/* <Checkbox value="4" label="حذف" /> */}
                                                <Checkbox value="5" label="قبول / رفض" />
                                                <Checkbox value="6" label="إنتقال / اعارة" />
                                                <Checkbox value="7" label="تاريخ الإنتقال" />
                                                <Checkbox value="8" label="طباعة البطاقة" />
                                                <Checkbox value="9" label="طباعة" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>

                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات إنتقالات اللاعبين"
                                            value={transferPlayers} onChange={setTransferPlayers}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="قبول / رفض" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات إعارات اللاعبين"
                                            value={loanPlayers} onChange={setLoanPlayers}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="قبول / رفض" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات الجمعية العمومية"
                                            value={assembly} onChange={setAssembly}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="تعديل" />
                                                <Checkbox value="4" label="حذف" />
                                                <Checkbox value="5" label="تجديد الاشتراك" />
                                                <Checkbox value="6" label="طباعة" />
                                                <Checkbox value="7" label="عرض الجمعيات العمومية للفرق" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات صندوق الوارد"
                                            value={inbox} onChange={setInbox}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="فتح" />
                                                <Checkbox value="3" label="التعليقات" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات صندوق الصادر"
                                            value={outbox} onChange={setOutbox}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="حذف" />
                                                <Checkbox value="4" label="فتح" />
                                                <Checkbox value="5" label="التعليقات" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات محضر الاجتماعات"
                                            value={meeting} onChange={setMeeting}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="تعديل" />
                                                <Checkbox value="4" label="حذف" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات الاخبار"
                                            value={blogs} onChange={setBlogs}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="تعديل" />
                                                <Checkbox value="4" label="حذف" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات الاستمارات"
                                            value={forms} onChange={setForms}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="تعديل" />
                                                <Checkbox value="4" label="حذف" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات صفحة الصلاحيات"
                                            value={permissions} onChange={setPermissions}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="تعديل" />
                                                <Checkbox value="4" label="حذف" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                </Grid>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </form>
            </Box>
        </Modal>
    );
};