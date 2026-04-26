import {Alert, Box, Button, Col, Grid, Group, Image, Loader, Overlay, Stack, Text,} from "@mantine/core";
import {AlertCircle, Check, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllPlayers, useAddUserImage} from "../../graphql";
import {Dropzone} from "@mantine/dropzone";

type Props = {
    id: string;
} & ModalProps;

export const AddImagePlayersModal = ({id, opened, ...props}: Props) => {
    const openRef = useRef<() => void>(null);
    const [file, setFile] = useState<File[] | null>(null);
    const [load, setLoade] = useState(false);
    const [addUserImag] = useAddUserImage();

    const onUploadImage = (payload: File[]) => {
        setFile([...payload])
    }

    const onSubmit = () => {
        setLoade(true)
        addUserImag({
            variables: {
                id,
                image: file?.[0],
            },
            refetchQueries: [AllPlayers]
        })
        .then(() => {
            closeModal();
            setLoade(false)
        })
        .catch(reason => {
            setLoade(false)
            console.log(reason)
        })
    };

    const closeModal = () => {
        props.onClose();
        setFile(null);
    };

    return (
        <Modal
            {...props}
            opened={opened}
            onClose={closeModal}
            size={"lg"}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button disabled={!(file && file?.length > 0)} rightIcon={<Check size={15} />} onClick={onSubmit}>تأكيد</Button>
                    </Group>
                </Box>
            }
        >
            {load ?
                <Overlay opacity={0.9} color="#fff" zIndex={5} >
                    <Stack align={"center"} justify={"center"} h={"100%"} w={"100%"}>
                        <Loader size="xl" variant="dots" />
                        <Text size={"lg"} fw={500}>يتم تحميل الصورة يرجى الانتظار</Text>
                    </Stack>
                </Overlay>
                : null
            }
            <Box sx={({ colors }) => ({padding: 20})}>

                <Grid gutter={20}>

                    <Col span={12} mb={20}>
                        <Alert icon={<AlertCircle size={16} />} color="yellow">
                            <Text>اذا كان اللاعب ليده صورة بالفعل سيتم استبدال الصورة الجديدة بالقديمة</Text>
                        </Alert>
                    </Col>
                    <Col span={12} >
                        <Dropzone
                            //placeholder={"صورة اللاعب"}
                            openRef={openRef}
                            activateOnClick={false}
                            multiple={false}
                            onDrop={(file) => onUploadImage(file)}
                            styles={{ inner: { pointerEvents: 'all' } }}
                            accept={["image/jpg", "image/png", "image/jpeg"]}
                        >
                            <Group position="center">
                                <Button onClick={() => {
                                    // @ts-ignore
                                    return openRef ? openRef?.current() : undefined
                                }}>اختار ملف / اسحب ملف الى هنا</Button>
                            </Group>
                        </Dropzone>
                    </Col>

                    <Col span={12}>
                        {file?.map((item, index) => {
                            const type = item.type.split("/")[0]
                            const imageUrl = URL.createObjectURL(item);

                            return (
                                <Image key={index} src={imageUrl} imageProps={{ onLoad: () => URL.revokeObjectURL(imageUrl) }}/>
                            );
                        })}
                    </Col>
                </Grid>
            </Box>
        </Modal>
    );
};
