import {Alert, Box, Button, Col, FileInput, Grid, Group, Loader, Overlay, Select, Stack, Text,} from "@mantine/core";
import {Calendar, Check, ChevronDown, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {
    AllTechnicals,
    AllTeams,
    useAddMember,
    useAddTeam,
    useAllMembers,
    useMember,
    useUpdateMember, usePlayer, useUpdatePlayer
} from "./../../graphql";
import useStore from "../../store/useStore";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";

type Props = {
    id: string;
} & ModalProps;

const init = {
    classes: "",
    activity: "",
    player_center: "",
    job: "",
    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: new Date(),
    }
}

export const UpdatePlayersModal = ({id, opened, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const form = useForm({
        initialValues: init
    });
    const openRef = useRef<() => void>(null);
    const openRefBack = useRef<() => void>(null);
    const [nationalID, setNationalID] = useState<File[]>([]);
    const [nationalIDBack, setNationalIDBack] = useState<File[]>([]);
    const [idPerson, setIdPerson] = useState("");
    const [updatePlayer] = useUpdatePlayer();
    const [load, setLoade] = useState(false);

    useEffect(() => {
        if (id && id !== "") {
            getPlayer({
                variables: {id},
                fetchPolicy: "network-only"
            })
        }
    }, [id, opened])
    const [getPlayer, { loading, error, data: dataPlayer }] = usePlayer();


    useEffect(() => {
        if (dataPlayer && "player" in dataPlayer) {
            form.setValues({
                classes: dataPlayer?.player?.class,
                activity: dataPlayer?.player?.activity,
                player_center: dataPlayer?.player?.player_center,
                job: dataPlayer?.player?.job,
                person: {
                    first_name: dataPlayer?.player?.person?.first_name,
                    second_name: dataPlayer?.player?.person?.second_name,
                    third_name: dataPlayer?.player?.person?.third_name,
                    tribe: dataPlayer?.player?.person?.tribe,
                    card_number: dataPlayer?.player?.person?.card_number,
                    date_birth: new Date(dataPlayer?.player?.person?.date_birth),
                    phone: dataPlayer?.player?.person?.phone
                }
            })
            setIdPerson(dataPlayer?.player?.person?.id)
        }
    }, [dataPlayer])

    const onSubmit = (data: any) => {
        const {classes, activity, player_center, job, person } = data

        updatePlayer({
            variables: {
                id,
                idPerson: idPerson,
                content: {
                    class: classes,
                    activity,
                    player_center,
                    job,

                    person: {
                        ...person,
                        date_birth: dayjs(person?.date_birth).format("YYYY-MM-DD")
                    }
                }
            },
            refetchQueries: [AllTechnicals]
        })
        .then(() => {
            closeModal();
        })
        .catch(reason => {
            setLoade(false)
            console.log(reason)
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setNationalID([])
        setNationalIDBack([])
        setLoade(false)
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
            {load ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={form.onSubmit(onSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <Alert variant="light" color="yellow">اذا قمت برفع مرفق بطاقة الهوية سيتم حذف المرفق القديم</Alert>
                        </Col>

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
                            <Select
                                label="الفئة العمرية"
                                placeholder="اختر الفئة العمرية"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}

                                data={[
                                    {label: "الفريق الاول", value: "firstDegree"},
                                    {label: "تحت 23 سنة", value: "secondDegree"},
                                    {label: "تحت 18 سنة", value: "young"},
                                    {label: "تحت 16 سنة", value: "rookies"}
                                ]}
                                {...form.getInputProps("classes")}
                            />
                        </Col>

                        <Col span={6}>
                            <TextInput
                                label="النشاط"
                                placeholder="النشاط"
                                withAsterisk
                                {...form.getInputProps("activity")}
                            />
                        </Col>

                        <Col span={6}>
                            <Select
                                label="مركز لاعب"
                                placeholder="مركز لاعب"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={['مهاجم', 'وسط', 'دفاع', 'حارس']}
                                {...form.getInputProps("player_center")}
                            />
                        </Col>

                        <Col span={6}>
                            <Select
                                label="العمل"
                                placeholder="العمل"
                                withAsterisk
                                rightSection={<ChevronDown size={14} />}
                                rightSectionWidth={30}
                                styles={{ rightSection: { pointerEvents: 'none' } }}
                                data={['طالب', 'باحث عن العمل', 'موظف']}
                                {...form.getInputProps("job")}
                            />
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                مرفق صورة الواجهة الامامية للبطاقة المدنية (image)
                                {nationalID && nationalID?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setNationalID(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                مرفق صورة الواجهة الخلفية للبطاقة المدنية (image)
                                {nationalIDBack && nationalIDBack?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRefBack}
                                activateOnClick={false}
                                multiple={false}
                                onDrop={(file) => setNationalIDBack(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={3 * 1024 ** 2}
                                accept={IMAGE_MIME_TYPE}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRefBack ? openRefBack?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};