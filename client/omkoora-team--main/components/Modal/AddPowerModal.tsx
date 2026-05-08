import {Box, Button, Col, Grid, Group, Select, Divider, Accordion, Checkbox, PasswordInput} from "@mantine/core";
import {Calendar, Check, ChevronDown, Plus, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {
    useAddAdminMember,
    useAddMember,
    useAddPermission, useAllMembers, useCreateUser
} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import {Notyf} from "notyf";

type Props = {
    id: any;
    existingMember: boolean
    setExistingMember: (open: boolean) => void;
} & ModalProps;

const init = {
    occupation: "",
    classification: "",
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

export const AddPowerModal = ({ id, existingMember, setExistingMember, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const [createUser] = useCreateUser();
    const [createPermission] = useAddPermission();
    const [getAllMembers, { loading, error, data: dataAllMembers }] = useAllMembers();
    const [allMembers, setAllMembers] = useState<{ value: string, label: string }[]>([]);

    const [members, setMembers] = useState<string[]>([]);
    const [technicals, setTechnicals] = useState<string[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [assembly, setAssembly] = useState<string[]>([]);
    const [inbox, setInbox] = useState<string[]>([]);
    const [outbox, setOutbox] = useState<string[]>([]);
    const [expenses, setExpenses] = useState<string[]>([]);
    const [complaints, setComplaints] = useState<string[]>([]);

    const [meeting, setMeeting] = useState<string[]>([]);
    const [forms, setForms] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [leagues, setLeagues] = useState<string[]>([]);

    useEffect(() => {
        if (userData?.person?.member?.team?.id) {
            const idTeam = userData?.person?.member?.team?.id
            getAllMembers({
                variables: {idTeam},
                fetchPolicy: "cache-first"
            })
        }
    }, [userData])

    useEffect(() => {
        if (dataAllMembers && "allMembers" in dataAllMembers) {
            let allData: { value: string, label: string }[] = []
            dataAllMembers.allMembers?.map(item => {
                allData.push({
                    value: item?.person?.id,
                    label: `${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe} ( ${item?.classification} )`
                })
            })
            setAllMembers([...allData])
        }
    }, [dataAllMembers])

    const onSubmit = (data: any) => {
        const {id_person, user } = data
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;

        createUser({
            variables: {
                content: {
                    email:      user.email,
                    password:   user.password,
                    role:       "3",
                    id_person
                }
            },
            onCompleted: ({createUser}) => {
                const id_user = createUser?.id
                createPermission({
                    variables: {
                        content: {
                            teams:      [],
                            members:      members,
                            technicals:      technicals,
                            players:      players,
                            transfer_players:      [],
                            loan_players:      [],
                            assembly:      assembly,
                            inbox:      inbox,
                            outbox:      outbox,
                            meeting:      meeting,
                            blogs:      [],
                            forms:      forms,
                            permissions:      permissions,

                            complaints: complaints,
                            expenses: expenses,
                            leagues: leagues,

                            id_user:   id_user
                        }
                    },
                    onCompleted: ({createPermission}) => {
                        notyf?.open({message: "تمت الاضافة بنجاح", type:"success", duration: 10000});
                        closeModal();
                    },
                    // refetchQueries: [AllClubManagement],
                })
            },
            onError: ({graphQLErrors}) => {
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf?.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                }

                if (graphQLErrors?.[0]?.extensions?.code == "PHONE_NUMBER_ALREADY_EXISTS") {
                    notyf?.open({message: "رقم الهاتف موجود مسبقا", type:"error", duration: 10000});
                }
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setExistingMember(false)
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
                    {!existingMember
                        ? <Grid gutter={20}>
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
                                <TextInput
                                    label="الوظيفه"
                                    placeholder="الوظيفه"
                                    withAsterisk
                                    {...form.getInputProps("occupation")}
                                />
                            </Col>

                            <Col span={6}>
                                <Select
                                    label="التصنيف"
                                    placeholder="التصنيف"
                                    withAsterisk
                                    rightSection={<ChevronDown size={14} />}
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}
                                    data={['رئيس', 'نائب رئيس', 'عضو', 'امين السر']}
                                    {...form.getInputProps("classification")}
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
                        : <Grid gutter={20}>
                            <Col span={12}>
                                <Select
                                    label="الاسم الكامل للعضو"
                                    placeholder="الاسم الكامل للعضو مع التصنيف"
                                    withAsterisk
                                    searchable
                                    {...form.getInputProps("id_person")}
                                    data={allMembers}
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
                    }
                    
                    <Accordion mt={20} variant="contained" defaultValue="power" chevron={<Plus size="1rem" />}>
                        <Accordion.Item value="power">
                            <Accordion.Control>صلاحيات الحساب</Accordion.Control>
                            <Accordion.Panel>
                                <Grid gutter={20}>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات مجلس الأدارة"
                                            value={members} onChange={setMembers}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
                                                 <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="قبول / رفض" />
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
                                                 <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="قبول / رفض" />
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
                                                 <Checkbox value="2" label="اضافة" />
                                                <Checkbox value="3" label="إضافة صورة" />
                                                <Checkbox value="4" label="قبول / رفض" />
                                                <Checkbox value="5" label="طباعة البطاقة" />
                                                <Checkbox value="6" label="طباعة" />
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
                                                {/*<Checkbox value="3" label="تعديل" />*/}
                                                {/*<Checkbox value="4" label="حذف" />*/}
                                                <Checkbox value="5" label="تجديد الاشتراك" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات شكاوي وطلبات اللاعبين"
                                            value={complaints} onChange={setComplaints}
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
                                                <Checkbox value="3" label="فتح" />
                                                <Checkbox value="4" label="التعليقات" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات المصاريف"
                                            value={expenses} onChange={setExpenses}
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
                                            label="صلاحيات الاستمارات"
                                            value={forms} onChange={setForms}
                                        >
                                            <Group mt="xs">
                                                <Checkbox value="1" label="عرض" />
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
                                                {/*<Checkbox value="4" label="حذف" />*/}
                                            </Group>
                                        </Checkbox.Group>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox.Group
                                            defaultValue={['1']}
                                            label="صلاحيات البطولات"
                                            value={leagues} onChange={setLeagues}
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