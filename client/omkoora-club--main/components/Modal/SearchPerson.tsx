import { ActionIcon, Box, Button, Col, Grid, Group, Image, Text, Stack, TextInput } from "@mantine/core";
import {Check, Search, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {useGetPerson} from "../../graphql";
import useStore from "../../store/useStore";
import {Notyf} from "notyf";


type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const SearchPerson = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {cardNumber: "123654"}
    });
    const [loading, setLoading] = useState(false);
    const [person, setPerson] = useState<any>(null);
    const [getPerson, {data, error}] = useGetPerson();

    useEffect(() => {
        if (data && "person" in data) {
            setPerson(data.person)
        }
    }, [data])

    const onFormSubmit = ({cardNumber}: any) => {
        setLoading(true)
        getPerson({
            variables: {cardNumber },
            fetchPolicy: "network-only",
            onCompleted: () => {
                setLoading(false)
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        props.onClose();
        reset();
    };

    
    return (
        <Modal
            size="lg"
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <Group w={"100%"} noWrap={true} align="flex-end">
                                <TextInput
                                    placeholder="الرقم المدني"
                                    withAsterisk
                                    w={"100%"}
                                    {...getInputProps("cardNumber")}
                                />
                                <ActionIcon variant="light" color="cyan" size={36} type="submit" loading={loading}>
                                    <Search size={20} />
                                </ActionIcon>
                            </Group>
                        </Col>
                        {person
                            ? <Col span={12} >
                                <Box>
                                    <Grid gutter={20}>
                                        <Col span={3} >
                                            {person?.personal_picture
                                                ? <Image src={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${person?.personal_picture}`} alt="" />
                                                : <Image src={"/profile-blank.jpg"} alt="" />
                                            }
                                        </Col>
                                        <Col span={8} >
                                            <Stack spacing={8}>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>الاسم الكامل :</Text>
                                                    <Text color="gray.7" size={"sm"}>{`${person?.first_name} ${person?.second_name} ${person?.third_name} ${person?.tribe}`}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>رقم الهاتف :</Text>
                                                    <Text color="gray.7" size={"sm"}>{person?.phone}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>الرقم المدني :</Text>
                                                    <Text color="gray.7" size={"sm"}>{person?.card_number}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>تاريخ الميلاد :</Text>
                                                    <Text color="gray.7" size={"sm"}>{person?.date_birth}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>نوع الشخص :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                    person?.member ? "عضو مجلس ادارة"
                                                        : person?.player ? "لاعب"
                                                            : person?.technicalApparatus ? "تقني فني"
                                                            : ""
                                                }</Text>
                                            </Group>
                                            </Stack>
                                        </Col>

                                        <Col span={6} >
                                            <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>النادي :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                    person?.member
                                                        ? person?.member?.team?.club?.name
                                                        : person?.player
                                                            ? person?.player?.team?.club?.name
                                                            : person?.technicalApparatus
                                                            ? person?.technicalApparatus?.team?.club?.name
                                                            : ""
                                                }</Text>
                                            </Group>
                                        </Col>
                                        <Col span={6} >
                                            <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>الفريق :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                    person?.member
                                                        ? person?.member?.team?.name
                                                        : person?.player
                                                            ? person?.player?.team?.name
                                                            : person?.technicalApparatus
                                                            ? person?.technicalApparatus?.team?.name
                                                            : ""
                                                }</Text>
                                            </Group>
                                        </Col>
                                    </Grid>
                                </Box>
                            </Col>
                            : null
                        }
                        
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};