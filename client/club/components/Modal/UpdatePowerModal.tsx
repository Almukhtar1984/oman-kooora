import {Accordion, Box, Button, Checkbox, Col, Divider, FileInput, Grid, Group, PasswordInput, Select, Switch,} from "@mantine/core";
import {Calendar, Check, ChevronDown, Plus, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllTechnicals, useMember, useChangeStatusMember, useUpdateMember, useAdminUpdateMember, useUpdatePermission, useUpdateClubManagement, AllClubManagement, usePermission, useClubManagement} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import { Notyf } from "notyf";

type Props = {
    id: string;
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
        email: "",
        password: ""
    },
}

export const UpdatePowerModal = ({id, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const {setValues} = form;
    const [idPerson, setIdPerson] = useState("");
    const [idPermissions, setIdPermissions] = useState("");
    const [updateAdminMember] = useUpdateClubManagement();
    const [updatePermission] = useUpdatePermission();

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

    const [getClubManagement, { loading, error, data: dataClubManagement }] = useClubManagement();

    useEffect(() => {
        if (id && id !== "") {
            getClubManagement({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened, getClubManagement])

    useEffect(() => {
        if (dataClubManagement && "clubManagement" in dataClubManagement && dataClubManagement.clubManagement !== null) {
            const clubManagement = dataClubManagement.clubManagement
            setValues({
                membership_date: new Date(clubManagement?.membership_date) || null,

                membership_date_end: new Date(clubManagement?.membership_date_end) || null,
                person: {
                    first_name: clubManagement?.person?.first_name,
                    second_name: clubManagement?.person?.second_name,
                    third_name: clubManagement?.person?.third_name,
                    tribe: clubManagement?.person?.tribe,
                    card_number: clubManagement?.person?.card_number,
                    date_birth: new Date(clubManagement?.person?.date_birth) || null,
                    phone: clubManagement?.person?.phone
                },
                user: {
                    email: clubManagement?.person?.user?.email,
                    password: ""
                }
            })
            setIdPerson(clubManagement?.person?.id)

            const permission = clubManagement?.person?.user?.permission
            setIdPermissions(permission?.id)

            setTeams(permission?.teams?.split(","))
            setMembers(permission?.members?.split(","))
            setTechnicals(permission?.technicals?.split(","))
            setPlayers(permission?.players?.split(","))
            setTransferPlayers(permission?.transferPlayers?.split(","))
            setLoanPlayers(permission?.loanPlayers?.split(","))
            setAssembly(permission?.assembly?.split(","))
            setInbox(permission?.inbox?.split(","))
            setOutbox(permission?.outbox?.split(","))
            setMeeting(permission?.meeting?.split(","))
            setBlogs(permission?.blogs?.split(","))
            setForms(permission?.forms?.split(","))
            setPermissions(permission?.permissions?.split(","))
        }
    }, [dataClubManagement, setValues])

    const onSubmit = (data: any) => {
        const {membership_date, membership_date_end, person, user } = data
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        updateAdminMember({
            variables: {
                id,
                idPerson: idPerson,

                content: {
                    membership_date: dayjs(membership_date).format("YYYY-MM-DD"),
                    membership_date_end: dayjs(membership_date_end).format("YYYY-MM-DD"),

                    user: {
                        email:      user.email,
                        password:   user.password,

                        person: {
                            ...person,
                            date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                        },
                    }
                }
            },
            onCompleted: ({updateClubManagement}) => {
                updatePermission({
                    variables: {
                        id: idPermissions,
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
                            permissions:      permissions
                        }
                    },
                    onCompleted: ({createPermission}) => {
                        notyf.open({message: "تمت التعديل بنجاح", type:"error", duration: 10000});
                        closeModal();
                    },
                    refetchQueries: [AllClubManagement],
                })
            },
            onError: ({graphQLErrors}) => {
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
            opened={opened}
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
