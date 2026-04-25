import {
    Alert,
    Box,
    Button,
    Col,
    Container,
    Grid,
    Group,
    Loader,
    Overlay,
    Select,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import {Calendar, Check, ChevronDown} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import TextInput from "../component/Input/TextInput";
import Modal, { Props as ModalProps } from "../component/Modal/Modal";
import {useAddPlayer, useAllTeams, useAllClub} from "@/graphql";
import {DateInput, DatePicker} from "@mantine/dates";
import { useForm } from '@mantine/form';
import dayjs from "dayjs";
import {Dropzone, IMAGE_MIME_TYPE} from "@mantine/dropzone";
import {dateDiff } from "date-differencer";
import {Notyf} from "notyf";
import Head from "next/head";
import {NavBar} from "@/component/Header";

type Props = {} & ModalProps;

const init = {
    classes: "",
    player_center: "",
    job: "",

    person: {
        first_name: "",
        second_name: "",
        third_name: "",
        tribe: "",
        phone: "",
        card_number: "",
        date_birth: ""
    }
}

export default function AddPlayer (props: Props) {
    const form = useForm({
        initialValues: init
    });
    const openRef = useRef<() => void>(null);
    const openRefBack = useRef<() => void>(null);
    const [nationalID, setNationalID] = useState<File[]>([]);
    const [nationalIDBack, setNationalIDBack] = useState<File[]>([]);

    const [parentApproval, setParentApproval] = useState<File[]>([]);
    const [age, setAge] = useState<Date | null>(null);
    const [createPlayer] = useAddPlayer();
    const [load, setLoade] = useState(false);
    const [alert, setAlert] = useState<{ status?: string; msg?: string; code?: string; }>({});
    const [allTeams, setAllTeams] = useState<{label: string, value: string, disabled: boolean}[]>([]);
    const [allClubs, setAllClubs] = useState<{label: string, value: string}[]>([]);
    const [clubSelected, setClubSelected] = useState<string | null>("");

    const [getAllClubs, { loading: loadingAllClubs, error: errorAllClubs, data: dataAllClubs }] = useAllClub();

    useEffect(() => {
        getAllClubs({fetchPolicy: "cache-and-network"})
    }, [getAllClubs])

    useEffect(() => {
        if (dataAllClubs && "allClub" in dataAllClubs) {
            const allClubs: {label: string, value: string}[] = []

            dataAllClubs?.allClub?.map((item: any) => {
                allClubs.push({label: item?.name, value: item?.id})
            })

            setAllClubs([...allClubs])
        }
    }, [dataAllClubs])

    useEffect(() => {
        if (clubSelected) {
            const allTeams: {label: string, value: string, disabled: boolean}[] = []

            const club = dataAllClubs?.allClub?.filter((item: any) => item.id == clubSelected)
//enableAddPlayer
            club?.[0]?.teams?.map((item: any) => {
                allTeams.push({label: item?.name, value: item?.id, disabled: !item.enableAddPlayer})
            })

            setAllTeams([...allTeams])
        }
    }, [clubSelected, dataAllClubs?.allClub])

    const onSubmit = (data: any) => {
        setLoade(true)
        const {id_team, classes, player_center, job, person } = data
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });

        createPlayer({
            variables: {
                content: {
                    class: classes,
                    activity: "كرة قدم",
                    player_center,
                    job,
                    nationalID: nationalID?.[0],
                    nationalIDBack: nationalIDBack?.[0],
                    parentApproval: parentApproval?.[0],

                    person: {
                        ...person,
                        date_birth: dayjs(age).format("YYYY-MM-DD")
                    },
                    id_team
                }
            },
            onCompleted: () => {
                notyf.success({message: "تم تسجيل اللاعب بنجاح", type:"", duration: 10000});
                closeModal();
            },
            onError: ({graphQLErrors}) => {
                setLoade(false)
                if (graphQLErrors?.[0]?.extensions?.code == "CARD_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهوية موجود مسبقا", type:"error", duration: 10000});
                    setAlert({status: "red", msg: "رقم الهوية موجود مسبقا", code: ""});
                }

                if (graphQLErrors?.[0]?.extensions?.code == "PHONE_NUMBER_ALREADY_EXISTS") {
                    notyf.open({message: "رقم الهاتف موجود مسبقا", type:"error", duration: 10000});
                    setAlert({status: "red", msg: "رقم الهاتف موجود مسبقا", code: ""});
                }
            }
        })
    };

    const closeModal = () => {
        props.onClose();
        form.reset();
        setNationalID([])
        setParentApproval([])
        setAge(null)
        setLoade(false)
    };

    return (
        <>
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <NavBar />

            <Container size={"sm"} mb={80} mt={-50}>
                <Title color={"#444"} order={2} ta={"center"} mb={20} >تسجيل لاعب</Title>

                {alert.status && (
                    <Alert variant="filled" color={alert.status as string} sx={{ padding: "4px 16px" }} onClose={() => setAlert({})}>
                        {alert.msg}
                    </Alert>
                )}

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
                            <Col  xs={12} md={6}>
                                <Select
                                    placeholder="حدد النادي"
                                    withAsterisk
                                    rightSection={<ChevronDown size={14} />}
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}
                                    data={allClubs}
                                    value={clubSelected}
                                    onChange={setClubSelected}

                                    searchable={true}
                                    clearable={true}

                                    nothingFound="لا يوجد نوادي"
                                />
                            </Col>
                            <Col  xs={12} md={6}>
                                <Select
                                    placeholder="حدد الفريق"
                                    withAsterisk
                                    rightSection={<ChevronDown size={14} />}
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}
                                    data={allTeams}
                                    {...form.getInputProps("id_team")}

                                    searchable={true}
                                    clearable={true}

                                    nothingFound="لا يوجد فرق"
                                />
                            </Col>


                            <Col  xs={12} md={6}>
                                <TextInput
                                    label="الاسم الاول"
                                    placeholder="الاسم الاول"
                                    withAsterisk
                                    {...form.getInputProps("person.first_name")}
                                />
                            </Col>
                            <Col  xs={12} md={6}>
                                <TextInput
                                    label="الاسم الثاني"
                                    placeholder="الاسم الثاني"
                                    withAsterisk
                                    {...form.getInputProps("person.second_name")}
                                />
                            </Col>
                            <Col  xs={12} md={6}>
                                <TextInput
                                    label="الاسم الثالث"
                                    placeholder="الاسم الثالث"
                                    withAsterisk
                                    {...form.getInputProps("person.third_name")}
                                />
                            </Col>
                            <Col  xs={12} md={6}>
                                <TextInput
                                    label="القبيلة"
                                    placeholder="القبيلة"
                                    withAsterisk
                                    {...form.getInputProps("person.tribe")}
                                />
                            </Col>

                            <Col  xs={12} md={6}>
                                <TextInput
                                    label="رقم الهاتف"
                                    placeholder="رقم الهاتف"
                                    withAsterisk
                                    {...form.getInputProps("person.phone")}
                                />
                            </Col>
                            <Col  xs={12} md={6}>
                                <TextInput
                                    label="رقم البطاقه"
                                    placeholder="رقم البطاقه"
                                    withAsterisk
                                    {...form.getInputProps("person.card_number")}
                                />
                            </Col>
                            <Col  xs={12} md={6}>
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


                            <Col  xs={12} md={6}>
                                <Select
                                    label="الفئة العمرية"
                                    placeholder="اختر الفئة العمرية"
                                    withAsterisk
                                    rightSection={<ChevronDown size={14} />}
                                    rightSectionWidth={30}
                                    styles={{ rightSection: { pointerEvents: 'none' } }}

                                    data={[
                                        {label: "الدرجة الاولى", value: "firstDegree"},
                                        {label: "الشباب", value: "young"},
                                        {label: "الناشئين", value: "rookies"}
                                    ]}
                                    {...form.getInputProps("classes")}
                                />
                            </Col>

                            <Col  xs={12} md={6}>
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
                            <Col  xs={12} md={6}>
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

                            {age && dateDiff(age, new Date())?.years < 18 ?
                                <Col span={12} >
                                    <Text size={"sm"} mb={10} >استمارة موافقة ولي الامر (PDF)</Text>
                                    <Dropzone
                                        openRef={openRef}
                                        activateOnClick={false}
                                        multiple={false}
                                        onDrop={(file) => setParentApproval(file)}
                                        styles={{ inner: { pointerEvents: 'all' } }}
                                        accept={{'application/pdf': ['.pdf'],}}
                                    >
                                        <Group position="center">
                                            <Button onClick={() => {
                                                // @ts-ignore
                                                return openRef ? openRef?.current() : undefined
                                            }}>اختار ملف / اسحب ملف الى هنا</Button>
                                        </Group>
                                    </Dropzone>
                                </Col>
                                : null
                            }

                            <Col span={12}>
                                <Group position={"right"}>
                                    <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                                </Group>
                            </Col>
                        </Grid>
                    </form>
                </Box>
            </Container>
        </>
    );
};
