import { Alert, Box, Button, Col, Grid, Group, Loader, Overlay, Stack, Table, Text } from "@mantine/core";
import {Check, InfoCircle, X} from "tabler-icons-react";
import React, {useEffect, useRef, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import useStore from "../../store/useStore";
import {Dropzone, IMAGE_MIME_TYPE, MS_EXCEL_MIME_TYPE} from "@mantine/dropzone";
import {Notyf} from "notyf";
import * as XLSX from 'xlsx';
import { useAddListPlayer } from "../../graphql";


type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const AddListPlayers = ({data, ...props}: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {subject: "", short_description: ""}
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [allDataImported, setAllDataImported] = useState([]);
    const [allData, setAllData] = useState([]);
    const [allContents, setAllContents] = useState([]);
    const openRef = useRef<() => void>(null);
    const [createListPlayer] = useAddListPlayer()

    const readFile = (file) => {
        const reader = new FileReader();
        
        reader.onload = (e: any) => {
            const data = new Uint8Array(e?.target?.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

            // console.log({excelData});
            
            for (let index = 0; index < excelData.length; index++) {
                const element = excelData[index];
                //@ts-ignore
                if (element?.length >= 14) {
                    //@ts-ignore
                    setAllDataImported((prv) => [...prv, element])
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    useEffect(() => {
        const file = attachments[0];
        if (file) {
            readFile(file);
        }
    }, [attachments]);

    useEffect(() => {
        let allData = []
        //@ts-ignore
        for (let index = 0; index < allDataImported?.length; index++) {
            const element = allDataImported[index];
            let allElements = []
            //@ts-ignore
            for (let index2 = 0; index2 < element?.length; index2++) {
                const element2 = element[index2];
                if(element2 !== undefined) {
                    allElements.push(element2)
                }
            }
            //@ts-ignore
            allData.push(allElements)
        }
        setAllData(allData)
    }, [allDataImported]);

    useEffect(() => {
        let allContent: any = []
        for (let index = 0; index < allData.length; index++) {
            if (index > 2) {
                const element = allData[index];
                allContent.push({
                    activity: "",
                    player_center: "",
                    job: "",
                    class: "firstDegree",
    
                    person: {
                        //@ts-ignore
                        first_name: element[1],
                        //@ts-ignore
                        second_name: element[2],
                        //@ts-ignore
                        third_name: element[3],
                        //@ts-ignore
                        tribe: element[4],

                        //@ts-ignore
                        phone: element[6]?.toString(),
                        //@ts-ignore
                        card_number: element[7]?.toString(),
                        //@ts-ignore
                        date_birth: element[8]?.toString(),
                    },
                    id_team: data
                })
            }
        }
        setAllContents(allContent)
    }, [allData]);

    const onFormSubmit = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        
        createListPlayer({
            variables: {content: allContents},
            onCompleted: ({createListPlayer}) => {
                console.log(createListPlayer);
                notyf.success("تم اضافة اللاعبين انتقل الى صفحة اللاعبين لتستطيع مشاهدت القائمة")
                closeModal()
            },
            onError: (error) => {
                notyf.success("فشلت اضافة اللاعبين")
                console.log(error);
            },
        })
    };

    const closeModal = () => {
        setLoading(false)
        setAttachments([])
        setAllDataImported([])
        setAllData([])
        setAllContents([])
        props.onClose();
        reset();
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {loading ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الملف يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }

            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <Alert variant="light" color="orange" icon={<InfoCircle />}>
                                يجب ان تكون جميع حقول الجدول مملؤة بعد الرفع
                            </Alert>
                        </Col>

                        <Col span={12} >
                            <Text size={"sm"} mb={10} >
                                المرفقات
                                {attachments && attachments?.length > 0 ? <Text color={"green"} span={true}> تم الرفع </Text> : null}
                            </Text>
                            <Dropzone
                                openRef={openRef}
                                activateOnClick={false}
                                multiple={true}
                                onDrop={(file) => setAttachments(file)}
                                styles={{ inner: { pointerEvents: 'all' } }}
                                maxSize={20 * 1024 ** 2}
                                accept={MS_EXCEL_MIME_TYPE}
                                style={{
                                    borderColor: attachments && attachments?.length > 0 ? "green" : "#9ca3af",
                                    background: attachments && attachments?.length > 0 ? "#0080002e" : "#fff",
                                }}
                            >
                                <Group position="center">
                                    <Button onClick={() => {
                                        // @ts-ignore
                                        return openRef ? openRef?.current() : undefined
                                    }}>اختار ملف / اسحب ملف الى هنا</Button>
                                </Group>
                            </Dropzone>
                        </Col>

                        {allData.length > 0
                            ? <Col span={12} >
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>م</th>
                                            <th>الاسم الاول</th>
                                            <th>الاسم الثاني</th>
                                            <th>الاسم الثالث</th>
                                            <th>القبيلة</th>
                                            <th>الحالة</th>
                                            <th>رقم الهاتف</th>
                                            <th>تاريخ الميلاد</th>
                                            <th>الرقم المدني</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allData.slice(1, allData.length).map((item: any, index) => (
                                            index >= 2
                                                ? <tr key={index}>
                                                    {item?.map((item2: any, index2) => (
                                                        <td key={index2}>
                                                            {item2}
                                                        </td>
                                                    ))}
                                                </tr>
                                                : null
                                        ))}
                                    </tbody>
                                </Table>
                            </Col>
                            : null
                        }
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};