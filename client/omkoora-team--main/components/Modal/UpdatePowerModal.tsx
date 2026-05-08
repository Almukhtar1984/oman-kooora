import {Accordion, Box, Button, Checkbox, Col, Divider, Grid, Group, PasswordInput, Text} from "@mantine/core";
import {Calendar, Check, Plus, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllMembersHasAccount, useMember, useUpdateAdminMember, useUpdatePermission, useUpdateUser} from "../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import { Notyf } from "notyf";

type Props = {
    id: string;
} & ModalProps;

const init = {
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
    const [idUser, setIdUser] = useState("");
    const [fullName, setFullName] = useState("");
    const [idPermissions, setIdPermissions] = useState("");
    const [updateUser] = useUpdateUser();
    const [updatePermission] = useUpdatePermission();

    const [members, setMembers] = useState<string[]>([]);
    const [technicals, setTechnicals] = useState<string[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [assembly, setAssembly] = useState<string[]>([]);
    const [inbox, setInbox] = useState<string[]>([]);
    const [outbox, setOutbox] = useState<string[]>([]);
    const [meeting, setMeeting] = useState<string[]>([]);
    const [forms, setForms] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [leagues, setLeagues] = useState<string[]>([]);

    const [expenses, setExpenses] = useState<string[]>([]);
    const [complaints, setComplaints] = useState<string[]>([]);

    const [getMember, { loading, error, data: dataMember }] = useMember();

    useEffect(() => {
        if (id && id !== "") {
            getMember({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened])

    useEffect(() => {
        if (dataMember && "member" in dataMember && dataMember.member !== null) {
            const member = dataMember.member
            setFullName(`${member?.person?.first_name} ${member?.person?.second_name} ${member?.person?.third_name} ${member?.person?.tribe}`)
            form.setValues({
                user: {
                    email: member?.person?.user?.email,
                    password: ""
                }
            })
            setIdUser(member?.person?.user?.id)

            const permission = member?.person?.user?.permission
            setIdPermissions(permission?.id)

            setMembers(permission?.members?.split(","))
            setTechnicals(permission?.technicals?.split(","))
            setPlayers(permission?.players?.split(","))
            setAssembly(permission?.assembly?.split(","))
            setInbox(permission?.inbox?.split(","))
            setOutbox(permission?.outbox?.split(","))
            setMeeting(permission?.meeting?.split(","))
            setForms(permission?.forms?.split(","))
            setPermissions(permission?.permissions?.split(","))
            setLeagues(permission?.leagues?.split(",") || [])
        }
    }, [dataMember])

    const onSubmit = (data: any) => {
        const {user } = data
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;

        updateUser({
            variables: {
                id: idUser,

                content: {
                    email:      user.email,
                    password:   user.password
                }
            },
            onCompleted: ({updateUser}) => {
                updatePermission({
                    variables: {
                        id: idPermissions,
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
                        }
                    },
                    onCompleted: ({createPermission}) => {
                        notyf?.success({message: "تمت التعديل بنجاح", duration: 10000});
                        closeModal();
                    },
                    refetchQueries: [AllMembersHasAccount],
                })
            },
            onError: ({graphQLErrors}) => {
                console.log(graphQLErrors)
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
                        <Col span={12}>
                            <Group position={"left"}>
                                <Text fw={"bold"}>الاسم الكامل : </Text>
                                <Text>{fullName}</Text>
                            </Group>
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